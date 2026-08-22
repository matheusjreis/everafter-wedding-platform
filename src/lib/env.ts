import { z } from "zod";

const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_JWT_SECRET: z.string().optional(),
  PAYMENT_PROVIDER: z.enum(["mock", "mercado-pago", "pagar-me", "asaas", "stripe"]).default("mock"),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export const env = serverEnvSchema.parse(process.env);
