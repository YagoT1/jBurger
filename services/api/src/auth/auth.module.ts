import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService, FetchSupabaseAuthGateway, SessionService } from '@jburger/domain-auth';
import type { AuthRepository, SessionRepository, SupabaseAuthGateway } from '@jburger/domain-auth';
import type { EventPublisher } from '@jburger/domain-events';
import { LoggingEventPublisher } from '../common/events/logging-event.publisher.js';
import { EVENT_PUBLISHER } from '../common/events/tokens.js';
import { SupabaseRestClient } from '../common/persistence/supabase-rest.client.js';
import { AuthController } from './auth.controller.js';
import {
  DevAuthGateway,
  DevAuthRepository,
  InMemorySessionRepository,
} from './persistence/dev-auth.infrastructure.js';
import {
  SupabaseAuthRepository,
  SupabaseSessionRepository,
} from './persistence/supabase-auth.repositories.js';

export const AUTH_INFRASTRUCTURE = 'AUTH_INFRASTRUCTURE';

export interface AuthInfrastructure {
  gateway: SupabaseAuthGateway;
  authRepository: AuthRepository;
  sessionRepository: SessionRepository;
}

const createAuthInfrastructure = (config: ConfigService): AuthInfrastructure => {
  const url = config.get<string>('SUPABASE_URL');
  const anonKey = config.get<string>('SUPABASE_ANON_KEY');
  const serviceRoleKey = config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
  if (url && anonKey && serviceRoleKey) {
    const client = new SupabaseRestClient({ url, serviceRoleKey });
    return {
      gateway: new FetchSupabaseAuthGateway({ url, anonKey }),
      authRepository: new SupabaseAuthRepository(client),
      sessionRepository: new SupabaseSessionRepository(client),
    };
  }
  if (config.get<string>('NODE_ENV') === 'production') {
    throw new Error(
      'SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are required in production.',
    );
  }
  return {
    gateway: new DevAuthGateway(),
    authRepository: new DevAuthRepository(),
    sessionRepository: new InMemorySessionRepository(),
  };
};

@Global()
@Module({
  controllers: [AuthController],
  providers: [
    { provide: AUTH_INFRASTRUCTURE, useFactory: createAuthInfrastructure, inject: [ConfigService] },
    { provide: EVENT_PUBLISHER, useClass: LoggingEventPublisher },
    {
      provide: SessionService,
      useFactory: (infrastructure: AuthInfrastructure, events: EventPublisher): SessionService =>
        new SessionService(infrastructure.sessionRepository, events),
      inject: [AUTH_INFRASTRUCTURE, EVENT_PUBLISHER],
    },
    {
      provide: AuthService,
      useFactory: (
        infrastructure: AuthInfrastructure,
        sessions: SessionService,
        events: EventPublisher,
      ): AuthService =>
        new AuthService(infrastructure.gateway, infrastructure.authRepository, sessions, events),
      inject: [AUTH_INFRASTRUCTURE, SessionService, EVENT_PUBLISHER],
    },
  ],
  exports: [AuthService, SessionService],
})
export class AuthModule {}
