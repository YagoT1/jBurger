import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
export class LoginDto {
  @ApiProperty() @IsEmail() email!: string;
  @ApiProperty() @IsString() @MinLength(8) password!: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() tenantId?: string;
  @ApiProperty({ required: false }) @IsOptional() @IsUUID() branchId?: string;
}
export class LogoutDto {
  @ApiProperty() @IsUUID() sessionId!: string;
}
export class RefreshDto {
  @ApiProperty() @IsString() @MinLength(10) refreshToken!: string;
}
