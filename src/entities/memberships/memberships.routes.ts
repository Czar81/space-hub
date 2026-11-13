import { Router } from "express";
import { validate } from "@/core/middlewares/validate";
import { asyncHandler } from "@/core/utils/async-handler";
import { authenticate, requireAdmin } from "@/core/middlewares/auth";
import { membershipsService } from "@/entities/memberships/memberships.service";
import {
  updateMembershipSchema,
  userIdParamSchema,
} from "@/entities/memberships/memberships.schema";

const router = Router();

/** Membership management is admin only. */
router.use(authenticate, requireAdmin);

/** GET /api/memberships - active memberships. 200 | 401 | 403 */
router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json(await membershipsService.listActive());
  })
);

/** PATCH /api/memberships/:userId - updates the plan. 200 | 400 | 401 | 403 | 404 */
router.patch(
  "/:userId",
  validate(userIdParamSchema, "params"),
  validate(updateMembershipSchema),
  asyncHandler(async (req, res) => {
    res.json(await membershipsService.updatePlan(Number(req.params.userId), req.body));
  })
);

export default router;
