import { Controller, Get, NotImplementedException, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { defaultRoleKeys } from '@jburger/domain-roles';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';

const NOT_IMPLEMENTED =
  'Role management is not implemented yet. This endpoint intentionally returns 501 instead of fabricating success (functional review 2026-07-22, defect B2).';

/** El listado devuelve el vocabulario real de roles; la escritura NO está implementada (501 explícito). */
@ApiTags('roles')
@ApiBearerAuth()
@Controller('roles')
@UseGuards(AuthenticatedGuard, PermissionGuard)
export class RolesController {
  @Get() @RequirePermissions('roles.read') list() {
    return { data: defaultRoleKeys };
  }
  @Post() @RequirePermissions('roles.write') create(): never {
    throw new NotImplementedException(NOT_IMPLEMENTED);
  }
  @Get(':id') @RequirePermissions('roles.read') get(): never {
    throw new NotImplementedException(NOT_IMPLEMENTED);
  }
}
