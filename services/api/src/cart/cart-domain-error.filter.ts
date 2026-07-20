import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { CartDomainError } from '@jburger/domain-cart';
import type { CartErrorCode } from '@jburger/domain-cart';

const STATUS_BY_CODE: Record<CartErrorCode, number> = {
  VERSION_CONFLICT: HttpStatus.CONFLICT,
  QUANTITY_OUT_OF_RANGE: HttpStatus.BAD_REQUEST,
  PRODUCT_NOT_FOUND: HttpStatus.NOT_FOUND,
  ITEM_NOT_FOUND: HttpStatus.NOT_FOUND,
  CART_NOT_FOUND: HttpStatus.NOT_FOUND,
  PRODUCT_UNAVAILABLE: HttpStatus.UNPROCESSABLE_ENTITY,
};

/** Traduce errores tipados del dominio de carrito a respuestas HTTP homogéneas sin acoplar el dominio a HTTP. */
@Catch(CartDomainError)
export class CartDomainErrorFilter implements ExceptionFilter<CartDomainError> {
  catch(exception: CartDomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.BAD_REQUEST;
    response
      .status(status)
      .json({ statusCode: status, code: exception.code, message: exception.message });
  }
}
