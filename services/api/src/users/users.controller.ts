import {
  Controller,
  Get,
  NotImplementedException,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { BranchGuard } from '../common/guards/branch.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';
import { TenantGuard } from '../common/guards/tenant.guard.js';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';

const NOT_IMPLEMENTED =
  'User management is not implemented yet. This endpoint intentionally returns 501 instead of fabricating success (functional review 2026-07-22, defect B1/B2).';

/**
 * Gestión de usuarios: NO implementada. Los endpoints devuelven 501 de forma explícita.
 * Nunca deben confirmar operaciones que no persisten (un "deshabilitado" falso es un
 * defecto de seguridad, no una funcionalidad pendiente).
 */
@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthenticatedGuard, TenantGuard, BranchGuard, PermissionGuard)
@UseInterceptors(AuditInterceptor)
export class UsersController {
  @Get() @RequirePermissions('users.read') list(): never {
    throw new NotImplementedException(NOT_IMPLEMENTED);
  }
  @Post() @RequirePermissions('users.write') create(): never {
    throw new NotImplementedException(NOT_IMPLEMENTED);
  }
  @Get(':id') @RequirePermissions('users.read') get(): never {
    throw new NotImplementedException(NOT_IMPLEMENTED);
  }
  @Patch(':id') @RequirePermissions('users.write') update(): never {
    throw new NotImplementedException(NOT_IMPLEMENTED);
  }
  @Post(':id/disable') @RequirePermissions('users.write') disable(): never {
    throw new NotImplementedException(NOT_IMPLEMENTED);
  }
  @Post(':id/roles') @RequirePermissions('roles.write') assignRole(): never {
    throw new NotImplementedException(NOT_IMPLEMENTED);
  }
}
