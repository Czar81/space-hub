import { PrismaClient } from "@prisma/client";
import { env } from "@/core/config/env.config";

/** Shared Prisma client, connected with the URL composed in the env config. */
const prisma = new PrismaClient({ datasourceUrl: env.DATABASE_URL });

export default prisma;
