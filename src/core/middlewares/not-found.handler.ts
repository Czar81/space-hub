import { Request, Response, NextFunction } from "express";
import { AppError } from "@/core/utils/app-error";

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};