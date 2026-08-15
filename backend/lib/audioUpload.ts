import multer from "multer";
import { UnsupportedFileTypeError } from "./imageUpload.js";

export const MAX_AUDIO_SIZE = 10 * 1024 * 1024;
export const MAX_AUDIO_DURATION_SEC = 120;
export const ALLOWED_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/wav",
]);

export const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_SIZE },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_AUDIO_MIME_TYPES.has(file.mimetype)) {
      return cb(
        new UnsupportedFileTypeError(
          "Only WEBM, OGG, MP4, MP3, and WAV audio is allowed",
        ),
      );
    }
    cb(null, true);
  },
});
