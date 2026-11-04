import { Router } from "express";
import { validate } from "@/core/middlewares/validate";
import { asyncHandler } from "@/core/utils/async-handler";
import { idParamSchema } from "@/core/schemas/id-param.schema";
import { authenticate } from "@/core/middlewares/auth";
import { bookingsService } from "@/entities/bookings/bookings.service";
import { createBookingSchema } from "@/entities/bookings/bookings.schema";

const router = Router();

/** Every booking route requires a valid access token. */
router.use(authenticate);

/** POST /api/bookings - 201 | 400 | 401 | 404 | 409 */
router.post(
  "/",
  validate(createBookingSchema),
  asyncHandler(async (req, res) => {
    res.status(201).json(await bookingsService.create(req.user, req.body));
  })
);

/** GET /api/bookings - own bookings (member) or all of them (admin). 200 | 401 */
router.get(
  "/",
  asyncHandler(async (req, res) => {
    res.json(await bookingsService.list(req.user));
  })
);

/** GET /api/bookings/:id - 200 | 400 | 401 | 404 */
router.get(
  "/:id",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await bookingsService.getById(req.user, Number(req.params.id)));
  })
);

/** PATCH /api/bookings/:id/cancel - 200 | 400 | 401 | 404 | 409 */
router.patch(
  "/:id/cancel",
  validate(idParamSchema, "params"),
  asyncHandler(async (req, res) => {
    res.json(await bookingsService.cancel(req.user, Number(req.params.id)));
  })
);

export default router;
