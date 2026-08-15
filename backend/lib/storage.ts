import {
  DeleteObjectsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3 = new S3Client({
  region: "auto",
  endpoint: process.env.CLOUDFLARE_S3_API,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS,
  },
});

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

interface UploadImageInput {
  buffer: Buffer;
  mimeType: string;
  folder: string;
}

export interface UploadedObject {
  url: string;
  key: string;
}

export const uploadImage = async ({
  buffer,
  mimeType,
  folder,
}: UploadImageInput): Promise<UploadedObject> => {
  const extension = EXTENSION_BY_MIME_TYPE[mimeType] ?? "bin";
  const key = `${folder}/${randomUUID()}.${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return { url: `${process.env.CLOUDFLARE_PUBLIC_URL}/${key}`, key };
};

export const deleteImages = async (keys: string[]): Promise<void> => {
  const validKeys = keys.filter(Boolean);
  if (validKeys.length === 0) return;

  await s3.send(
    new DeleteObjectsCommand({
      Bucket: process.env.CLOUDFLARE_BUCKET,
      Delete: { Objects: validKeys.map((Key) => ({ Key })) },
    }),
  );
};

export const keyFromUrl = (url: string): string | undefined => {
  const base = process.env.CLOUDFLARE_PUBLIC_URL;
  if (!base || !url.startsWith(`${base}/`)) return undefined;
  return url.slice(base.length + 1);
};
