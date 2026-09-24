import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} from "@aws-sdk/client-s3";

export const R2_BUCKET = process.env.R2_BUCKET_NAME || "ibn-mobarak-art-gallery";
export const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_URL ||
  process.env.VITE_R2_PUBLIC_URL ||
  "https://pub-4d7495b03d054b119b77e85732daaef0.r2.dev"
).replace(/\/+$/, "");

export const r2Client = new S3Client({
  region: "auto",
  endpoint:
    process.env.R2_ENDPOINT ||
    "https://438908b03aa19aede226176c6e2ed451.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "ee4720025d4174bfc00dd14f6de272f8",
    secretAccessKey:
      process.env.R2_SECRET_ACCESS_KEY ||
      "097f238cc20cd9f3261b250e7d329b84212c756cd848f8f41df098d052900aa5",
  },
});

/**
 * Upload a binary buffer to Cloudflare R2 and return the public CDN URL.
 */
export async function uploadToR2(
  key: string,
  body: Uint8Array | Buffer | ArrayBuffer,
  contentType = "image/jpeg",
) {
  // Normalize key (no leading slash)
  const cleanKey = key.replace(/^\/+/, "");
  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanKey,
      Body: body instanceof Uint8Array ? body : new Uint8Array(body),
      ContentType: contentType,
    }),
  );
  return `${R2_PUBLIC_URL}/${cleanKey}`;
}

/**
 * Permanently delete a single object from Cloudflare R2.
 */
export async function deleteFromR2(key: string) {
  const cleanKey = key.replace(/^\/+/, "");
  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: R2_BUCKET,
      Key: cleanKey,
    }),
  );
  return { success: true, key: cleanKey };
}

/**
 * Bulk delete multiple objects from Cloudflare R2 (batches of 1000).
 */
export async function bulkDeleteFromR2(keys: string[]) {
  const cleanKeys = keys.map((k) => k.replace(/^\/+/, "")).filter(Boolean);
  if (cleanKeys.length === 0) return { success: true, deletedCount: 0 };

  const chunkSize = 1000;
  let totalDeleted = 0;

  for (let i = 0; i < cleanKeys.length; i += chunkSize) {
    const batch = cleanKeys.slice(i, i + chunkSize);
    await r2Client.send(
      new DeleteObjectsCommand({
        Bucket: R2_BUCKET,
        Delete: {
          Objects: batch.map((k) => ({ Key: k })),
          Quiet: true,
        },
      }),
    );
    totalDeleted += batch.length;
  }

  return { success: true, deletedCount: totalDeleted };
}

/**
 * Move a file to the _trash/ folder in R2 (Soft Delete).
 */
export async function moveToTrashR2(key: string) {
  const cleanKey = key.replace(/^\/+/, "");
  if (cleanKey.startsWith("_trash/")) {
    return { success: true, trashKey: cleanKey };
  }

  const encoded = cleanKey.replace(/\//g, "___");
  const trashKey = `_trash/${Date.now()}__${encoded}`;

  // Copy to trash path
  await r2Client.send(
    new CopyObjectCommand({
      Bucket: R2_BUCKET,
      CopySource: `${R2_BUCKET}/${encodeURIComponent(cleanKey)}`,
      Key: trashKey,
    }),
  );

  // Delete original
  await deleteFromR2(cleanKey);

  return { success: true, originalKey: cleanKey, trashKey };
}

/**
 * Restore a file from _trash/ folder in R2.
 */
export async function restoreFromTrashR2(trashKey: string) {
  const cleanTrashKey = trashKey.replace(/^\/+/, "");
  if (!cleanTrashKey.startsWith("_trash/")) {
    return { success: true, restoredKey: cleanTrashKey };
  }

  const filename = cleanTrashKey.replace(/^_trash\//, "");
  const parts = filename.split("__");
  const originalKey = parts.length > 1 ? parts.slice(1).join("__").replace(/___/g, "/") : filename;

  // Copy back
  await r2Client.send(
    new CopyObjectCommand({
      Bucket: R2_BUCKET,
      CopySource: `${R2_BUCKET}/${encodeURIComponent(cleanTrashKey)}`,
      Key: originalKey,
    }),
  );

  // Delete from trash
  await deleteFromR2(cleanTrashKey);

  return { success: true, restoredKey: originalKey, url: `${R2_PUBLIC_URL}/${originalKey}` };
}

/**
 * List files in R2 with pagination.
 */
export async function listR2Files(prefix = "", limit = 100, continuationToken?: string) {
  const res = await r2Client.send(
    new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
      MaxKeys: limit,
      ContinuationToken: continuationToken,
    }),
  );
  return {
    items: (res.Contents || []).map((obj) => ({
      key: obj.Key || "",
      size: obj.Size || 0,
      lastModified: obj.LastModified?.toISOString() || new Date().toISOString(),
      url: `${R2_PUBLIC_URL}/${obj.Key}`,
    })),
    nextContinuationToken: res.NextContinuationToken,
    isTruncated: res.IsTruncated,
  };
}

/**
 * Recursively list up to maxFiles from R2 for Media Library indexing.
 */
export async function listAllR2Files(prefix = "", maxFiles = 50000) {
  let all: Array<{ key: string; size: number; lastModified: string; url: string }> = [];
  let token: string | undefined = undefined;

  while (true) {
    const res = await listR2Files(prefix, 1000, token);
    all = all.concat(res.items);
    if (!res.isTruncated || !res.nextContinuationToken || all.length >= maxFiles) {
      break;
    }
    token = res.nextContinuationToken;
  }

  return all;
}
