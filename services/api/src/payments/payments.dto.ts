import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class InitiatePaymentDto {
  @ApiProperty({ description: 'Clave de idempotencia del intento de pago (UUID v4).' })
  @IsUUID()
  idempotencyKey!: string;
}
