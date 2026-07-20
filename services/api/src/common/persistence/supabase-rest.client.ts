import { ConflictException, ServiceUnavailableException } from '@nestjs/common';

export interface SupabaseRestOptions {
  url: string;
  serviceRoleKey: string;
}

/** Cliente PostgREST server-side (service role). Toda consulta debe filtrar por tenant explícitamente. */
export class SupabaseRestClient {
  constructor(private readonly options: SupabaseRestOptions) {}
  private headers(prefer?: string): Record<string, string> {
    return {
      apikey: this.options.serviceRoleKey,
      authorization: `Bearer ${this.options.serviceRoleKey}`,
      'content-type': 'application/json',
      ...(prefer ? { prefer } : {}),
    };
  }
  async select<TRow>(pathWithQuery: string): Promise<TRow[]> {
    const response = await fetch(`${this.options.url}/rest/v1/${pathWithQuery}`, {
      headers: this.headers(),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException('Data storage is unavailable.');
    }
    return (await response.json()) as TRow[];
  }
  async insert<TRow>(
    path: string,
    body: Record<string, unknown>,
    prefer = 'return=representation',
  ): Promise<TRow[]> {
    const response = await fetch(`${this.options.url}/rest/v1/${path}`, {
      method: 'POST',
      headers: this.headers(prefer),
      body: JSON.stringify(body),
    });
    if (response.status === 409) {
      throw new ConflictException('Resource already exists.');
    }
    if (!response.ok) {
      throw new ServiceUnavailableException('Data storage is unavailable.');
    }
    return (await response.json()) as TRow[];
  }
  async patch<TRow>(pathWithQuery: string, body: Record<string, unknown>): Promise<TRow[]> {
    const response = await fetch(`${this.options.url}/rest/v1/${pathWithQuery}`, {
      method: 'PATCH',
      headers: this.headers('return=representation'),
      body: JSON.stringify(body),
    });
    if (response.status === 409) {
      throw new ConflictException('Resource already exists.');
    }
    if (!response.ok) {
      throw new ServiceUnavailableException('Data storage is unavailable.');
    }
    return (await response.json()) as TRow[];
  }
  /** Invoca una función Postgres vía PostgREST RPC. Devuelve el resultado escalar/JSON de la función. */
  async rpc<TResult>(functionName: string, args: Record<string, unknown>): Promise<TResult> {
    const response = await fetch(`${this.options.url}/rest/v1/rpc/${functionName}`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(args),
    });
    if (!response.ok) {
      throw new ServiceUnavailableException('Data storage is unavailable.');
    }
    return (await response.json()) as TResult;
  }
}

export const eq = (value: string): string => `eq.${encodeURIComponent(value)}`;
