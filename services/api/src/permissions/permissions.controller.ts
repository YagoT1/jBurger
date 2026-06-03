import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { permissionVocabulary, permissionVocabularyVersion } from '@jburger/domain-permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';
@ApiTags('permissions') @ApiBearerAuth() @Controller('permissions') @UseGuards(AuthenticatedGuard, PermissionGuard)
export class PermissionsController { @Get() @RequirePermissions('permissions.read') list() { return { version: permissionVocabularyVersion, data: permissionVocabulary }; } }
