import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { OrderDomainError } from '@jburger/domain-orders';
import type { OrderErrorCode } from '@jburger/domain-orders';

const STATUS_BY_CODE: Record<OrderErrorCode, number> = {
  PRICE_CHANGED: HttpStatus.CONFLICT,
  CART_CONFLICT: HttpStatus.CONFLICT,
  TRANSITION_CONFLICT: HttpStatus.CONFLICT,
  CART_INVALID_ITEMS: HttpStatus.UNPROCESSABLE_ENTITY,
  INVALID_TRANSITION: HttpStatus.UNPROCESSABLE_ENTITY,
  CART_EMPTY: HttpStatus.BAD_REQUEST,
  CART_NOT_FOUND: HttpStatus.NOT_FOUND,
  ORDER_NOT_FOUND: HttpStatus.NOT_FOUND,
};

/** Traduce errores tipados del dominio de pedidos a respuestas HTTP homogéneas. */
@Catch(OrderDomainError)
export class OrderDomainErrorFilter implements ExceptionFilter<OrderDomainError> {
  catch(exception: OrderDomainError, host: ArgumentsHost): void {
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
