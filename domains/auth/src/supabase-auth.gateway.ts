import type { AuthTokens, LoginCommand, SupabaseAuthGateway } from './contracts.js';

interface SupabaseAuthGatewayOptions {
  url: string;
  anonKey: string;
}

/**
 * Error del gateway de autenticación. Conserva el detalle original de GoTrue
 * (status HTTP, código y descripción) para diagnóstico interno.
 * Nunca debe exponerse al cliente ni contener credenciales.
 */
export class AuthGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorCode?: string,
    readonly errorDescription?: string,
  ) {
    super(message);
    this.name = 'AuthGatewayError';
  }
}

const parseGatewayError = async (
  response: Response,
): Promise<{ code?: string; description?: string }> => {
  try {
    const body = (await response.json()) as Record<string, unknown>;
    const code =
      typeof body['error_code'] === 'string'
        ? body['error_code']
        : typeof body['error'] === 'string'
          ? body['error']
          : undefined;
    const description =
      typeof body['error_description'] === 'string'
        ? body['error_description']
        : typeof body['msg'] === 'string'
          ? body['msg']
          : undefined;
    return {
      ...(code !== undefined ? { code } : {}),
      ...(description !== undefined ? { description } : {}),
    };
  } catch {
    return {};
  }
};

const throwGatewayError = async (message: string, response: Response): Promise<never> => {
  const { code, description } = await parseGatewayError(response);
  throw new AuthGatewayError(message, response.status, code, description);
};

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
      await throwGatewayError('Invalid credentials.', response);
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
      await throwGatewayError('Invalid access token.', response);
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
      await throwGatewayError('Invalid refresh token.', response);
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
