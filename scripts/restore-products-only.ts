import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const url = "https://genfsqvjkpqeqrbikdnk.supabase.co";
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdlbmZzcXZqa3BxZXFyYmlrZG5rIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTgwNDY5NiwiZXhwIjoyMTA1MzgwNjk2fQ.DqAHZgsZsdIeAuIgox-1-V7EsrMfCeZMVA9oA_10FxI";

const client = createClient(url, key, {
  auth: { persistSession: false }
});

const backupDir = path.resolve(import.meta.dir, "../backup_data");

async function main() {
  const filePath = path.join(backupDir, "products.json");
  const raw = await fs.readFile(filePath, "utf-8");
  const rows: any[] = JSON.parse(raw);
  console.log(`Starting restore of ${rows.length} products...`);

  const chunkSize = 100;
  let successCount = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await client.from("products").upsert(chunk, { ignoreDuplicates: false });
    if (error) {
      console.error(`Error at chunk ${i}-${i + chunk.length}:`, error.message);
      break;
    } else {
      successCount += chunk.length;
      if (successCount % 500 === 0 || successCount === rows.length) {
        console.log(`  Progress: ${successCount}/${rows.length} products inserted.`);
      }
    }
  }
  console.log(`\nFinished: ${successCount}/${rows.length} products restored successfully!`);
}

main().catch(console.error);
