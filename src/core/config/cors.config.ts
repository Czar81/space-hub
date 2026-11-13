import { CorsOptions } from "cors";
import { env } from "@/core/config/env.config";

/** CORS policy: only `CORS_ORIGIN` may call the API from a browser. */
export const corsConfig: CorsOptions = {
  origin: env.CORS_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
