import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class CreateRoleDto { @ApiProperty() @IsString() key!: string; @ApiProperty() @IsString() nombre!: string; }
