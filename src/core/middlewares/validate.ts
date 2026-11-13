import { Request, Response, NextFunction } from "express";
import { ZodType } from "zod";
import { RequestSource } from "@/core/types/index";

/**
 * Validates `req.body`, `req.query` or `req.params` against a Zod schema.
 * On success the parsed data (coerced and typed) replaces the original value;
 * on failure the `ZodError` goes to the error handler, which answers 400.
 *
 * @param schema Zod schema to validate against.
 * @param source Part of the request to validate, `body` by default.
 * @returns An Express middleware.
 *
 * @example
 * router.post("/", validate(createSpaceSchema), handler);
 * router.get("/:id", validate(idParamSchema, "params"), handler);
 */
export const validate =
  (schema: ZodType, source: RequestSource = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) return next(result.error);

    Object.defineProperty(req, source, { value: result.data, configurable: true, writable: true });
    next();
  };
