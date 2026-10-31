import { Router } from "express";
import { validate } from "@/core/middlewares/validate";
import { asyncHandler } from "@/core/utils/async-handler";
import { authService } from "@/entities/auth/auth.service";
import { loginSchema, refreshSchema, registerSchema } from "@/entities/auth/auth.schema";

const router = Router();

/** POST /api/auth/register - public. Creates a MEMBER account. 201 | 400 | 409 */
router.post(
  "/register",
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await authService.register(req.body));
  })
);

/** POST /api/auth/login - public. Returns the user and a token pair. 200 | 400 | 401 */
router.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    res.json(await authService.login(req.body));
  })
);

/** POST /api/auth/refresh - public. Exchanges a refresh token for a new pair. 200 | 400 | 401 */
router.post(
  "/refresh",
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    res.json(await authService.refresh(req.body));
  })
);

export default router;
