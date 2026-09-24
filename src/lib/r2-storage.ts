import { uploadToR2Fn, deleteFromR2Fn, bulkDeleteFromR2Fn } from "./r2.functions";
import { supabase } from "@/integrations/supabase/external";

const R2_PUBLIC_HOST = "pub-4d7495b03d054b119b77e85732daaef0.r2.dev";

/**
 * Check if a URL or key points to Cloudflare R2.
 */
export function isR2Url(urlOrKey: string): boolean {
  if (!urlOrKey) return false;
  return (
    urlOrKey.includes(R2_PUBLIC_HOST) ||
    (!urlOrKey.startsWith("http://") &&
      !urlOrKey.startsWith("https://") &&
      (urlOrKey.startsWith("products/") ||
        urlOrKey.startsWith("site-content/") ||
        urlOrKey.startsWith("landing/") ||
        urlOrKey.startsWith("_trash/")))
  );
}

/**
 * Extract the clean R2 storage key from an R2 public URL or full path.
 * e.g. "https://pub-...r2.dev/products/abc.jpg" -> "products/abc.jpg"
 */
export function extractR2Key(urlOrKey: string): string {
  if (!urlOrKey) return "";
  if (urlOrKey.startsWith("http://") || urlOrKey.startsWith("https://")) {
    try {
      const u = new URL(urlOrKey);
      return decodeURIComponent(u.pathname.replace(/^\/+/, ""));
    } catch {
      const idx = urlOrKey.indexOf(R2_PUBLIC_HOST);
      if (idx !== -1) {
        return urlOrKey.slice(idx + R2_PUBLIC_HOST.length).replace(/^\/+/, "");
      }
    }
  }
  return urlOrKey.replace(/^\/+/, "");
}

/**
 * Helper to convert browser File to Base64 string.
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a File directly to Cloudflare R2 and return the public CDN URL.
 *
 * @param file - Browser File object (from input or drop)
 * @param folder - Destination folder: "products" | "site-content" | "landing" (default: "products")
 * @param customName - Optional custom filename (otherwise generated with timestamp)
 */
export async function uploadFileToR2(
  file: File,
  folder = "products",
  customName?: string,
): Promise<string> {
  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : ".jpg";

  let filename = customName;
  if (!filename) {
    const cleanBase = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 50);
    const rand = Math.random().toString(36).slice(2, 8);
    filename = `${Date.now()}-${rand}-${cleanBase}${ext}`;
  } else if (!filename.toLowerCase().endsWith(ext)) {
    filename = `${filename}${ext}`;
  }

  const cleanFolder = folder.replace(/^\/+|\/+$/g, "");
  const key = `${cleanFolder}/${filename}`;

  const base64Data = await fileToBase64(file);

  const res = await uploadToR2Fn({
    data: {
      key,
      contentType: file.type || "image/jpeg",
      base64Data,
    },
  });

  return res.url;
}

/**
 * Safely delete an image from storage (R2 or legacy Supabase).
 */
export async function deleteFileFromR2(urlOrKey: string): Promise<boolean> {
  if (!urlOrKey) return false;

  if (isR2Url(urlOrKey)) {
    const key = extractR2Key(urlOrKey);
    if (!key) return false;
    await deleteFromR2Fn({ data: { key } });
    return true;
  }

  // Legacy Supabase storage fallback
  if (urlOrKey.includes(".supabase.co/storage/v1/object/public/")) {
    try {
      const match = urlOrKey.match(/\/public\/([^/]+)\/(.+)$/);
      if (match) {
        const bucket = match[1];
        const path = decodeURIComponent(match[2]);
        await supabase.storage.from(bucket).remove([path]);
        return true;
      }
    } catch (e) {
      console.warn("Legacy Supabase delete fallback warning:", e);
    }
  }

  return false;
}

/**
 * Bulk delete multiple image URLs or keys from R2.
 */
export async function bulkDeleteFilesFromR2(urlsOrKeys: string[]): Promise<number> {
  const r2Keys: string[] = [];
  const supabaseItems: Array<{ bucket: string; path: string }> = [];

  for (const item of urlsOrKeys) {
    if (!item) continue;
    if (isR2Url(item)) {
      const k = extractR2Key(item);
      if (k) r2Keys.push(k);
    } else if (item.includes(".supabase.co/storage/v1/object/public/")) {
      const match = item.match(/\/public\/([^/]+)\/(.+)$/);
      if (match) {
        supabaseItems.push({ bucket: match[1], path: decodeURIComponent(match[2]) });
      }
    }
  }

  let deletedCount = 0;

  if (r2Keys.length > 0) {
    const res = await bulkDeleteFromR2Fn({ data: { keys: r2Keys } });
    deletedCount += res.deletedCount || 0;
  }

  for (const sb of supabaseItems) {
    try {
      await supabase.storage.from(sb.bucket).remove([sb.path]);
      deletedCount++;
    } catch {}
  }

  return deletedCount;
}
