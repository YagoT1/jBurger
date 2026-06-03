import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
export class LoginDto { @ApiProperty() @IsEmail() email!: string; @ApiProperty() @IsString() @MinLength(8) password!: string; @ApiProperty({ required: false }) @IsOptional() @IsString() tenantId?: string; @ApiProperty({ required: false }) @IsOptional() @IsString() branchId?: string; }
export class LogoutDto { @ApiProperty() @IsString() sessionId!: string; }
