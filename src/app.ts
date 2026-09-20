import express from "express";
import cors from "cors";

import { corsConfig } from "@/core/config/cors.config";
import { requestLogger } from "@/core/middlewares/request-logger";
import { errorHandler } from "@/core/middlewares/error.handler";
import { globalLimiter, authLimiter, graphqlLimiter } from "@/core/middlewares/rate-limiter";
import { notFoundHandler } from "@/core/middlewares/not-found.handler";

import authRoutes from "@/entities/auth/auth.routes";
import spacesRoutes from "@/entities/spaces/spaces.routes";
import bookingsRoutes from "@/entities/bookings/bookings.routes";
import membershipsRoutes from "@/entities/memberships/memberships.routes";
import healthRoutes from "@/core/health.routes";
import { graphqlHandler } from "@/graphql/graphql.handler";

const app = express();

app.set("trust proxy", 1);

app.use(cors(corsConfig));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);
app.use(globalLimiter);

app.use("/", healthRoutes);

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/spaces", spacesRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/memberships", membershipsRoutes);

app.use("/api/graphql", graphqlLimiter, graphqlHandler);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;