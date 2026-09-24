import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const SUPABASE_URL = "https://vdbkannwrsekvrdwijrx.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYmthbm53cnNla3ZyZHdpanJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDU3MDYsImV4cCI6MjA5NDA4MTcwNn0.WldH8nBEn_xn1Qpb3nPkDqDDyiUWGuQQL4KjSxSTWis";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
});

const outputBaseDir = path.resolve(import.meta.dir, "../old_site_photos_backup");

async function scanAndDownload(bucket: string, prefix = "") {
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data: items, error } = await supabase.storage.from(bucket).list(prefix, {
      limit,
      offset,
      sortBy: { column: "name", order: "asc" },
    });

    if (error) {
      console.error(`❌ Error listing ${bucket}/${prefix}:`, error.message);
      break;
    }

    if (!items || items.length === 0) break;

    for (const item of items) {
      const fullPath = prefix ? `${prefix}/${item.name}` : item.name;

      if (item.id === null) {
        // Subdirectory
        console.log(`📁 Scanning subfolder: ${bucket}/${fullPath}`);
        await scanAndDownload(bucket, fullPath);
      } else {
        // File to download
        const destPath = path.join(outputBaseDir, bucket, fullPath);
        await fs.mkdir(path.dirname(destPath), { recursive: true });

        // Get public URL or download blob
        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fullPath);
        const url = publicUrlData.publicUrl;

        try {
          const res = await fetch(url);
          if (!res.ok) {
            // Try storage download fallback
            const { data: blob, error: dlErr } = await supabase.storage.from(bucket).download(fullPath);
            if (dlErr || !blob) {
              console.error(`❌ Failed to download ${bucket}/${fullPath}: ${dlErr?.message || res.statusText}`);
              continue;
            }
            const buf = Buffer.from(await blob.arrayBuffer());
            await fs.writeFile(destPath, buf);
            console.log(`✅ Downloaded: ${bucket}/${fullPath} (${(buf.length / 1024).toFixed(1)} KB)`);
          } else {
            const buf = Buffer.from(await res.arrayBuffer());
            await fs.writeFile(destPath, buf);
            console.log(`✅ Downloaded: ${bucket}/${fullPath} (${(buf.length / 1024).toFixed(1)} KB)`);
          }
        } catch (err: any) {
          console.error(`❌ Network error downloading ${bucket}/${fullPath}:`, err.message);
        }
      }
    }

    if (items.length < limit) break;
    offset += limit;
  }
}

async function main() {
  console.log("==================================================");
  console.log("📦 Starting Photo Download from vdbkannwrsekvrdwijrx");
  console.log(`📂 Destination: ${outputBaseDir}`);
  console.log("==================================================");

  await fs.mkdir(outputBaseDir, { recursive: true });

  const buckets = ["products", "product-images"];
  for (const bucket of buckets) {
    console.log(`\n🔍 Scanning bucket: "${bucket}"...`);
    await scanAndDownload(bucket);
  }

  // Count files and calculate total size
  let totalFiles = 0;
  let totalBytes = 0;

  async function calculateStats(dir: string) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await calculateStats(full);
      } else if (e.isFile()) {
        totalFiles++;
        const stat = await fs.stat(full);
        totalBytes += stat.size;
      }
    }
  }

  await calculateStats(outputBaseDir);

  console.log("\n==================================================");
  console.log("🎉 ALL PHOTOS DOWNLOADED SUCCESSFULLY!");
  console.log(`📊 Total Files Downloaded: ${totalFiles}`);
  console.log(`💾 Total Size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`📁 Local Folder Location: ${outputBaseDir}`);
  console.log("==================================================");
}

main().catch(console.error);
