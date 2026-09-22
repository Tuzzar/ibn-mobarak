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

async function scanBucketRecursively(bucket: string, prefix = ""): Promise<MediaFile[]> {
  const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
  let all: MediaFile[] = [];
  let page = 0;

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
        // subfolder
        const sub = await scanBucketRecursively(bucket, fullPath);
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
          id: `${bucket}::${fullPath}`,
          name: item.name,
          fullPath,
          bucket,
          publicUrl: urlData.publicUrl,
          size: item.metadata?.size || 0,
          mimetype: item.metadata?.mimetype || "image/jpeg",
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

  return all;
}

/**
 * Fetch all media files across storage buckets with total storage size in MB.
 */
export const getMediaSummary = createServerFn({ method: "GET" }).handler(async (): Promise<MediaSummary> => {
  const BUCKETS = ["products", "product-images"];
  const bucketResults = await Promise.all(BUCKETS.map((b) => scanBucketRecursively(b)));
  const allFiles = bucketResults.flat();

  let totalBytes = 0;
  let trashCount = 0;
  let trashBytes = 0;
  const bucketStats: Record<string, { count: number; bytes: number; mb: number }> = {};

  for (const b of BUCKETS) {
    bucketStats[b] = { count: 0, bytes: 0, mb: 0 };
  }

  for (const f of allFiles) {
    totalBytes += f.size;
    if (bucketStats[f.bucket]) {
      bucketStats[f.bucket].count++;
      bucketStats[f.bucket].bytes += f.size;
    }
    if (f.isTrash) {
      trashCount++;
      trashBytes += f.size;
    }
  }

  for (const b of BUCKETS) {
    bucketStats[b].mb = Number((bucketStats[b].bytes / (1024 * 1024)).toFixed(2));
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
});

/**
 * Rename an existing media file in storage.
 */
const renameSchema = z.object({
  bucket: z.string().min(1),
  fullPath: z.string().min(1),
  newName: z.string().trim().min(1).max(200),
});

export const renameMediaFile = createServerFn({ method: "POST" })
  .validator((d: unknown) => renameSchema.parse(d))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
    const { bucket, fullPath, newName } = data;

    // Determine path prefix (directory)
    const lastSlash = fullPath.lastIndexOf("/");
    const dir = lastSlash >= 0 ? fullPath.slice(0, lastSlash) : "";

    // Sanitize new name: preserve or auto-attach extension
    const oldExt = fullPath.includes(".") ? fullPath.slice(fullPath.lastIndexOf(".")) : "";
    let cleanName = newName.replace(/[^a-zA-Z0-9._-]/g, "_");
    if (oldExt && !cleanName.toLowerCase().endsWith(oldExt.toLowerCase())) {
      cleanName = `${cleanName}${oldExt}`;
    }

    const newFullPath = dir ? `${dir}/${cleanName}` : cleanName;

    if (newFullPath === fullPath) {
      return { success: true, newFullPath, message: "No change in filename" };
    }

    const { error } = await externalSupabaseAdmin.storage.from(bucket).move(fullPath, newFullPath);
    if (error) {
      throw new Error(`Failed to rename file: ${error.message}`);
    }

    const { data: urlData } = externalSupabaseAdmin.storage.from(bucket).getPublicUrl(newFullPath);
    return {
      success: true,
      newFullPath,
      newUrl: urlData.publicUrl,
      newName: cleanName,
    };
  });

/**
 * Move a file to the trash bin (Soft Delete).
 */
const trashSchema = z.object({
  bucket: z.string().min(1),
  fullPath: z.string().min(1),
});

export const moveToTrash = createServerFn({ method: "POST" })
  .validator((d: unknown) => trashSchema.parse(d))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
    const { bucket, fullPath } = data;

    if (fullPath.startsWith("_trash/")) {
      return { success: true, message: "Already in trash" };
    }

    // Encapsulate original path so it can be restored perfectly
    const encoded = fullPath.replace(/\//g, "___");
    const trashPath = `_trash/${Date.now()}__${encoded}`;

    const { error } = await externalSupabaseAdmin.storage.from(bucket).move(fullPath, trashPath);
    if (error) {
      throw new Error(`Failed to move file to trash: ${error.message}`);
    }

    return { success: true, trashPath };
  });

/**
 * Restore a file from the trash bin.
 */
const restoreSchema = z.object({
  bucket: z.string().min(1),
  trashPath: z.string().min(1),
});

export const restoreFromTrash = createServerFn({ method: "POST" })
  .validator((d: unknown) => restoreSchema.parse(d))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
    const { bucket, trashPath } = data;

    // Extract original path
    const filename = trashPath.includes("/") ? trashPath.slice(trashPath.lastIndexOf("/") + 1) : trashPath;
    const parts = filename.split("__");
    let originalPath = parts.length > 1 ? parts.slice(1).join("__").replace(/___/g, "/") : filename;

    if (!originalPath || originalPath === trashPath) {
      originalPath = filename;
    }

    const { error } = await externalSupabaseAdmin.storage.from(bucket).move(trashPath, originalPath);
    if (error) {
      throw new Error(`Failed to restore file: ${error.message}`);
    }

    return { success: true, originalPath };
  });

/**
 * Permanently delete a file from storage.
 */
const deleteSchema = z.object({
  bucket: z.string().min(1),
  fullPath: z.string().min(1),
});

export const deleteMediaPermanently = createServerFn({ method: "POST" })
  .validator((d: unknown) => deleteSchema.parse(d))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
    const { bucket, fullPath } = data;

    const { error } = await externalSupabaseAdmin.storage.from(bucket).remove([fullPath]);
    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }

    return { success: true, fullPath };
  });

/**
 * Empty the trash bin permanently.
 */
const emptyTrashSchema = z.object({
  bucket: z.string().optional(),
});

export const emptyTrash = createServerFn({ method: "POST" })
  .validator((d: unknown) => emptyTrashSchema.parse(d))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin } = await import("@/integrations/supabase/external-admin.server");
    const bucketsToEmpty = data.bucket ? [data.bucket] : ["products", "product-images"];
    let deletedCount = 0;

    for (const b of bucketsToEmpty) {
      const { data: trashFiles } = await externalSupabaseAdmin.storage.from(b).list("_trash", { limit: 200 });
      if (trashFiles && trashFiles.length > 0) {
        const paths = trashFiles.map((f) => `_trash/${f.name}`);
        const { error } = await externalSupabaseAdmin.storage.from(b).remove(paths);
        if (!error) {
          deletedCount += paths.length;
        }
      }
    }

    return { success: true, deletedCount };
  });
