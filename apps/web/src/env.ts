import { z } from 'zod';
export const env = z.object({ NEXT_PUBLIC_APP_ENV: z.string().default('local'), NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001') }).parse({ NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV, NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL });
