import multer from "multer";
import { UnsupportedFileTypeError } from "./imageUpload.js";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const ALLOWED_FILE_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export const fileUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_FILE_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new UnsupportedFileTypeError(
          "Only PDF, Word, and Excel files are allowed",
        ),
      );
    }
    cb(null, true);
  },
});
