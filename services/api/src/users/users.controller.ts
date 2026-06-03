import { Body, Controller, Get, Param, Patch, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { BranchGuard } from '../common/guards/branch.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { AssignRoleDto, CreateUserDto, UpdateUserDto } from './users.dto.js';
@ApiTags('users') @ApiBearerAuth() @Controller('users') @UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard, PermissionGuard) @UseInterceptors(AuditInterceptor)
export class UsersController {
  @Get() @RequirePermissions('users.read') list() { return { data: [] }; }
  @Post() @RequirePermissions('users.write') create(@Body() dto: CreateUserDto) { return { id: crypto.randomUUID(), active: true, ...dto }; }
  @Get(':id') @RequirePermissions('users.read') get(@Param('id') id: string) { return { id }; }
  @Patch(':id') @RequirePermissions('users.write') update(@Param('id') id: string, @Body() dto: UpdateUserDto) { return { id, ...dto }; }
  @Post(':id/disable') @RequirePermissions('users.write') disable(@Param('id') id: string) { return { id, active: false }; }
  @Post(':id/roles') @RequirePermissions('roles.write') assignRole(@Param('id') id: string, @Body() dto: AssignRoleDto) { return { userId: id, roleId: dto.roleId, assigned: true }; }
}
