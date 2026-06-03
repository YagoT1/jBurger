import { Body, Controller, Get, Post, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { LoginDto, LogoutDto } from './auth.dto.js';
@ApiTags('auth')
@Controller('auth')
@UseInterceptors(AuditInterceptor)
export class AuthController {
  @Post('login') login(@Body() dto: LoginDto) { return { user: { email: dto.email, tenantId: dto.tenantId, branchId: dto.branchId }, accessToken: 'development-access-token', refreshToken: 'development-refresh-token', sessionId: crypto.randomUUID(), expiresAt: new Date(Date.now() + 3600_000).toISOString() }; }
  @Post('logout') @ApiBearerAuth() @UseGuards(AuthenticatedGuard) logout(@Body() dto: LogoutDto) { return { revoked: true, sessionId: dto.sessionId }; }
  @Get('me') @ApiBearerAuth() @UseGuards(AuthenticatedGuard) me(@CurrentUser() user: unknown) { return { user }; }
  @Get('sessions') @ApiBearerAuth() @UseGuards(AuthenticatedGuard) @RequirePermissions('sessions.read') sessions() { return { data: [] }; }
}
