import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type MediaFile = {
  id: string;
  name: string;
  fullPath: string;
  bucket: string;
  publicUrl: string;
  size: number;
  mimetype: string;
  createdAt: string;
  updatedAt: string;
  isTrash: boolean;
  originalPath?: string;
};

export type MediaSummary = {
  files: MediaFile[];
  totalBytes: number;
  totalMB: number;
  totalFiles: number;
  activeCount: number;
  trashCount: number;
  trashBytes: number;
  trashMB: number;
  bucketStats: Record<string, { count: number; bytes: number; mb: number }>;
};

function getMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

/**
 * Scan Cloudflare R2 bucket objects.
 */
async function scanR2Files(): Promise<MediaFile[]> {
  const { listAllR2Files } = await import("./r2.server");
  try {
    const items = await listAllR2Files("", 50000);
    return items.map((item) => {
      const isTrash = item.key.startsWith("_trash/");
      let originalPath: string | undefined;

      if (isTrash) {
        const filename = item.key.replace(/^_trash\//, "");
        const parts = filename.split("__");
        if (parts.length > 1) {
          originalPath = parts.slice(1).join("__").replace(/___/g, "/");
        }
      }

      // Determine folder / bucket display name
      const firstSlash = item.key.indexOf("/");
      const folder = firstSlash > 0 ? item.key.slice(0, firstSlash) : "root";
      const filename = item.key.split("/").pop() || item.key;

      return {
        id: `r2::${item.key}`,
        name: filename,
        fullPath: item.key,
        bucket: `r2-${folder}`,
        publicUrl: item.url,
        size: item.size,
        mimetype: getMimeType(item.key),
        createdAt: item.lastModified,
        updatedAt: item.lastModified,
        isTrash,
        originalPath,
      };
    });
  } catch (err: any) {
    console.error("Error scanning R2 files:", err);
    return [];
  }
}

/**
 * Scan legacy Supabase Storage buckets if any remain.
 */
async function scanSupabaseBucketRecursively(bucket: string, prefix = ""): Promise<MediaFile[]> {
  const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
  let all: MediaFile[] = [];
  let page = 0;

  try {
    while (true) {
      const { data, error } = await externalSupabaseAdmin.storage.from(bucket).list(prefix, {
        limit: 100,
        offset: page * 100,
        sortBy: { column: "created_at", order: "desc" },
      });

      if (error || !data || data.length === 0) break;

      for (const item of data) {
        const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

        if (item.id === null) {
          // Subfolder
          const sub = await scanSupabaseBucketRecursively(bucket, fullPath);
          all.push(...sub);
        } else {
          const { data: urlData } = externalSupabaseAdmin.storage.from(bucket).getPublicUrl(fullPath);
          const isTrash = fullPath.startsWith("_trash/") || item.name.startsWith("_trash_");
          let originalPath: string | undefined;

          if (isTrash) {
            const parts = item.name.split("__");
            if (parts.length > 1) {
              originalPath = parts.slice(1).join("__").replace(/___/g, "/");
            }
          }

          all.push({
            id: `sb::${bucket}::${fullPath}`,
            name: item.name,
            fullPath,
            bucket,
            publicUrl: urlData.publicUrl,
            size: item.metadata?.size || 0,
            mimetype: item.metadata?.mimetype || getMimeType(item.name),
            createdAt: item.created_at || item.updated_at || new Date().toISOString(),
            updatedAt: item.updated_at || item.created_at || new Date().toISOString(),
            isTrash,
            originalPath,
          });
        }
      }

      if (data.length < 100) break;
      page++;
    }
  } catch (err) {
    console.warn(`Notice while scanning Supabase bucket ${bucket}:`, err);
  }

  return all;
}

/**
 * Fetch all media files across Cloudflare R2 and Supabase storage buckets.
 */
export const getMediaSummary = createServerFn({ method: "GET" }).handler(
  async (): Promise<MediaSummary> => {
    // Primary: Cloudflare R2 files
    const r2FilesPromise = scanR2Files();

    // Secondary: Any legacy Supabase storage files
    const sbBuckets = ["products", "product-images"];
    const sbFilesPromise = Promise.all(sbBuckets.map((b) => scanSupabaseBucketRecursively(b)));

    const [r2Files, sbBucketResults] = await Promise.all([r2FilesPromise, sbFilesPromise]);
    const allFiles = [...r2Files, ...sbBucketResults.flat()];

    let totalBytes = 0;
    let trashCount = 0;
    let trashBytes = 0;
    const bucketStats: Record<string, { count: number; bytes: number; mb: number }> = {};

    for (const f of allFiles) {
      totalBytes += f.size;
      if (!bucketStats[f.bucket]) {
        bucketStats[f.bucket] = { count: 0, bytes: 0, mb: 0 };
      }
      bucketStats[f.bucket].count++;
      bucketStats[f.bucket].bytes += f.size;

      if (f.isTrash) {
        trashCount++;
        trashBytes += f.size;
      }
    }

    for (const k of Object.keys(bucketStats)) {
      bucketStats[k].mb = Number((bucketStats[k].bytes / (1024 * 1024)).toFixed(2));
    }

    return {
      files: allFiles,
      totalBytes,
      totalMB: Number((totalBytes / (1024 * 1024)).toFixed(2)),
      totalFiles: allFiles.length,
      activeCount: allFiles.length - trashCount,
      trashCount,
      trashBytes,
      trashMB: Number((trashBytes / (1024 * 1024)).toFixed(2)),
      bucketStats,
    };
  },
);

/**
 * Rename an existing media file in storage.
 */
const renameSchema = z.object({
  id: z.string().optional(),
  bucket: z.string().min(1),
  fullPath: z.string().min(1),
  newName: z.string().trim().min(1).max(200),
});

export const renameMediaFile = createServerFn({ method: "POST" })
  .validator((d: unknown) => renameSchema.parse(d))
  .handler(async ({ data }) => {
    const { id, bucket, fullPath, newName } = data;

    const isR2 =
      id?.startsWith("r2::") ||
      bucket.startsWith("r2") ||
      bucket === "r2" ||
      fullPath.startsWith("products/") ||
      fullPath.startsWith("site-content/") ||
      fullPath.startsWith("landing/");

    const lastSlash = fullPath.lastIndexOf("/");
    const dir = lastSlash >= 0 ? fullPath.slice(0, lastSlash) : "";

    const oldExt = fullPath.includes(".") ? fullPath.slice(fullPath.lastIndexOf(".")) : "";
    let cleanName = newName.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (oldExt && !cleanName.toLowerCase().endsWith(oldExt.toLowerCase())) {
      cleanName = `${cleanName}${oldExt}`;
    }

    const newFullPath = dir ? `${dir}/${cleanName}` : cleanName;

    if (newFullPath === fullPath) {
      return { success: true, newFullPath, message: "No change in filename" };
    }

    if (isR2) {
      const { r2Client, R2_BUCKET, R2_PUBLIC_URL, deleteFromR2 } = await import("./r2.server");
      const { CopyObjectCommand } = await import("@aws-sdk/client-s3");

      await r2Client.send(
        new CopyObjectCommand({
          Bucket: R2_BUCKET,
          CopySource: `${R2_BUCKET}/${encodeURIComponent(fullPath)}`,
          Key: newFullPath,
        }),
      );
      await deleteFromR2(fullPath);

      return {
        success: true,
        newFullPath,
        newUrl: `${R2_PUBLIC_URL}/${newFullPath}`,
        newName: cleanName,
      };
    } else {
      const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
      const { error } = await externalSupabaseAdmin.storage.from(bucket).move(fullPath, newFullPath);
      if (error) throw new Error(`Failed to rename file: ${error.message}`);

      const { data: urlData } = externalSupabaseAdmin.storage.from(bucket).getPublicUrl(newFullPath);
      return {
        success: true,
        newFullPath,
        newUrl: urlData.publicUrl,
        newName: cleanName,
      };
    }
  });

/**
 * Move a file to the trash bin (Soft Delete).
 */
const trashSchema = z.object({
  id: z.string().optional(),
  bucket: z.string().min(1),
  fullPath: z.string().min(1),
});

export const moveToTrash = createServerFn({ method: "POST" })
  .validator((d: unknown) => trashSchema.parse(d))
  .handler(async ({ data }) => {
    const { id, bucket, fullPath } = data;

    const isR2 =
      id?.startsWith("r2::") ||
      bucket.startsWith("r2") ||
      bucket === "r2" ||
      fullPath.startsWith("products/") ||
      fullPath.startsWith("site-content/") ||
      fullPath.startsWith("landing/");

    if (isR2) {
      const { moveToTrashR2 } = await import("./r2.server");
      const res = await moveToTrashR2(fullPath);
      return { success: true, trashPath: res.trashKey };
    } else {
      const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
      if (fullPath.startsWith("_trash/")) {
        return { success: true, message: "Already in trash" };
      }
      const encoded = fullPath.replace(/\//g, "___");
      const trashPath = `_trash/${Date.now()}__${encoded}`;
      const { error } = await externalSupabaseAdmin.storage.from(bucket).move(fullPath, trashPath);
      if (error) throw new Error(`Failed to move file to trash: ${error.message}`);
      return { success: true, trashPath };
    }
  });

/**
 * Restore a file from the trash bin.
 */
const restoreSchema = z.object({
  id: z.string().optional(),
  bucket: z.string().min(1),
  trashPath: z.string().min(1),
  originalPath: z.string().optional(),
});

export const restoreFromTrash = createServerFn({ method: "POST" })
  .validator((d: unknown) => restoreSchema.parse(d))
  .handler(async ({ data }) => {
    const { id, bucket, trashPath } = data;

    const isR2 =
      id?.startsWith("r2::") ||
      bucket.startsWith("r2") ||
      bucket === "r2" ||
      trashPath.startsWith("_trash/");

    if (isR2) {
      const { restoreFromTrashR2 } = await import("./r2.server");
      const res = await restoreFromTrashR2(trashPath);
      return { success: true, restoredPath: res.restoredKey, publicUrl: res.url };
    } else {
      const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
      const filename = trashPath.replace(/^_trash\//, "");
      const parts = filename.split("__");
      const targetPath =
        data.originalPath ||
        (parts.length > 1 ? parts.slice(1).join("__").replace(/___/g, "/") : filename);

      const { error } = await externalSupabaseAdmin.storage.from(bucket).move(trashPath, targetPath);
      if (error) throw new Error(`Failed to restore file: ${error.message}`);

      const { data: urlData } = externalSupabaseAdmin.storage.from(bucket).getPublicUrl(targetPath);
      return { success: true, restoredPath: targetPath, publicUrl: urlData.publicUrl };
    }
  });

/**
 * Permanently delete a file from storage.
 */
const deleteSchema = z.object({
  id: z.string().optional(),
  bucket: z.string().min(1),
  fullPath: z.string().min(1),
});

export const deleteMediaPermanently = createServerFn({ method: "POST" })
  .validator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data }) => {
    const { id, bucket, fullPath } = data;

    const isR2 =
      id?.startsWith("r2::") ||
      bucket.startsWith("r2") ||
      bucket === "r2" ||
      fullPath.startsWith("products/") ||
      fullPath.startsWith("site-content/") ||
      fullPath.startsWith("landing/") ||
      fullPath.startsWith("_trash/");

    if (isR2) {
      const { deleteFromR2 } = await import("./r2.server");
      await deleteFromR2(fullPath);
      return { success: true, fullPath };
    } else {
      const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
      const { error } = await externalSupabaseAdmin.storage.from(bucket).remove([fullPath]);
      if (error) throw new Error(`Failed to delete file: ${error.message}`);
      return { success: true, fullPath };
    }
  });

