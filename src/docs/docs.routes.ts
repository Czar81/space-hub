import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiSpec } from "@/docs/openapi";

const router = Router();

/** GET /api/docs.json - raw OpenAPI document. */
router.get("/docs.json", (_req, res) => {
  res.json(openApiSpec);
});

/** GET /api/docs - interactive Swagger UI generated from the OpenAPI document. */
router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(openApiSpec, { customSiteTitle: "SpaceHub API Docs" })
);

export default router;
