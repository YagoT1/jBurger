import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { InMemoryEventPublisher } from '@jburger/domain-events';
import { PaymentService } from '@jburger/domain-payments';
import { CartPricingService, CartService } from '@jburger/domain-cart';
import { CheckoutService, OrderService } from '@jburger/domain-orders';
import {
  InMemoryAvailabilityRepository,
  InMemoryCategoryRepository,
  InMemoryMenuSource,
  InMemoryProductRepository,
} from '../catalog/persistence/in-memory-catalog.repositories.js';
import {
  DEMO_BRANCH_ID,
  DEMO_TENANT_ID,
  InMemoryCatalogStore,
  seedDemoCatalog,
} from '../catalog/persistence/in-memory-catalog.store.js';
import { CatalogSourceAdapter } from '../cart/persistence/catalog-source.adapter.js';
import { InMemoryCartRepository } from '../cart/persistence/in-memory-cart.repository.js';
import { CheckoutCartSourceAdapter } from '../orders/persistence/checkout-cart-source.adapter.js';
import { InMemoryOrderRepository } from '../orders/persistence/in-memory-order.repository.js';
import { InMemoryPaymentRepository } from './persistence/in-memory-payment.repository.js';
import { PaymentOrderSourceAdapter } from './persistence/payment-order-source.adapter.js';
import { MockPaymentGateway } from './providers/mock-payment.gateway.js';
import type { PaymentWebhookVerifier } from './providers/payment-webhook.verifier.js';
import {
  decodeExternalReference,
  encodeExternalReference,
  mapMercadoPagoStatus,
  verifyMercadoPagoSignature,
} from './providers/payment-webhook.verifier.js';

const CUSTOMER = 'f0000000-0000-4000-8000-000000000001';
const SIMPLE = 'd0000000-0000-4000-8000-000000000001';

const setup = () => {
  const store = new InMemoryCatalogStore();
  seedDemoCatalog(store);
  const catalogAdapter = new CatalogSourceAdapter({
    categories: new InMemoryCategoryRepository(store),
    products: new InMemoryProductRepository(store),
    availability: new InMemoryAvailabilityRepository(store),
    menu: new InMemoryMenuSource(store),
  });
  const events = new InMemoryEventPublisher();
  const cartService = new CartService(
    new InMemoryCartRepository(),
    catalogAdapter,
    { maxItemQuantity: 20 },
    events,
  );
  const orderRepository = new InMemoryOrderRepository();
  const checkout = new CheckoutService(
    new CheckoutCartSourceAdapter(cartService, new CartPricingService(catalogAdapter)),
    orderRepository,
    events,
  );
  const orders = new OrderService(orderRepository, events);
  const payments = new PaymentService(
    new InMemoryPaymentRepository(orderRepository),
    new PaymentOrderSourceAdapter(orderRepository),
    new MockPaymentGateway(),
    events,
  );
  return { cartService, checkout, orders, payments, events };
};

const placeOrder = async (context: ReturnType<typeof setup>, idempotencyKey: string) => {
  await context.cartService.addItem({
    tenantId: DEMO_TENANT_ID,
    customerId: CUSTOMER,
    branchId: DEMO_BRANCH_ID,
    productId: SIMPLE,
    quantity: 1,
    actorId: CUSTOMER,
  });
  return context.checkout.placeOrder({
    tenantId: DEMO_TENANT_ID,
    customerId: CUSTOMER,
    branchId: DEMO_BRANCH_ID,
    idempotencyKey,
    fulfillmentType: 'pickup',
    expectedTotal: { amount: 7500, currency: 'ARS' },
    actorId: CUSTOMER,
  });
};

