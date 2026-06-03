import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { defaultRoleKeys } from '@jburger/domain-roles';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';
import { CreateRoleDto } from './roles.dto.js';
@ApiTags('roles') @ApiBearerAuth() @Controller('roles') @UseGuards(AuthenticatedGuard, PermissionGuard)
export class RolesController { @Get() @RequirePermissions('roles.read') list() { return { data: defaultRoleKeys }; } @Post() @RequirePermissions('roles.write') create(@Body() dto: CreateRoleDto) { return { id: crypto.randomUUID(), ...dto }; } @Get(':id') @RequirePermissions('roles.read') get(@Param('id') id: string) { return { id }; } }
