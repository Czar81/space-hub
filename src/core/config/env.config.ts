import dotenv from "dotenv";
import { z } from "zod";
import { Environments } from "@/core/types/index";

dotenv.config();

const envSchema = z.object({
  // Runtime
  NODE_ENV: z.enum(Environments).default(Environments.Development),
  PORT: z.coerce.number().default(3000),
  DEBUG_MODE: z.stringbool().default(false),

  // Database
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  // JWT
  JWT_SECRET: z.string().min(10, { message: "JWT_SECRET must be at least 10 characters long" }),
  JWT_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // CORS
  CORS_ORIGIN: z.url().default("http://localhost:5173"),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Configuration error in the environment variables:");
    console.error(z.prettifyError(result.error));
    process.exit(1);
  }

  return result.data;
};

const parsedEnv = parseEnv();

export const env = {
  ...parsedEnv,
  DATABASE_URL: `postgresql://${parsedEnv.DB_USER}:${parsedEnv.DB_PASSWORD}@${parsedEnv.DB_HOST}:${parsedEnv.DB_PORT}/${parsedEnv.DB_NAME}`,
};