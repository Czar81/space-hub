import { CorsOptions } from "cors";
import { env } from "@/core/config/env.config";

export const corsConfig: CorsOptions = {
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};