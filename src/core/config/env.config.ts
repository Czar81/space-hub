import dotenv from "dotenv";
import { z } from "zod";
import { Environments } from "@/core/types/index";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(Environments).default(Environments.Development),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url({ message: "DATABASE_URL must be a valid URL" }),
  JWT_SECRET: z.string().min(10, { message: "JWT_SECRET must be at least 10 characters long" }),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("Configuration error in the environment variables:");
    console.error(JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
