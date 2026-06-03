export type RuntimeEnvironment = 'development' | 'test' | 'production';
export interface WebEnvironment { NEXT_PUBLIC_APP_ENV: string; NEXT_PUBLIC_API_URL: string; }
export interface ApiEnvironment { NODE_ENV: RuntimeEnvironment; PORT: number; DATABASE_URL: string; JWT_SECRET: string; CORS_ORIGINS: string[]; }
export const required = (value: string | undefined, name: string): string => { if (!value) throw new Error(`Missing required environment variable: ${name}`); return value; };
export const parseCsv = (value: string | undefined): string[] => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);
export const parsePort = (value: string | undefined, fallback = 3001): number => { const parsed = Number(value ?? fallback); if (!Number.isInteger(parsed) || parsed <= 0) throw new Error('PORT must be a positive integer'); return parsed; };
