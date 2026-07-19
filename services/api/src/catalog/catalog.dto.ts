import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export const supportedCurrencies = ['ARS', 'USD', 'MXN', 'EUR'] as const;
export type SupportedCurrency = (typeof supportedCurrencies)[number];
export class CreateCategoryDto {
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(80) nombre!: string;
  @ApiProperty({ required: false, default: 0 }) @IsOptional() @IsInt() @Min(0) orden?: number;
}
export class UpdateCategoryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  nombre?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsInt() @Min(0) orden?: number;
}
export class CreateProductDto {
  @ApiProperty() @IsUUID() categoriaId!: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(120) nombre!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) descripcion?: string;
  @ApiProperty() @IsNumber() @IsPositive() precioAmount!: number;
  @ApiProperty({ required: false, enum: supportedCurrencies, default: 'ARS' })
  @IsOptional()
  @IsIn(supportedCurrencies)
  precioCurrency?: SupportedCurrency;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) imagenUrl?: string;
}
export class UpdateProductDto {
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() categoriaId?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  nombre?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) descripcion?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsNumber() @IsPositive() precioAmount?: number;
  @ApiProperty({ required: false, enum: supportedCurrencies })
  @IsOptional()
  @IsIn(supportedCurrencies)
  precioCurrency?: SupportedCurrency;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(500) imagenUrl?: string;
}
export class SetAvailabilityDto {
  @ApiProperty() @IsUUID() branchId!: string;
  @ApiProperty() @IsBoolean() disponible!: boolean;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  precioOverrideAmount?: number;
  @ApiProperty({ required: false, enum: supportedCurrencies })
  @IsOptional()
  @IsIn(supportedCurrencies)
  precioOverrideCurrency?: SupportedCurrency;
}