describe('Payments wiring (checkout real → pago → confirmación del pedido)', () => {
  it('PT-1/PT-3: el pago aprobado confirma el pedido con monto tomado del pedido', async () => {
    const context = setup();
    const order = await placeOrder(context, '00000000-0000-4000-8000-0000000000d1');

    const pago = await context.payments.initiatePayment({
      tenantId: DEMO_TENANT_ID,
      orderId: order.id,
      customerId: CUSTOMER,
      idempotencyKey: '00000000-0000-4000-8000-0000000000e1',
      actorId: CUSTOMER,
    });
    expect(pago.estado).toBe('pendiente');
    expect(pago.monto).toEqual(order.total);
    expect(pago.checkoutUrl).toBeDefined();

    await context.payments.handleProviderEvent({
      tenantId: DEMO_TENANT_ID,
      paymentId: pago.id,
      providerPaymentId: 'mp_wiring_1',
      targetEstado: 'aprobado',
      eventType: 'payment.approved',
    });

    const confirmed = await context.orders.findById(DEMO_TENANT_ID, order.id);
    expect(confirmed?.estado).toBe('confirmado');
  });

  it('PT-8: un pedido ya confirmado no admite iniciar un pago nuevo', async () => {
    const context = setup();
    const order = await placeOrder(context, '00000000-0000-4000-8000-0000000000d2');
    await context.orders.transition({
      tenantId: DEMO_TENANT_ID,
      orderId: order.id,
      to: 'confirmado',
      actorId: 'staff',
    });
    await expect(
      context.payments.initiatePayment({
        tenantId: DEMO_TENANT_ID,
        orderId: order.id,
        customerId: CUSTOMER,
        idempotencyKey: '00000000-0000-4000-8000-0000000000e2',
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_PAYABLE' });
  });

  it('PT-7: un pedido de otro tenant no es visible para el dominio de pagos', async () => {
    const context = setup();
    const order = await placeOrder(context, '00000000-0000-4000-8000-0000000000d3');
    await expect(
      context.payments.initiatePayment({
        tenantId: 'a0000000-0000-4000-8000-000000000999',
        orderId: order.id,
        customerId: CUSTOMER,
        idempotencyKey: '00000000-0000-4000-8000-0000000000e3',
        actorId: CUSTOMER,
      }),
    ).rejects.toMatchObject({ code: 'ORDER_NOT_FOUND' });
  });
});

describe('Verificación de webhooks de Mercado Pago', () => {
  const SECRET = 'test-webhook-secret';
  const REQUEST_ID = 'bb56a2f1-6aae-46ac-982e-9dcd3581d08e';
  const DATA_ID = '123456';

  /** Manifiesto documentado por Mercado Pago: `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`. */
  const sign = (ts: string): string =>
    createHmac('sha256', SECRET)
      .update(`id:${DATA_ID};request-id:${REQUEST_ID};ts:${ts};`)
      .digest('hex');

  it('PT-5: acepta una firma válida y rechaza una manipulada', () => {
    const ts = '1742505638683';
    const valid = sign(ts);
    expect(verifyMercadoPagoSignature(`ts=${ts},v1=${valid}`, REQUEST_ID, DATA_ID, SECRET)).toBe(
      true,
    );
    // Firma de otro data.id: el atacante no puede reutilizarla.
    expect(verifyMercadoPagoSignature(`ts=${ts},v1=${valid}`, REQUEST_ID, '999', SECRET)).toBe(
      false,
    );
    // Secreto incorrecto.
    expect(verifyMercadoPagoSignature(`ts=${ts},v1=${valid}`, REQUEST_ID, DATA_ID, 'otro')).toBe(
      false,
    );
    // Header incompleto o malformado.
    expect(verifyMercadoPagoSignature(`v1=${valid}`, REQUEST_ID, DATA_ID, SECRET)).toBe(false);
    expect(verifyMercadoPagoSignature('', REQUEST_ID, DATA_ID, SECRET)).toBe(false);
  });

  it('el proveedor mock nunca acepta notificaciones entrantes', async () => {
    // A través del puerto: así lo invoca el controller, con firma y data.id presentes.
    const verifier: PaymentWebhookVerifier = new MockPaymentGateway();
    await expect(
      verifier.verify({ signature: `ts=1,v1=${sign('1')}`, requestId: REQUEST_ID }, DATA_ID),
    ).resolves.toBeUndefined();
  });

  it('la referencia externa transporta tenant y pago de ida y vuelta', () => {
    const reference = encodeExternalReference(DEMO_TENANT_ID, 'pay_1');
    expect(decodeExternalReference(reference)).toEqual({
      tenantId: DEMO_TENANT_ID,
      paymentId: 'pay_1',
    });
    expect(decodeExternalReference('sin-separador')).toBeUndefined();
    expect(decodeExternalReference('a:b:c')).toBeUndefined();
  });

  it('solo los estados terminales de Mercado Pago producen transición', () => {
    expect(mapMercadoPagoStatus('approved')).toBe('aprobado');
    expect(mapMercadoPagoStatus('rejected')).toBe('rechazado');
    expect(mapMercadoPagoStatus('cancelled')).toBe('rechazado');
    expect(mapMercadoPagoStatus('refunded')).toBe('reembolsado');
    expect(mapMercadoPagoStatus('charged_back')).toBe('reembolsado');
    expect(mapMercadoPagoStatus('pending')).toBeUndefined();
    expect(mapMercadoPagoStatus('in_process')).toBeUndefined();
  });
});
