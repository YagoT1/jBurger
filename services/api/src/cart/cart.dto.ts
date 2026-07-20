import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class AddCartItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsInt() @Min(1) quantity!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) notas?: string;
  @ApiProperty({
    required: false,
    description: 'Versión conocida del carrito (concurrencia optimista).',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  cartVersion?: number;
}

export class UpdateCartItemDto {
  @ApiProperty() @IsInt() @Min(1) quantity!: number;
  @ApiProperty() @IsInt() @Min(1) cartVersion!: number;
}

export class GuestCartItemDto {
  @ApiProperty() @IsUUID() productId!: string;
  @ApiProperty() @IsInt() quantity!: number;
  @ApiProperty({ required: false }) @IsOptional() @IsString() @MaxLength(200) notas?: string;
}

export class MergeCartDto {
  @ApiProperty({ type: [GuestCartItemDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => GuestCartItemDto)
  items!: GuestCartItemDto[];
}
