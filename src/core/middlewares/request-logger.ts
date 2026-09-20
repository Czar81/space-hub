import pinoHttp from "pino-http";
import { logger } from "@/core/utils/logger";

export const requestLogger = pinoHttp({ logger });