import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthorizationContext } from '@jburger/authorization';
import { AuthGatewayError, AuthService, SessionService } from '@jburger/domain-auth';
import { AuditInterceptor } from '../common/interceptors/audit.interceptor.js';
import { AuthenticatedGuard } from '../common/guards/authenticated.guard.js';
import { PermissionGuard } from '../common/guards/permission.guard.js';
import { RequirePermissions } from '../common/decorators/permissions.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { SecuredRequest } from '../security/security.types.js';
import { LoginDto, LogoutDto, RefreshDto } from './auth.dto.js';

const singleHeader = (value: string | string[] | undefined): string | undefined =>
  Array.isArray(value) ? value[0] : value;

@ApiTags('auth')
@Controller('auth')
@UseInterceptors(AuditInterceptor)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
  ) {}

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() request: SecuredRequest) {
    try {
      const result = await this.authService.login({
        email: dto.email,
        password: dto.password,
        tenantId: dto.tenantId,
        branchId: dto.branchId,
        ipAddress: singleHeader(request.headers['x-forwarded-for']),
        userAgent: singleHeader(request.headers['user-agent']),
      });
      return {
        user: {
          id: result.principal.id,
          email: result.principal.email,
          tenantId: result.principal.tenantId,
          branchId: result.principal.branchId,
          roleKeys: result.principal.roleKeys,
          permissions: result.principal.permissions,
        },
        accessToken: result.tokens.accessToken,
        refreshToken: result.tokens.refreshToken,
        expiresAt: result.tokens.expiresAt,
        sessionId: result.sessionId,
      };
    } catch (error) {
      // Diagnóstico interno con el detalle original del fallo (nunca credenciales, nunca expuesto al cliente).
      console.error(
        JSON.stringify({
          type: 'auth_login_failure',
          email: dto.email,
          reason: error instanceof Error ? error.message : 'unknown',
          ...(error instanceof AuthGatewayError
            ? {
                gatewayStatus: error.status,
                gatewayCode: error.errorCode,
                gatewayDescription: error.errorDescription,
              }
            : {}),
        }),
      );
      // Mensaje único para credenciales inválidas y usuarios sin asignación: no filtrar cuál falló.
      throw new UnauthorizedException('Invalid credentials.');
    }
  }

  @Post('refresh')
  async refresh(@Body() dto: RefreshDto) {
    try {
      return await this.authService.refresh(dto.refreshToken);
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }
  }

  @Post('logout')
  @ApiBearerAuth()
  @UseGuards(AuthenticatedGuard)
  async logout(@Body() dto: LogoutDto, @CurrentUser() user: AuthorizationContext | undefined) {
    const actorId = user?.actorId ?? 'unknown';
    const ownSessions = await this.sessionService.listByUser(actorId);
    const ownsSession = ownSessions.some((session) => session.id === dto.sessionId);
    if (!ownsSession && !(user?.permissions ?? []).includes('sessions.revoke')) {
      throw new ForbiddenException('Cannot revoke a session that does not belong to you.');
    }
    await this.sessionService.revoke(dto.sessionId, actorId);
    return { revoked: true, sessionId: dto.sessionId };
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AuthenticatedGuard)
  me(@CurrentUser() user: AuthorizationContext | undefined) {
    return { user };
  }

  @Get('sessions')
  @ApiBearerAuth()
  @UseGuards(AuthenticatedGuard, PermissionGuard)
  @RequirePermissions('sessions.read')
  async sessions(@CurrentUser() user: AuthorizationContext | undefined) {
    return { data: await this.sessionService.listByUser(user?.actorId ?? 'unknown') };
  }
}
