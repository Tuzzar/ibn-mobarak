import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { MASTER_ART_CATEGORIES } from "../src/data/artCategories";
import { DEMO_ART_PRODUCTS } from "../src/data/artCatalog";

// Read environment variables
const env = readFileSync(".env", "utf8");
let supabaseUrl = "https://vdbkannwrsekvrdwijrx.supabase.co";
let serviceRoleKey = "";

for (const line of env.split("\n")) {
  if (line.startsWith("SUPABASE_URL=")) supabaseUrl = line.split("=")[1].replace(/"/g, "").trim();
  if (line.startsWith("SUPABASE_SERVICE_ROLE_KEY=")) serviceRoleKey = line.split("=")[1].replace(/"/g, "").trim();
}

if (!serviceRoleKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("🚀 Starting Category & Subcategory seeding...");

  // 1. Clear existing menu_categories
  const { error: delErr } = await supabase.from("menu_categories").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (delErr) {
    console.warn("Notice while clearing menu_categories:", delErr.message);
  }

  let totalParents = 0;
  let totalSubs = 0;

  // 2. Insert parent categories and subcategories
  for (let i = 0; i < MASTER_ART_CATEGORIES.length; i++) {
    const parent = MASTER_ART_CATEGORIES[i];
    const { data: parentRow, error: pErr } = await supabase
      .from("menu_categories")
      .insert({
        parent_id: null,
        name: `${parent.bengali} (${parent.name})`,
        label: `${parent.bengali} (${parent.name})`,
        slug: parent.slug,
        icon: parent.iconName,
        sort_order: i * 10,
        is_active: true,
      })
      .select("id")
      .single();

    if (pErr || !parentRow) {
      console.error(`Failed to insert parent category "${parent.name}":`, pErr?.message);
      continue;
    }

    totalParents++;
    console.log(`✅ [Parent ${totalParents}] ${parent.bengali} (${parent.slug})`);

    // Insert subcategories for this parent
    for (let j = 0; j < parent.subcategories.length; j++) {
      const sub = parent.subcategories[j];
      const { error: sErr } = await supabase.from("menu_categories").insert({
        parent_id: parentRow.id,
        name: `${sub.bengali} (${sub.name})`,
        label: `${sub.bengali} (${sub.name})`,
        slug: sub.slug,
        icon: null,
        sort_order: j + 1,
        is_active: true,
      });

      if (sErr) {
        console.error(`   Failed to insert subcategory "${sub.name}":`, sErr.message);
      } else {
        totalSubs++;
      }
    }
  }

  console.log(`\n🎉 Seeded ${totalParents} parent categories and ${totalSubs} subcategories successfully!`);

  // 3. Clear obsolete grocery products if any and sync genuine art supplies
  console.log("\n📦 Refreshing products table with art supplies...");
  // Check existing products
  const { data: existingProducts } = await supabase.from("products").select("id, name, category");
  const groceryItems = (existingProducts || []).filter(
    (p: any) => ["Fruits", "Dates", "Organic", "Nuts", "Oil", "Honey"].includes(p.category)
  );

  if (groceryItems.length > 0) {
    console.log(`Removing ${groceryItems.length} old grocery products...`);
    for (const item of groceryItems) {
      await supabase.from("products").delete().eq("id", item.id);
    }
  }

  // Insert or upsert authentic art products
  for (let idx = 0; idx < DEMO_ART_PRODUCTS.length; idx++) {
    const prod = DEMO_ART_PRODUCTS[idx];
    const { error: prodErr } = await supabase.from("products").upsert(
      {
        slug: prod.slug,
        name: prod.name,
        price: prod.price,
        discount_amount: prod.discount_amount,
        image_url: prod.image_url,
        image: prod.image_url,
        images: [prod.image_url],
        unit: prod.unit,
        category: prod.category,
        subcategory: prod.subcategory || null,
        featured: prod.featured,
        stock: prod.inStock ? 50 : 0,
        description: prod.description,
        sort_order: idx + 1,
        product_level: prod.featured ? "A" : "B",
      },
      { onConflict: "slug" }
    );

    if (prodErr) {
      console.warn(`Product upsert warning for ${prod.name}:`, prodErr.message);
    }
  }

  console.log(`✅ Synchronized ${DEMO_ART_PRODUCTS.length} authentic art products into Supabase.`);
}

seed().catch((err) => {
  console.error("Seed script failed:", err);
  process.exit(1);
});
