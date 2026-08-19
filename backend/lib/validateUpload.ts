import { fileTypeFromBuffer } from "file-type";
import sharp, { type FormatEnum } from "sharp";
import type { NextFunction, Request, Response } from "express";
import { ALLOWED_IMAGE_MIME_TYPES, UnsupportedFileTypeError } from "./imageUpload.js";
import { ALLOWED_FILE_MIME_TYPES } from "./fileUpload.js";
import { ALLOWED_AUDIO_MIME_TYPES } from "./audioUpload.js";

type UploadKind = "image" | "file" | "audio";

const ALLOWED_EXTENSIONS: Record<"image" | "file", Set<string>> = {
  image: new Set(["jpg", "jpeg", "png", "webp", "gif"]),
  file: new Set(["pdf", "doc", "docx", "xls", "xlsx"]),
};

const SHARP_FORMAT_BY_MIME: Record<string, keyof FormatEnum> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

async function verifyFile(
  file: Express.Multer.File,
  kind: UploadKind,
): Promise<void> {
  // Recorded voice notes are sent as a bare Blob with no filename (the browser
  // defaults it to "blob"), so there's no meaningful extension to check for audio.
  let ext = "";
  if (kind !== "audio") {
    ext = extensionOf(file.originalname);
    if (!ALLOWED_EXTENSIONS[kind].has(ext)) {
      throw new UnsupportedFileTypeError(
        "File extension is not allowed for this upload type",
      );
    }
  }

  const detected = await fileTypeFromBuffer(file.buffer);
  const detectedMime = detected?.mime;

  const allowedMimeTypes =
    kind === "image"
      ? ALLOWED_IMAGE_MIME_TYPES
      : kind === "file"
        ? ALLOWED_FILE_MIME_TYPES
        : ALLOWED_AUDIO_MIME_TYPES;

  // Legacy .doc/.xls share the OLE Compound File Binary signature, which magic-byte
  // detection can only narrow down to the generic "cfb" container — the filename
  // extension (already validated above) is what disambiguates the two.
  const isLegacyOfficeFile =
    kind === "file" &&
    detectedMime === "application/x-cfb" &&
    (ext === "doc" || ext === "xls");

  if (!detectedMime || (!allowedMimeTypes.has(detectedMime) && !isLegacyOfficeFile)) {
    throw new UnsupportedFileTypeError(
      "File content does not match an allowed file type",
    );
  }

  const verifiedMime = isLegacyOfficeFile
    ? ext === "doc"
      ? "application/msword"
      : "application/vnd.ms-excel"
    : detectedMime;

  if (kind === "image") {
    const format = SHARP_FORMAT_BY_MIME[verifiedMime];
    try {
      const reencoded = await sharp(file.buffer, { animated: true })
        .toFormat(format)
        .toBuffer();
      file.buffer = reencoded;
      file.size = reencoded.length;
    } catch {
      throw new UnsupportedFileTypeError(
        "Image could not be processed — the file may be corrupt",
      );
    }
  }

  // From here on, trust only the verified type, never the client-supplied header —
  // this is also what storage.ts stores as the object's Content-Type.
  file.mimetype = verifiedMime;
}

export const verifyUploadedFiles = (kind: UploadKind) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const single = req.file as Express.Multer.File | undefined;
      const multiple = req.files as Express.Multer.File[] | undefined;
      const files = single ? [single] : (multiple ?? []);

      for (const file of files) {
        await verifyFile(file, kind);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
