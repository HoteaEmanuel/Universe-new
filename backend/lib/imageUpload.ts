import multer from "multer";

export class UnsupportedFileTypeError extends Error {}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
// SVG is deliberately excluded from the allowlist: it can carry embedded scripts.
export const ALLOWED_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

// Files are buffered fully in memory (multer.memoryStorage) before any size
// check runs, and imageUpload.any()/.array("images") had no count limit -
// a single request with hundreds of files could exhaust a free-tier
// server's memory before fileFilter/limits.fileSize ever rejects anything.
export const MAX_IMAGE_FILES_PER_REQUEST = 10;

export const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE, files: MAX_IMAGE_FILES_PER_REQUEST },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new UnsupportedFileTypeError(
          "Only JPEG, PNG, WEBP, and GIF images are allowed",
        ),
      );
    }
    cb(null, true);
  },
});
