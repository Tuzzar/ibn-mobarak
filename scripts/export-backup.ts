import { createClient } from "@supabase/supabase-js";
import fs from "node:fs/promises";
import path from "node:path";

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const client = createClient(url, key);

const backupDir = path.resolve(import.meta.dir, "../backup_data");
await fs.mkdir(backupDir, { recursive: true });

const tables = [
  "products",
  "site_content",
  "menu_categories",
  "orders",
  "landing_pages",
  "user_roles"
];

for (const table of tables) {
  console.log(`Exporting table "${table}"...`);
  let allRows: any[] = [];
  const pageSize = 1000;
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await client
      .from(table)
      .select("*")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error(`Error exporting ${table}:`, error);
      break;
    }

    if (data && data.length > 0) {
      allRows = allRows.concat(data);
      from += pageSize;
      if (data.length < pageSize) {
        hasMore = false;
      }
    } else {
      hasMore = false;
    }
  }

  const filePath = path.join(backupDir, `${table}.json`);
  await fs.writeFile(filePath, JSON.stringify(allRows, null, 2), "utf-8");
  console.log(`Saved ${allRows.length} rows to ${filePath}`);
}

console.log("Full backup completed successfully!");
