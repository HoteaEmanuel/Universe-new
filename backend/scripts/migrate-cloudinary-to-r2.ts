// One-time backfill: copies every Cloudinary-hosted asset referenced in the DB
// into R2 and rewrites the row's URL/key columns to point at R2 instead.
//
// Usage (run from repo root):
//   npx tsx --env-file=backend/.env backend/scripts/migrate-cloudinary-to-r2.ts --dry-run
//   npx tsx --env-file=backend/.env backend/scripts/migrate-cloudinary-to-r2.ts
//
// Idempotent: any URL that already points at CLOUDFLARE_PUBLIC_URL is left
// untouched, so a failed or partial run can just be re-run.

import { prisma } from "../database/prisma.js";
import { uploadImage, keyFromUrl } from "../lib/storage.js";

const dryRun = process.argv.includes("--dry-run");

let totalMigrated = 0;
let totalSkipped = 0;
let totalFailed = 0;
let totalBytes = 0;

const fetchAsset = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Fetch failed with status ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") ?? "image/jpeg";
  return { buffer: Buffer.from(arrayBuffer), mimeType };
};

const probeSize = async (url: string) => {
  const response = await fetch(url, { method: "HEAD" });
  const length = response.headers.get("content-length");
  return length ? Number(length) : 0;
};

// Migrates one url/key pair. Returns the pair unchanged if it's already on R2.
const migrateOne = async (
  url: string,
  key: string | null,
  folder: string,
): Promise<{ url: string; key: string | null }> => {
  if (keyFromUrl(url)) {
    totalSkipped++;
    return { url, key };
  }

  if (dryRun) {
    totalBytes += await probeSize(url);
    totalMigrated++;
    return { url, key };
  }

  const { buffer, mimeType } = await fetchAsset(url);
  totalBytes += buffer.byteLength;
  const uploaded = await uploadImage({ buffer, mimeType, folder });
  totalMigrated++;
  return { url: uploaded.url, key: uploaded.key };
};

const migrateArray = async (urls: string[], keys: string[], folder: string) => {
  const newUrls: string[] = [];
  const newKeys: string[] = [];
  for (let i = 0; i < urls.length; i++) {
    const migrated = await migrateOne(urls[i], keys[i] ?? null, folder);
    newUrls.push(migrated.url);
    newKeys.push(migrated.key ?? keys[i]);
  }
  return { urls: newUrls, keys: newKeys };
};

const migratePosts = async () => {
  const posts = await prisma.post.findMany({
    select: { id: true, imagesUrls: true, imagesPublicIds: true },
  });
  for (const post of posts) {
    if (post.imagesUrls.length === 0) continue;
    try {
      const { urls, keys } = await migrateArray(
        post.imagesUrls,
        post.imagesPublicIds,
        "posts",
      );
      if (!dryRun) {
        await prisma.post.update({
          where: { id: post.id },
          data: { imagesUrls: urls, imagesPublicIds: keys },
        });
      }
    } catch (error) {
      totalFailed++;
      console.error(`Post ${post.id} failed:`, error);
    }
  }
};

const migrateMessages = async () => {
  const messages = await prisma.message.findMany({
    select: { id: true, imageUrls: true, imagePublicIds: true },
  });
  for (const message of messages) {
    if (message.imageUrls.length === 0) continue;
    try {
      const { urls, keys } = await migrateArray(
        message.imageUrls,
        message.imagePublicIds,
        "message_images",
      );
      if (!dryRun) {
        await prisma.message.update({
          where: { id: message.id },
          data: { imageUrls: urls, imagePublicIds: keys },
        });
      }
    } catch (error) {
      totalFailed++;
      console.error(`Message ${message.id} failed:`, error);
    }
  }
};

const migrateGroupMessages = async () => {
  const groupMessages = await prisma.groupMessage.findMany({
    select: { id: true, imageUrls: true, imagePublicIds: true },
  });
  for (const message of groupMessages) {
    if (message.imageUrls.length === 0) continue;
    try {
      const { urls, keys } = await migrateArray(
        message.imageUrls,
        message.imagePublicIds,
        "message_images",
      );
      if (!dryRun) {
        await prisma.groupMessage.update({
          where: { id: message.id },
          data: { imageUrls: urls, imagePublicIds: keys },
        });
      }
    } catch (error) {
      totalFailed++;
      console.error(`Group message ${message.id} failed:`, error);
    }
  }
};

const migrateGroupCovers = async () => {
  const groups = await prisma.group.findMany({
    select: { id: true, coverImageUrl: true, coverImagePublicId: true },
  });
  for (const group of groups) {
    if (!group.coverImageUrl) continue;
    try {
      const migrated = await migrateOne(
        group.coverImageUrl,
        group.coverImagePublicId,
        "group_covers",
      );
      if (!dryRun) {
        await prisma.group.update({
          where: { id: group.id },
          data: { coverImageUrl: migrated.url, coverImagePublicId: migrated.key },
        });
      }
    } catch (error) {
      totalFailed++;
      console.error(`Group ${group.id} cover failed:`, error);
    }
  }
};

const migrateAvatars = async () => {
  const users = await prisma.user.findMany({
    select: { id: true, profilePicture: true, profilePictureKey: true },
  });
  for (const user of users) {
    if (!user.profilePicture) continue;
    try {
      const migrated = await migrateOne(
        user.profilePicture,
        user.profilePictureKey,
        "users",
      );
      if (!dryRun) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profilePicture: migrated.url, profilePictureKey: migrated.key },
        });
      }
    } catch (error) {
      totalFailed++;
      console.error(`User ${user.id} avatar failed:`, error);
    }
  }
};

const main = async () => {
  console.log(dryRun ? "Running in --dry-run mode (no writes)." : "Running for real.");

  await migratePosts();
  await migrateMessages();
  await migrateGroupMessages();
  await migrateGroupCovers();
  await migrateAvatars();

  console.log("\nDone.");
  console.log(`  Migrated: ${totalMigrated}`);
  console.log(`  Already on R2 (skipped): ${totalSkipped}`);
  console.log(`  Failed: ${totalFailed}`);
  console.log(`  Bytes ${dryRun ? "to transfer" : "transferred"}: ${totalBytes.toLocaleString()}`);
};

main()
  .catch((error) => {
    console.error("Migration script crashed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
