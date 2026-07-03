import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { BranchesModule } from './branches/branches.module.js';
import { branchMiddleware } from './common/middleware/branch.middleware.js';
import { securityContextMiddleware } from './common/middleware/security.middleware.js';
import { tenantMiddleware } from './common/middleware/tenant.middleware.js';
import { validateEnvironment } from './config/environment.js';
import { CommerceModule } from './commerce.module.js';
import { HealthModule } from './health/health.module.js';
import { OrderingModule } from './ordering.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { RolesModule } from './roles/roles.module.js';
import { UsersModule } from './users/users.module.js';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment }),
    HealthModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    BranchesModule,
    AuditModule,
    CommerceModule,
    OrderingModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(securityContextMiddleware, tenantMiddleware, branchMiddleware).forRoutes('*');
  }
}
