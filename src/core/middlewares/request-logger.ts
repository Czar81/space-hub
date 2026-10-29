import pinoHttp from "pino-http";
import { logger } from "@/core/utils/logger";

/** Logs every HTTP request/response through the shared logger. */
export const requestLogger = pinoHttp({ logger });