/**
 * Empty the trash bin permanently (both Cloudflare R2 and Supabase).
 */
const emptyTrashSchema = z.object({
  bucket: z.string().optional(),
});

export const emptyTrash = createServerFn({ method: "POST" })
  .validator((d: unknown) => emptyTrashSchema.parse(d))
  .handler(async ({ data }) => {
    let deletedCount = 0;

    // 1. Empty R2 trash
    try {
      const { listAllR2Files, bulkDeleteFromR2 } = await import("./r2.server");
      const trashItems = await listAllR2Files("_trash/");
      if (trashItems.length > 0) {
        const keys = trashItems.map((i) => i.key);
        const res = await bulkDeleteFromR2(keys);
        deletedCount += res.deletedCount;
      }
    } catch (e) {
      console.error("Error emptying R2 trash:", e);
    }

    // 2. Empty Supabase trash
    try {
      const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
      const bucketsToEmpty = data.bucket ? [data.bucket] : ["products", "product-images"];

      for (const b of bucketsToEmpty) {
        if (b.startsWith("r2")) continue;
        const { data: trashFiles } = await externalSupabaseAdmin.storage.from(b).list("_trash", { limit: 200 });
        if (trashFiles && trashFiles.length > 0) {
          const paths = trashFiles.map((f) => `_trash/${f.name}`);
          const { error } = await externalSupabaseAdmin.storage.from(b).remove(paths);
          if (!error) deletedCount += paths.length;
        }
      }
    } catch (e) {
      console.warn("Notice while emptying Supabase trash:", e);
    }

    return { success: true, deletedCount };
  });

