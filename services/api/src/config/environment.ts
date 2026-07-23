import { z } from 'zod';
export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:54322/postgres'),
  JWT_SECRET: z.string().min(32).default('local-development-secret-at-least-32-chars'),
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3002'),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  MAX_CART_ITEM_QUANTITY: z.coerce.number().int().min(1).max(99).default(20),
  // Pagos: sin credenciales el módulo usa el proveedor mock (fail-fast en producción).
  MERCADOPAGO_ACCESS_TOKEN: z.string().min(1).optional(),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().min(1).optional(),
  /** URL pública de esta API: destino de las notificaciones del proveedor. */
  PUBLIC_API_URL: z.url().default('http://localhost:3001'),
  /** URL pública del frontend: destino del redirect posterior al pago. */
  PUBLIC_APP_URL: z.url().default('http://localhost:3000'),
});
export type Environment = z.infer<typeof environmentSchema>;
export const validateEnvironment = (config: Record<string, unknown>): Environment =>
  environmentSchema.parse(config);
