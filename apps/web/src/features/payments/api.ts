import { apiRequest, type ApiContext } from '../../lib/api/http.js';
import type { Money } from '../../entities/money.js';

export type PaymentStatus = 'pendiente' | 'aprobado' | 'rechazado' | 'reembolsado' | 'expirado';

export interface Payment {
  id: string;
  orderId: string;
  status: PaymentStatus;
  checkoutUrl?: string;
  amount: Money;
}

interface PaymentDto {
  id: string;
  orderId: string;
  estado: PaymentStatus;
  checkoutUrl?: string;
  monto: Money;
}

const toPayment = (dto: PaymentDto): Payment => ({
  id: dto.id,
  orderId: dto.orderId,
  status: dto.estado,
  ...(dto.checkoutUrl !== undefined ? { checkoutUrl: dto.checkoutUrl } : {}),
  amount: dto.monto,
});

/** Inicia el pago MP (SC-07). Idempotente por clave: el reintento devuelve el mismo intento (PT-2). */
export const initiatePayment = async (
  context: ApiContext,
  orderId: string,
  idempotencyKey: string,
): Promise<Payment> => {
  const response = await apiRequest<{ data: PaymentDto }>(`/orders/${orderId}/payment`, context, {
    method: 'POST',
    body: { idempotencyKey },
    timeoutMs: 15000,
  });
  return toPayment(response.data);
};

/** Estado del pago (SC-08/SC-09): la verdad viene del backend, nunca del redirect de MP. */
export const fetchPayment = async (context: ApiContext, orderId: string): Promise<Payment> => {
  const response = await apiRequest<{ data: PaymentDto }>(`/orders/${orderId}/payment`, context);
  return toPayment(response.data);
};
