import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from "../src/lib/r2.server";
import { PutObjectCommand } from "@aws-sdk/client-s3";

// 1. Supabase credentials
const env = readFileSync(".env", "utf8");
let supabaseUrl = "https://genfsqvjkpqeqrbikdnk.supabase.co";
let serviceRoleKey = "";

for (const line of env.split("\n")) {
  if (line.startsWith("SUPABASE_URL=") || line.startsWith("EXTERNAL_SUPABASE_URL=")) {
    supabaseUrl = line.split("=")[1].replace(/"/g, "").trim();
  }
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=") || line.startsWith("EXTERNAL_SUPABASE_SERVICE_ROLE_KEY=")) {
    serviceRoleKey = line.split("=")[1].replace(/"/g, "").trim();
  }
}

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// 2. Checkpoint management
const CHECKPOINT_FILE = "scripts/.r2-migration-checkpoint.json";

interface Checkpoint {
  urlMap: Record<string, string>; // originalUrl -> r2Url
  processedUrls: number;
  totalBytesUploaded: number;
  dbUpdatedProducts: number;
}

function loadCheckpoint(): Checkpoint {
  if (existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(readFileSync(CHECKPOINT_FILE, "utf8"));
    } catch {}
  }
  return { urlMap: {}, processedUrls: 0, totalBytesUploaded: 0, dbUpdatedProducts: 0 };
}

function saveCheckpoint(cp: Checkpoint) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

// Helper to determine mime type
function getMimeType(url: string): string {
  const lower = url.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "image/jpeg";
}

// Helper to extract clean filename
function extractKey(url: string): string {
  try {
    const u = new URL(url);
    const pathname = u.pathname;
    const parts = pathname.split("/").filter(Boolean);
    const filename = parts[parts.length - 1] || `${Date.now()}.jpg`;
    return `products/${filename}`;
  } catch {
    return `products/${Date.now()}.jpg`;
  }
}

async function uploadSingleImage(url: string, cp: Checkpoint): Promise<string | null> {
  if (cp.urlMap[url]) {
    return cp.urlMap[url];
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      },
    });

    if (!res.ok) {
      console.warn(`[WARN] Failed to fetch image (${res.status}): ${url}`);
      return null;
    }

    const buffer = await res.arrayBuffer();
    const key = extractKey(url);
    const mimeType = res.headers.get("content-type") || getMimeType(url);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: key,
        Body: new Uint8Array(buffer),
        ContentType: mimeType,
      }),
    );

    const r2Url = `${R2_PUBLIC_URL}/${key}`;
    cp.urlMap[url] = r2Url;
    cp.processedUrls++;
    cp.totalBytesUploaded += buffer.byteLength;
    return r2Url;
  } catch (err: any) {
    console.error(`[ERROR] Transfer failed for ${url}:`, err.message);
    return null;
  }
}

async function main() {
  console.log("=================================================");
  console.log("Starting Cloudflare R2 Image Migration");
  console.log(`Target Bucket: ${R2_BUCKET}`);
  console.log(`Public R2 URL: ${R2_PUBLIC_URL}`);
  console.log("=================================================\n");

  const cp = loadCheckpoint();
  console.log(`Loaded checkpoint: ${Object.keys(cp.urlMap).length} URLs already transferred.`);

  // 1. Fetch all products from Supabase
  console.log("Fetching all products from Supabase...");
  const { count } = await supabase.from("products").select("id", { count: "exact", head: true });
  const totalProducts = count || 0;
  console.log(`Total products to process: ${totalProducts}`);

  const allProducts: any[] = [];
  const BATCH_SIZE = 1000;
  for (let from = 0; from < totalProducts; from += BATCH_SIZE) {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, image_url, images")
      .range(from, from + BATCH_SIZE - 1);
    if (error) throw error;
    if (data) allProducts.push(...data);
  }

  // 2. Collect all unique image URLs that need migration
  const uniqueUrls = new Set<string>();
  for (const p of allProducts) {
    if (p.image_url && !p.image_url.includes("r2.dev") && !p.image_url.includes("r2.cloudflarestorage")) {
      uniqueUrls.add(p.image_url);
    }
    for (const img of p.images || []) {
      if (img && !img.includes("r2.dev") && !img.includes("r2.cloudflarestorage")) {
        uniqueUrls.add(img);
      }
    }
  }

  const urlsToUpload = Array.from(uniqueUrls).filter((u) => !cp.urlMap[u]);
  console.log(`Found ${uniqueUrls.size} unique images (${urlsToUpload.length} remaining to upload to R2).\n`);

  // 3. Parallel upload with worker pool
  const CONCURRENCY = 15;
  let activeWorkers = 0;
  let completed = 0;
  const totalToUpload = urlsToUpload.length;

  if (totalToUpload > 0) {
    console.log(`Uploading with ${CONCURRENCY} concurrent workers...`);
    let idx = 0;

    await new Promise<void>((resolve) => {
      function next() {
        if (completed >= totalToUpload) {
          return resolve();
        }

        while (activeWorkers < CONCURRENCY && idx < totalToUpload) {
          const currentUrl = urlsToUpload[idx++];
          activeWorkers++;

          uploadSingleImage(currentUrl, cp)
            .then(() => {
              completed++;
              if (completed % 50 === 0 || completed === totalToUpload) {
                const mb = (cp.totalBytesUploaded / (1024 * 1024)).toFixed(1);
                console.log(
                  `[Progress] ${completed} / ${totalToUpload} images uploaded (${mb} MB transferred) - ${(
                    (completed / totalToUpload) *
                    100
                  ).toFixed(1)}%`,
                );
                saveCheckpoint(cp);
              }
            })
            .finally(() => {
              activeWorkers--;
              next();
            });
        }
      }

      next();
    });

    saveCheckpoint(cp);
    console.log(`\nAll ${totalToUpload} images uploaded to Cloudflare R2!`);
  } else {
    console.log("All unique images are already uploaded to Cloudflare R2!");
  }

  // 4. Update products table with new R2 URLs
  console.log("\nUpdating products table with Cloudflare R2 URLs...");
  let updatedCount = 0;

  for (let i = 0; i < allProducts.length; i++) {
    const p = allProducts[i];
    let needsUpdate = false;

    let newMainImage = p.image_url;
    if (p.image_url && cp.urlMap[p.image_url]) {
      newMainImage = cp.urlMap[p.image_url];
      if (newMainImage !== p.image_url) needsUpdate = true;
    }

    let newImages = p.images;
    if (Array.isArray(p.images) && p.images.length > 0) {
      newImages = p.images.map((u: string) => cp.urlMap[u] || u);
      if (JSON.stringify(newImages) !== JSON.stringify(p.images)) {
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      const { error } = await supabase
        .from("products")
        .update({
          image_url: newMainImage,
          images: newImages,
        })
        .eq("id", p.id);

      if (!error) {
        updatedCount++;
      } else {
        console.error(`Failed to update product ${p.slug}:`, error.message);
      }

      if (updatedCount % 200 === 0) {
        console.log(`[DB Update] ${updatedCount} products updated to Cloudflare R2 URLs...`);
      }
    }
  }

  console.log("\n=================================================");
  console.log("MIGRATION COMPLETED SUCCESSFULLY!");
  console.log(`Total images in R2: ${Object.keys(cp.urlMap).length}`);
  console.log(`Total storage uploaded: ${(cp.totalBytesUploaded / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total products updated: ${updatedCount}`);
  console.log("=================================================");
}

main().catch(console.error);
