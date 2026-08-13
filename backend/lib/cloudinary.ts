import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";
import { unlink } from "fs/promises";

export const uploadImageAndCleanup = async (
  filePath: string,
  options: UploadApiOptions,
) => {
  try {
    return await cloudinary.uploader.upload(filePath, options);
  } finally {
    unlink(filePath).catch((error: unknown) => {
      console.error(`Failed to delete temp upload file ${filePath}:`, error);
    });
  }
};
