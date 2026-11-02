import { Router } from "express";
import { validate } from "@/core/middlewares/validate";
import { asyncHandler } from "@/core/utils/async-handler";
import { idParamSchema } from "@/core/schemas/id-param.schema";
import { authenticate, requireAdmin } from "@/core/middlewares/auth";
import { spacesService } from "@/entities/spaces/spaces.service";
import {
  createSpaceSchema,
  listSpacesQuerySchema,
  updateSpaceSchema,
} from "@/entities/spaces/spaces.schema";

const router = Router();

/** GET /api/spaces - public. Active spaces with optional filters. 200 | 400 */
router.get(
  "/",
  validate(listSpacesQuerySchema, "query"),
  asyncHandler(async (req, res) => {
    res.json(await spacesService.list(req.query));
  })
);

/** GET /api/spaces/:id - public. 200 | 400 | 404 */
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await spacesService.getActiveById(Number(req.params.id)));
  })
);

/** POST /api/spaces - admin. 201 | 400 | 401 | 403 */
router.post(
  "/",
  authenticate,
  requireAdmin,
  validate(createSpaceSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await spacesService.create(req.body));
  })
);

/** PUT /api/spaces/:id - admin. 200 | 400 | 401 | 403 | 404 */
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  validate(updateSpaceSchema),
  asyncHandler(async (req, res) => {
    res.json(await spacesService.update(Number(req.params.id), req.body));
  })
);

/** DELETE /api/spaces/:id - admin. Deactivates the space. 200 | 400 | 401 | 403 | 404 */
router.delete(
  "/:id",
  authenticate,
  requireAdmin,
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await spacesService.deactivate(Number(req.params.id)));
  })
);

export default router;
