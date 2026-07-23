import { createHmac, timingSafeEqual } from 'node:crypto';
import type { EstadoPago } from '@jburger/domain-types';

/**
 * Resultado de verificar y resolver una notificación entrante del proveedor.
 * `undefined` como retorno del verificador significa notificación no verificable o irrelevante:
 * nunca se muta estado a partir de una notificación no verificada (PT-5).
 */
export interface ResolvedWebhook {
  providerPaymentId: string;
  tenantId: string;
  paymentId: string;
  targetEstado: Exclude<EstadoPago, 'pendiente'>;
  eventType: string;
}

/**
 * La referencia externa enviada al proveedor codifica `tenantId:paymentId`.
 * El webhook es tenant-agnóstico: llevar el tenant en la referencia evita exponer una
 * búsqueda de pagos entre tenants en el repositorio (toda consulta sigue filtrando por tenant).
 */
export const encodeExternalReference = (tenantId: string, paymentId: string): string =>
  `${tenantId}:${paymentId}`;

export const decodeExternalReference = (
  reference: string,
): { tenantId: string; paymentId: string } | undefined => {
  const [tenantId, paymentId, ...rest] = reference.split(':');
  if (!tenantId || !paymentId || rest.length > 0) {
    return undefined;
  }
  return { tenantId, paymentId };
};

export interface WebhookHeaders {
  signature?: string | undefined;
  requestId?: string | undefined;
}

/**
 * Puerto de verificación de webhooks. Vive en la capa API (no en el dominio) porque su único
 * consumidor es el controller: el dominio recibe eventos YA verificados.
 */
export interface PaymentWebhookVerifier {
  verify(headers: WebhookHeaders, dataId: string | undefined): Promise<ResolvedWebhook | undefined>;
}

/**
 * Estados de Mercado Pago mapeados a la máquina de estados del pago.
 * Los estados no terminales (pending/in_process/authorized) no producen transición.
 */
export const mapMercadoPagoStatus = (
  status: string,
): Exclude<EstadoPago, 'pendiente'> | undefined => {
  switch (status) {
    case 'approved':
      return 'aprobado';
    case 'rejected':
    case 'cancelled':
      return 'rechazado';
    case 'refunded':
    case 'charged_back':
      return 'reembolsado';
    default:
      return undefined;
  }
};

/**
 * Verificación de firma de Mercado Pago: HMAC-SHA256 hex sobre el manifiesto
 * `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`, con la clave secreta del webhook.
 * `x-signature` llega como `ts=<timestamp>,v1=<hash>`.
 */
export const verifyMercadoPagoSignature = (
  signatureHeader: string,
  requestId: string,
  dataId: string,
  secret: string,
): boolean => {
  const parts = new Map(
    signatureHeader.split(',').map((part) => {
      const [key, ...rest] = part.split('=');
      return [key?.trim() ?? '', rest.join('=').trim()] as const;
    }),
  );
  const ts = parts.get('ts');
  const received = parts.get('v1');
  if (!ts || !received) {
    return false;
  }
  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac('sha256', secret).update(manifest).digest('hex');
  const expectedBuffer = Buffer.from(expected, 'utf8');
  const receivedBuffer = Buffer.from(received, 'utf8');
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }
  return timingSafeEqual(expectedBuffer, receivedBuffer);
};
