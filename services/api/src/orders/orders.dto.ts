import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

const currencies = ['ARS', 'USD', 'MXN', 'EUR'] as const;

export class MoneyDto {
  @ApiProperty() @IsInt() @Min(0) amount!: number;
  @ApiProperty({ enum: currencies }) @IsIn(currencies) currency!: (typeof currencies)[number];
}

export class DeliveryAddressDto {
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(200) line1!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) line2?: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120) city!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(120) state!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(20) postalCode!: string;
  @ApiProperty() @IsString() @IsNotEmpty() @MaxLength(2) country!: string;
}

export class PlaceOrderDto {
  @ApiProperty() @IsUUID() idempotencyKey!: string;
  @ApiProperty({ enum: ['pickup', 'delivery'] }) @IsIn(['pickup', 'delivery']) fulfillmentType!:
    | 'pickup'
    | 'delivery';
  @ApiProperty({ type: MoneyDto }) @ValidateNested() @Type(() => MoneyDto) expectedTotal!: MoneyDto;
  @ApiProperty({ required: false, type: DeliveryAddressDto })
  @ValidateIf((dto: PlaceOrderDto) => dto.fulfillmentType === 'delivery')
  @IsObject()
  @ValidateNested()
  @Type(() => DeliveryAddressDto)
  direccionEntrega?: DeliveryAddressDto;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) notas?: string;
}

export class TransitionOrderDto {
  @ApiProperty({ enum: ['confirmado', 'preparacion', 'entregado'] })
  @IsIn(['confirmado', 'preparacion', 'entregado'])
  to!: 'confirmado' | 'preparacion' | 'entregado';
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(300) reason?: string;
}

export class CancelOrderDto {
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(300) reason?: string;
}
