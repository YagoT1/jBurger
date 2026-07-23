import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PaymentDomainError } from '@jburger/domain-payments';
import type { PaymentErrorCode } from '@jburger/domain-payments';

const STATUS_BY_CODE: Record<PaymentErrorCode, number> = {
  PAYMENT_ALREADY_APPROVED: HttpStatus.CONFLICT,
  PAYMENT_CONFLICT: HttpStatus.CONFLICT,
  ORDER_NOT_PAYABLE: HttpStatus.UNPROCESSABLE_ENTITY,
  ORDER_NOT_FOUND: HttpStatus.NOT_FOUND,
  PAYMENT_NOT_FOUND: HttpStatus.NOT_FOUND,
  WEBHOOK_INVALID: HttpStatus.BAD_REQUEST,
  PROVIDER_UNAVAILABLE: HttpStatus.SERVICE_UNAVAILABLE,
};

/** Traduce errores tipados del dominio de pagos a respuestas HTTP homogéneas. */
@Catch(PaymentDomainError)
export class PaymentDomainErrorFilter implements ExceptionFilter<PaymentDomainError> {
  catch(exception: PaymentDomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.BAD_REQUEST;
    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
      ...(exception.details ? { details: exception.details } : {}),
    });
  }
}