/**
 * Bulk move files to trash.
 */
const bulkTrashSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      bucket: z.string().min(1),
      fullPath: z.string().min(1),
    }),
  ),
});

export const bulkMoveToTrash = createServerFn({ method: "POST" })
  .validator((d: unknown) => bulkTrashSchema.parse(d))
  .handler(async ({ data }) => {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data.items) {
      try {
        await moveToTrash({ data: item });
        successCount++;
      } catch (err: any) {
        errors.push(`${item.fullPath}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      successCount,
      failureCount: errors.length,
      errors,
    };
  });

/**
 * Bulk restore files from trash.
 */
const bulkRestoreSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      bucket: z.string().min(1),
      trashPath: z.string().min(1),
      originalPath: z.string().optional(),
    }),
  ),
});

export const bulkRestoreFromTrash = createServerFn({ method: "POST" })
  .validator((d: unknown) => bulkRestoreSchema.parse(d))
  .handler(async ({ data }) => {
    let successCount = 0;
    const errors: string[] = [];

    for (const item of data.items) {
      try {
        await restoreFromTrash({ data: item });
        successCount++;
      } catch (err: any) {
        errors.push(`${item.trashPath}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      successCount,
      failureCount: errors.length,
      errors,
    };
  });

/**
 * Bulk permanently delete files from storage.
 */
const bulkDeleteSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().optional(),
      bucket: z.string().min(1),
      fullPath: z.string().min(1),
    }),
  ),
});

