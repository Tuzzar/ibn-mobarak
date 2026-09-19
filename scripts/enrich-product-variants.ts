import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
// Pricing rule: Ahbab price + 2% with smart rounding for Bangladeshi Taka
export function calculatePrice(rawPrice: number): number {
  if (!rawPrice || rawPrice <= 0) return 0;
  const markedUp = rawPrice * 1.02;
  if (markedUp >= 500) {
    return Math.round(markedUp / 5) * 5;
  }
  return Math.round(markedUp);
}

export function formatImageUrl(path: string | undefined | null): string {
  if (!path) return "https://artlabbd.com/wp-content/uploads/2024/08/Mont-Marte-Acrylic-Colour-Pastel-Colours-48pc-x-36ml-MSCP4836_V01-L3_c57a7353-cd68-4bef-b13f-f4b931e964d3-600x600.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `https://cdn.ahbab.art/${cleanPath}`;
}

// Supabase client setup
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

export async function enrichProductVariants(slug: string, dbId?: string) {
  try {
    const url = `https://api.ahbab.art/api/v1/product/admin-customer/view-with-similar/${slug}?similarLimit=1`;
    const res = await fetch(url, {
      headers: {
        Origin: "https://ahbab.com.bd",
        Referer: "https://ahbab.com.bd/",
        "User-Agent": "Mozilla/5.0",
      },
    });

    const json = await res.json().catch(() => null);
    if (!json?.success || !json?.data) return { status: "not_found" };

    const data = json.data;
    if (!data.isVariant || !Array.isArray(data.variations) || data.variations.length === 0) {
      return { status: "no_variants" };
    }

    const variants = data.variations.map((v: any) => {
      const opt = v.attributeOpts?.[0];
      const label = (opt?.name || v.name || "Default").trim();
      const attribute = (opt?.attributeName || "Size").trim();

      const sellingPrice = Number(v.sellingPrice || v.regularPrice || 0);
      const regularPrice = Number(v.regularPrice || sellingPrice);

      const ourSellingPrice = calculatePrice(sellingPrice);
      const ourRegularPrice = calculatePrice(regularPrice);

      const img = Array.isArray(v.images) && v.images[0] ? formatImageUrl(v.images[0]) : null;

      return {
        id: v._id || label,
        label,
        attribute,
        price: ourSellingPrice,
        original_price: ourRegularPrice > ourSellingPrice ? ourRegularPrice : undefined,
        stock: Number(v.stock ?? 25),
        image_url: img,
      };
    });

    // Calculate total stock
    const totalStock = variants.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    // Base price = primary variant price (usually the first or lowest)
    const basePrice = variants[0]?.price || 0;

    let updateQuery = supabase.from("products").update({
      weight_variants: variants,
      stock: totalStock,
      price: basePrice,
    });

    if (dbId) {
      updateQuery = updateQuery.eq("id", dbId);
    } else {
      updateQuery = updateQuery.eq("slug", slug);
    }

    const { error } = await updateQuery;
    if (error) {
      console.error(`Error updating product ${slug}:`, error);
      return { status: "error", error };
    }

    return {
      status: "updated",
      name: data.name,
      variantsCount: variants.length,
      variants,
    };
  } catch (err) {
    return { status: "error", error: err };
  }
}

async function main() {
  const args = process.argv.slice(2);
  let targetSlug = "";
  let limit = 200;
  let phase = 1;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--slug" && args[i + 1]) {
      targetSlug = args[i + 1];
      i++;
    } else if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--phase" && args[i + 1]) {
      phase = parseInt(args[i + 1], 10);
      i++;
    }
  }

  if (targetSlug) {
    console.log(`🔍 Enriching single product: ${targetSlug}...`);
    const res = await enrichProductVariants(targetSlug);
    console.log("Result:", JSON.stringify(res, null, 2));
    return;
  }

  // Phased enrichment
  let startIdx = 0;
  if (phase === 1) {
    startIdx = 0;
    limit = 250;
  } else if (phase === 2) {
    startIdx = 250;
    limit = 750;
  } else if (phase === 3) {
    startIdx = 1000;
    limit = 3000;
  }

  console.log(`🚀 Starting Phase ${phase}: scanning products from index ${startIdx}, limit ${limit}...`);
  const { data: products } = await supabase
    .from("products")
    .select("id, slug, name, category")
    .order("sort_order", { ascending: true })
    .range(startIdx, startIdx + limit - 1);

  if (!products || products.length === 0) {
    console.log("No products found for this range.");
    return;
  }

  console.log(`Found ${products.length} products to check for variants...`);

  let updatedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  const CONCURRENCY = 10;
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const chunk = products.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      chunk.map((p) => enrichProductVariants(p.slug, p.id))
    );

    for (let j = 0; j < results.length; j++) {
      const res = results[j];
      const prod = chunk[j];
      if (res.status === "updated") {
        updatedCount++;
        const variantSummary = res.variants?.map((v: any) => `${v.label} (৳${v.price})`).join(", ");
        console.log(`✅ [${res.variantsCount} VARIANTS] ${prod.name} -> ${variantSummary}`);
      } else if (res.status === "no_variants" || res.status === "not_found") {
        skippedCount++;
      } else {
        errorCount++;
      }
    }
  }

  console.log(`\n🎉 Phase ${phase} Complete!`);
  console.log(`  Updated with variants: ${updatedCount}`);
  console.log(`  Single/No variants: ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);
}

if (import.meta.main) {
  main();
}
