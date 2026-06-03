import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';
export class CreateUserDto { @ApiProperty() @IsEmail() email!: string; @ApiProperty() @IsString() nombre!: string; @ApiProperty({ required: false, type: [String] }) @IsOptional() @IsArray() roleIds?: string[]; }
export class UpdateUserDto { @ApiProperty({ required: false }) @IsOptional() @IsEmail() email?: string; @ApiProperty({ required: false }) @IsOptional() @IsString() nombre?: string; }
export class AssignRoleDto { @ApiProperty() @IsString() roleId!: string; }
