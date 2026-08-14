import type { Request, Response, NextFunction } from "express";
import { MulterError } from "multer";
import { UnsupportedFileTypeError } from "../lib/imageUpload.js";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (res.headersSent) return next(err);

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "File must be smaller than 5MB"
        : err.message;
    return res.status(400).json({ message });
  }

  if (err instanceof UnsupportedFileTypeError) {
    return res.status(400).json({ message: err.message });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({ message: "Something went wrong" });
};
