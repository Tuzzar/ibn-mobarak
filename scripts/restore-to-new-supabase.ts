import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const newUrl = process.env.NEW_SUPABASE_URL || "https://genfsqvjkpqeqrbikdnk.supabase.co";
const newKey = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbmZzcXZqa3BxZXFyYmlrZG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTgwNDY5NiwiZXhwIjoyMTA1MzgwNjk2fQ.DqAHZgsZsdIeAuIgox-1-V7EsrMfCeZMVA9oA_10FxI";

const client = createClient(newUrl, newKey, {
  auth: { persistSession: false }
});

const backupDir = path.resolve(import.meta.dir, "../backup_data");

async function setupStorage() {
  console.log("--- Setting up Storage Buckets ---");
  const buckets = ["products", "product-images"];
  for (const b of buckets) {
    const { data: existing } = await client.storage.getBucket(b);
    if (!existing) {
      const { error } = await client.storage.createBucket(b, { public: true });
      if (error) console.warn(`Bucket "${b}" warning:`, error.message);
      else console.log(`Created public bucket "${b}"`);
    } else {
      console.log(`Bucket "${b}" already exists.`);
    }
  }

  // Upload storage files
  const storageDir = path.join(backupDir, "storage");
  for (const b of buckets) {
    const bucketDir = path.join(storageDir, b);
    try {
      await fs.access(bucketDir);
    } catch {
      continue;
    }

    async function uploadDir(currentDir: string, prefix = "") {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
        if (entry.isDirectory()) {
          await uploadDir(fullPath, relPath);
        } else if (entry.isFile()) {
          const fileBuffer = await fs.readFile(fullPath);
          const { error } = await client.storage.from(b).upload(relPath, fileBuffer, {
            upsert: true
          });
          if (error) console.error(`Error uploading ${b}/${relPath}:`, error.message);
        }
      }
    }

    console.log(`Uploading files to bucket "${b}"...`);
    await uploadDir(bucketDir);
    console.log(`Bucket "${b}" upload complete.`);
  }
}

async function restoreTable(table: string) {
  console.log(`\n--- Restoring table "${table}" ---`);
  const filePath = path.join(backupDir, `${table}.json`);
  try {
    await fs.access(filePath);
  } catch {
    console.log(`No backup file found for "${table}", skipping.`);
    return;
  }

  const raw = await fs.readFile(filePath, "utf-8");
  const rows: any[] = JSON.parse(raw);
  console.log(`Found ${rows.length} rows to insert into "${table}"...`);

  // Batch insert in chunks of 100
  const chunkSize = 100;
  let successCount = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.from(table).upsert(chunk, { ignoreDuplicates: false });
    if (error) {
      console.error(`Error inserting chunk ${i}-${i + chunk.length} in ${table}:`, error.message);
      if (table === "products" && error.message.includes("product_level")) {
        console.error("ALERT: product_level needs to be altered to TEXT in products table!");
        break;
      }
    } else {
      successCount += chunk.length;
      if (successCount % 500 === 0 || successCount === rows.length) {
        console.log(`  Progress: ${successCount}/${rows.length} rows inserted into ${table}`);
      }
    }
  }
  console.log(`Finished "${table}" restore: ${successCount}/${rows.length} rows.`);
}

async function main() {
  console.log(`Connecting to new Supabase: ${newUrl}`);
  await setupStorage();

  // Restore non-product tables first
  const initialTables = [
    "site_content",
    "menu_categories",
    "landing_pages",
    "orders"
  ];

  for (const table of initialTables) {
    await restoreTable(table);
  }

  // Restore products
  await restoreTable("products");

  console.log("\nAll restore operations finished!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
