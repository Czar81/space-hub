import pino from "pino";
import path from "path";
import { env } from "@/core/config/env.config";
import { Environments } from "@/core/types/index";

const isDevelopment = env.NODE_ENV === Environments.Development;

const logFilePath = path.join(process.cwd(), "tmp", "app.log");

const transport = pino.transport({
  targets: [
    ...(isDevelopment
      ? [
          {
            target: "pino-pretty",
            options: {
              colorize: true,
              translateTime: "HH:MM:ss",
              ignore: "pid,hostname",
            },
            level: env.DEBUG_MODE ? "debug" : "info",
          },
        ]
      : []),
    {
      target: "pino/file",
      options: { destination: logFilePath, mkdir: true },
      level: env.DEBUG_MODE ? "debug" : "info",
    },
  ],
});

export const logger = pino(
  {
    level: env.DEBUG_MODE ? "debug" : "info",
  },
  transport
);