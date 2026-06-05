import type { AuthTokens, LoginCommand, SupabaseAuthGateway } from './contracts.js';

interface SupabaseAuthGatewayOptions {
  url: string;
  anonKey: string;
}

export class FetchSupabaseAuthGateway implements SupabaseAuthGateway {
  constructor(private readonly options: SupabaseAuthGatewayOptions) {}

  async signInWithPassword(
    command: LoginCommand,
  ): Promise<{ userId: string; email?: string; tokens: AuthTokens }> {
    const response = await fetch(`${this.options.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: this.options.anonKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        email: command.email,
        password: command.password,
      }),
    });

    if (!response.ok) {
      throw new Error('Invalid credentials.');
    }

    const body = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
      user: {
        id: string;
        email?: string;
      };
    };

    return {
      userId: body.user.id,
      ...(body.user.email ? { email: body.user.email } : {}),
      tokens: {
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        expiresAt: new Date(Date.now() + body.expires_in * 1000).toISOString(),
      },
    };
  }

  async validateAccessToken(accessToken: string): Promise<{ userId: string; email?: string }> {
    const response = await fetch(`${this.options.url}/auth/v1/user`, {
      headers: {
        apikey: this.options.anonKey,
        authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Invalid access token.');
    }

    const user = (await response.json()) as {
      id: string;
      email?: string;
    };

    return {
      userId: user.id,
      ...(user.email ? { email: user.email } : {}),
    };
  }

  async refreshSession(refreshToken: string): Promise<AuthTokens> {
    const response = await fetch(`${this.options.url}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: this.options.anonKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error('Invalid refresh token.');
    }

    const body = (await response.json()) as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    return {
      accessToken: body.access_token,
      refreshToken: body.refresh_token,
      expiresAt: new Date(Date.now() + body.expires_in * 1000).toISOString(),
    };
  }
}
