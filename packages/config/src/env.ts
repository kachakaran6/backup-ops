import { z } from 'zod';

export const AppEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  BACKUP_OPS_ENV: z.string().default('development'),

  // PostgreSQL
  DATABASE_URL: z.string().url(),
  POSTGRES_DB: z.string().default('backup_ops'),
  POSTGRES_USER: z.string().default('backup_ops'),
  POSTGRES_PASSWORD: z.string().optional(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Security Secrets
  BACKUP_OPS_JWT_SECRET: z.string().min(16),
  BACKUP_OPS_API_KEY: z.string().min(8),
  BACKUP_OPS_ENCRYPTION_KEY: z.string().min(32),

  // Agent
  BACKUP_OPS_AGENT_ENDPOINT: z.string().url().optional(),
  BACKUP_OPS_AGENT_SECRET: z.string().optional(),
});

export type AppEnv = z.infer<typeof AppEnvSchema>;

export function validateEnv(env: Record<string, unknown> = process.env): AppEnv {
  const result = AppEnvSchema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.format();
    throw new Error(`Environment validation failed: ${JSON.stringify(errorDetails, null, 2)}`);
  }
  return result.data;
}
