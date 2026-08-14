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

export const imageUpload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_IMAGE_SIZE },
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
