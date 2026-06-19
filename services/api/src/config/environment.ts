import { z } from 'zod';

export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:54322/postgres'),
  JWT_SECRET: z.string().min(32).default('local-development-secret-at-least-32-chars'),
  SUPABASE_URL: z.string().url().default('http://localhost:54321'),
  SUPABASE_ANON_KEY: z.string().min(1).default('local-development-anon-key'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3002'),
});

export type Environment = z.infer<typeof environmentSchema>;
export const validateEnvironment = (config: Record<string, unknown>): Environment =>
  environmentSchema.parse(config);
