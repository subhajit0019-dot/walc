import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  ADMIN_EMAIL: z.string().email("ADMIN_EMAIL must be a valid email"),
  ADMIN_PASSWORD_HASH: z.string().min(10, "ADMIN_PASSWORD_HASH is required"),
  ED25519_PRIVATE_KEY: z
    .string()
    .length(64, "ED25519_PRIVATE_KEY must be a 64-character hex string"),
  ED25519_PUBLIC_KEY: z
    .string()
    .length(64, "ED25519_PUBLIC_KEY must be a 64-character hex string"),
  DOWNLOAD_TOKEN_SECRET: z
    .string()
    .min(16, "DOWNLOAD_TOKEN_SECRET must be at least 16 characters"),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env;

export function getEnv(): Env {
  if (validatedEnv) return validatedEnv;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.warn("⚠️ Environment variables not yet configured in Vercel:", parsed.error.format());
  }

  validatedEnv = (parsed.success ? parsed.data : process.env) as Env;
  return validatedEnv;
  return validatedEnv;
}
