import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { securityContextMiddleware } from './common/middleware/security.middleware.js';
import { validateEnvironment } from './config/environment.js';
import { HealthModule } from './health/health.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';
@Module({ imports: [ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }), HealthModule, AuthModule, UsersModule, RolesModule, PermissionsModule, BranchesModule, AuditModule] })
export class AppModule implements NestModule { configure(consumer: MiddlewareConsumer) { consumer.apply(securityContextMiddleware).forRoutes('*'); } }
