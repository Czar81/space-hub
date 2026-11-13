import { Router } from "express";

const router = Router();

/** GET / - public health check used by monitors and load balancers. */
router.get("/", (req, res) => {
  res.json({ status: "ok", message: "SpaceHub API is running" });
});

export default router;