export const bulkDeleteMediaPermanently = createServerFn({ method: "POST" })
  .validator((d: unknown) => bulkDeleteSchema.parse(d))
  .handler(async ({ data }) => {
    const r2Keys: string[] = [];
    const sbMap: Record<string, string[]> = {};

    for (const item of data.items) {
      const isR2 =
        item.id?.startsWith("r2::") ||
        item.bucket.startsWith("r2") ||
        item.bucket === "r2" ||
        item.fullPath.startsWith("products/") ||
        item.fullPath.startsWith("site-content/") ||
        item.fullPath.startsWith("landing/") ||
        item.fullPath.startsWith("_trash/");

      if (isR2) {
        r2Keys.push(item.fullPath);
      } else {
        if (!sbMap[item.bucket]) sbMap[item.bucket] = [];
        sbMap[item.bucket].push(item.fullPath);
      }
    }

    let deletedCount = 0;
    const errors: string[] = [];

    if (r2Keys.length > 0) {
      try {
        const { bulkDeleteFromR2 } = await import("./r2.server");
        const res = await bulkDeleteFromR2(r2Keys);
        deletedCount += res.deletedCount;
      } catch (err: any) {
        errors.push(`R2 bulk delete failed: ${err.message}`);
      }
    }

    for (const [bucket, paths] of Object.entries(sbMap)) {
      try {
        const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
        const { error } = await externalSupabaseAdmin.storage.from(bucket).remove(paths);
        if (error) errors.push(`${bucket}: ${error.message}`);
        else deletedCount += paths.length;
      } catch (err: any) {
        errors.push(`${bucket}: ${err.message}`);
      }
    }

    return {
      success: errors.length === 0,
      deletedCount,
      errors,
    };
  });
