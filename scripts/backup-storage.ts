import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(url, key);

const storageBackupDir = path.resolve(import.meta.dir, "../backup_data/storage");

async function downloadFolder(bucket: string, prefix = "") {
  const { data: items, error } = await client.storage.from(bucket).list(prefix, { limit: 1000 });
  if (error || !items) {
    console.error(`Error listing ${bucket}/${prefix}:`, error);
    return;
  }

  for (const item of items) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      // It's a folder
      await downloadFolder(bucket, itemPath);
    } else {
      // It's a file
      const destPath = path.join(storageBackupDir, bucket, itemPath);
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      const { data: blob, error: dlErr } = await client.storage.from(bucket).download(itemPath);
      if (dlErr || !blob) {
        console.error(`Error downloading ${bucket}/${itemPath}:`, dlErr);
      } else {
        const buffer = Buffer.from(await blob.arrayBuffer());
        await fs.writeFile(destPath, buffer);
      }
    }
  }
}

for (const bucket of ["products", "product-images"]) {
  console.log(`Backing up storage bucket "${bucket}"...`);
  await downloadFolder(bucket);
  console.log(`Bucket "${bucket}" backup completed.`);
}
console.log("All storage files backed up!");
