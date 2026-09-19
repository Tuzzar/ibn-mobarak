import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { MASTER_ART_CATEGORIES } from "../src/data/artCategories";

// 1. Supabase credentials
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

// 2. Checkpoint management
const CHECKPOINT_FILE = "scripts/.ingest-checkpoint.json";

interface Checkpoint {
  lastIndex: number;
  totalProcessed: number;
  totalSucceeded: number;
  totalFailed: number;
}

function loadCheckpoint(): Checkpoint {
  if (existsSync(CHECKPOINT_FILE)) {
    try {
      return JSON.parse(readFileSync(CHECKPOINT_FILE, "utf8"));
    } catch {}
  }
  return { lastIndex: 0, totalProcessed: 0, totalSucceeded: 0, totalFailed: 0 };
}

function saveCheckpoint(cp: Checkpoint) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

// 3. Pricing rule: Ahbab price + 2% with smart rounding for Bangladeshi Taka
export function calculatePrice(rawPrice: number): number {
  if (!rawPrice || rawPrice <= 0) return 0;
  const markedUp = rawPrice * 1.02;
  if (markedUp >= 500) {
    // Round to nearest 5 for large amounts
    return Math.round(markedUp / 5) * 5;
  }
  // Round to nearest whole taka for lower amounts
  return Math.round(markedUp);
}

// 4. Image URL normalization
export function formatImageUrl(path: string | undefined | null): string {
  if (!path) return "https://artlabbd.com/wp-content/uploads/2024/08/Mont-Marte-Acrylic-Colour-Pastel-Colours-48pc-x-36ml-MSCP4836_V01-L3_c57a7353-cd68-4bef-b13f-f4b931e964d3-600x600.jpg";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `https://cdn.ahbab.art/${cleanPath}`;
}

// 5. Category and Subcategory classification mapper
export function classifyProduct(item: any): { category: string; subcategory: string | null } {
  const title = (item.name || "").toLowerCase();
  const slug = (item.slug || "").toLowerCase();
  const cats = (item.categories || []).map((c: any) => (c.name || c.slug || "").toLowerCase()).join(" ");
  const desc = (item.description || item.shortDescription || "").toLowerCase();
  const text = `${title} ${slug} ${cats} ${desc}`;

  // Calligraphy
  if (text.includes("calligraphy") || text.includes("qalam") || text.includes("kalam") || text.includes("nib") || text.includes("দাওয়াত") || text.includes("হেন্দাম")) {
    let sub = "calligraphy-qalam";
    if (text.includes("nib") || text.includes("holder")) sub = "calligraphy-nibs";
    else if (text.includes("ink")) sub = "calligraphy-inks";
    else if (text.includes("paper") || text.includes("sheet")) sub = "calligraphy-paper";
    else if (text.includes("lika") || text.includes("dawat")) sub = "lika-dawat-accessories";
    return { category: "calligraphy", subcategory: sub };
  }

  // Lippan & Craft & Clay
  if (text.includes("lippan") || text.includes("clay") || text.includes("mirror") || text.includes("mould") || text.includes("mold") || text.includes("decoupage") || text.includes("mod podge")) {
    let sub = "craft-clay";
    if (text.includes("mirror")) sub = "lippan-mirrors";
    else if (text.includes("clay") || text.includes("terracotta")) sub = "air-dry-clay";
    else if (text.includes("tool") || text.includes("mold") || text.includes("mould")) sub = "clay-tools-molds";
    else if (text.includes("decoupage")) sub = "decoupage-craft";
    else if (text.includes("podge") || text.includes("glue")) sub = "mod-podge-glue";
    return { category: "craft-clay", subcategory: sub };
  }

  // Canvas & Boards
  if (text.includes("canvas") || text.includes("board") || text.includes("panel")) {
    let sub = "canvas-panels";
    if (text.includes("stretched")) sub = "stretched-canvas";
    else if (text.includes("round") || text.includes("oval")) sub = "round-oval-canvas";
    else if (text.includes("pad") || text.includes("roll")) sub = "canvas-pads-rolls";
    else if (text.includes("mini") && text.includes("easel")) sub = "mini-canvas-easel";
    return { category: "canvas", subcategory: sub };
  }

  // Brushes & Tools
  if (text.includes("brush") || text.includes("palette knife") || text.includes("knife") || text.includes("scraper") || text.includes("washer")) {
    let sub = "brush-sets";
    if (text.includes("round")) sub = "round-brushes";
    else if (text.includes("flat") || text.includes("bright")) sub = "flat-brushes";
    else if (text.includes("filbert") || text.includes("fan")) sub = "filbert-fan-brushes";
    else if (text.includes("detail") || text.includes("liner")) sub = "detail-liner-brushes";
    else if (text.includes("mop") || text.includes("wash")) sub = "wash-mop-brushes";
    else if (text.includes("knife")) sub = "palette-knives";
    else if (text.includes("palette") || text.includes("washer")) sub = "palettes-washers";
    return { category: "brushes", subcategory: sub };
  }

  // Easels & Stands
  if (text.includes("easel") || text.includes("stand") || text.includes("tripod")) {
    let sub = "tabletop-easels";
    if (text.includes("studio") || text.includes("a-frame")) sub = "studio-easels";
    else if (text.includes("tripod") || text.includes("field")) sub = "tripod-field-easels";
    else if (text.includes("display") || text.includes("plate")) sub = "display-stands";
    return { category: "easels", subcategory: sub };
  }

  // Paper & Sketchbooks
  if (text.includes("sketchbook") || text.includes("paper") || text.includes("pad") || text.includes("journal") || text.includes("sheet")) {
    let sub = "sketchbooks";
    if (text.includes("watercolour") || text.includes("watercolor") || text.includes("300gsm") || text.includes("300 gsm")) sub = "watercolor-paper";
    else if (text.includes("acrylic")) sub = "acrylic-paper";
    else if (text.includes("mixed media")) sub = "mixed-media-paper";
    else if (text.includes("black")) sub = "black-paper";
    else if (text.includes("tracing") || text.includes("grid")) sub = "tracing-grid-paper";
    return { category: "paper-sketch", subcategory: sub };
  }

  // Mediums & Varnishes
  if (text.includes("gesso") || text.includes("varnish") || text.includes("medium") || text.includes("paste") || text.includes("resin") || text.includes("turpentine") || text.includes("linseed")) {
    let sub = "gesso-primers";
    if (text.includes("varnish")) sub = "gloss-matte-varnish";
    else if (text.includes("pouring") || text.includes("glaze")) sub = "pouring-medium";
    else if (text.includes("paste") || text.includes("texture") || text.includes("modeling")) sub = "texture-modeling-paste";
    else if (text.includes("turpentine") || text.includes("linseed") || text.includes("oil")) sub = "linseed-turpentine";
    else if (text.includes("resin")) sub = "resin-hardener";
    return { category: "mediums", subcategory: sub };
  }

  // Drawing & Sketching
  if (text.includes("pencil") || text.includes("charcoal") || text.includes("marker") || text.includes("fineliner") || text.includes("eraser") || text.includes("sharpener") || text.includes("blender") || text.includes("pen")) {
    let sub = "graphite-charcoal";
    if (text.includes("colored") || text.includes("colour pencil")) sub = "colored-pencils";
    else if (text.includes("marker")) sub = "art-markers";
    else if (text.includes("fineliner") || text.includes("micron")) sub = "fineliners-pens";
    else if (text.includes("eraser") || text.includes("sharpener") || text.includes("blender")) sub = "erasers-blenders";
    return { category: "drawing", subcategory: sub };
  }

  // Combos & Sets
  if (text.includes("combo") || text.includes("kit") || text.includes("set") || text.includes("pack")) {
    return { category: "combos", subcategory: "beginner-art-kits" };
  }

  // Paints & Colours default
  let sub = "acrylic-colour";
  if (text.includes("oil")) sub = "oil-colour";
  else if (text.includes("water")) sub = "water-colour";
  else if (text.includes("gouache")) sub = "gouache-colour";
  else if (text.includes("poster") || text.includes("fabric")) sub = "poster-fabric-colour";
  else if (text.includes("glass") || text.includes("ceramic")) sub = "glass-ceramic-colour";
  else if (text.includes("metallic") || text.includes("neon")) sub = "metallic-neon-paints";
  else if (text.includes("marker")) sub = "acrylic-markers";

  return { category: "paints", subcategory: sub };
}

// 6. Main Runner
async function main() {
  const args = process.argv.slice(2);
  let limit = 250; // default Phase 1 batch
  let startIdx = 0;
  let isAll = false;
  let isResume = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--limit" && args[i + 1]) {
      limit = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === "--phase" && args[i + 1]) {
      const phaseNum = parseInt(args[i + 1], 10);
      if (phaseNum === 1) {
        startIdx = 0;
        limit = 300;
      } else if (phaseNum === 2) {
        startIdx = 300;
        limit = 1000;
      } else if (phaseNum === 3) {
        startIdx = 1300;
        limit = 3000;
      }
      i++;
    } else if (args[i] === "--all") {
      isAll = true;
      limit = 99999;
    } else if (args[i] === "--resume") {
      isResume = true;
    }
  }

  console.log("📥 Fetching Ahbab sitemap to get complete product URLs...");
  const sitemapRes = await fetch("https://ahbab.com.bd/sitemap.xml", {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  const sitemapText = await sitemapRes.text();
  const rawMatches = sitemapText.match(/<loc>https:\/\/ahbab\.com\.bd\/product\/[^<]+<\/loc>/g) || [];
  const allSlugs = rawMatches.map((m) =>
    m.replace("<loc>https://ahbab.com.bd/product/", "").replace("</loc>", "")
  );

  console.log(`📋 Total products found in Ahbab sitemap: ${allSlugs.length}`);

  let checkpoint = loadCheckpoint();
  if (isResume) {
    startIdx = checkpoint.lastIndex;
    console.log(`🔄 Resuming from index ${startIdx}...`);
  }

  const endIdx = isAll ? allSlugs.length : Math.min(startIdx + limit, allSlugs.length);
  const targetSlugs = allSlugs.slice(startIdx, endIdx);

  console.log(`🎯 Ingesting batch: Index ${startIdx} to ${endIdx} (${targetSlugs.length} products)...\n`);

  const CONCURRENCY = 15;
  const BATCH_SIZE = 50;
  let batchProducts: any[] = [];
  let totalSaved = 0;
  let totalErrors = 0;

  for (let i = 0; i < targetSlugs.length; i += CONCURRENCY) {
    const chunk = targetSlugs.slice(i, i + CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map(async (slug) => {
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
          if (!json?.success || !json?.data) return null;
          return json.data;
        } catch {
          return null;
        }
      })
    );

    for (const raw of chunkResults) {
      if (!raw || !raw.name) {
        totalErrors++;
        continue;
      }

      const originalPrice = Number(raw.nonVariation?.sellingPrice || raw.sellingPrice || raw.retailPrice || raw.nonVariation?.regularPrice || 0);
      const calculatedSellingPrice = calculatePrice(originalPrice);
      const originalRegularPrice = Number(raw.nonVariation?.regularPrice || raw.regularPrice || originalPrice);
      const calculatedRegularPrice = calculatePrice(originalRegularPrice);
      const discountAmount = Math.max(0, calculatedRegularPrice - calculatedSellingPrice);

      const images = Array.isArray(raw.galleryImage) && raw.galleryImage.length > 0
        ? raw.galleryImage.map((img: string) => formatImageUrl(img))
        : [formatImageUrl(null)];

      const { category, subcategory } = classifyProduct(raw);

      const productRecord = {
        name: raw.name.trim(),
        slug: raw.slug || `art-${Date.now().toString(36)}`,
        price: calculatedSellingPrice,
        discount_amount: discountAmount,
        image_url: images[0],
        image: images[0],
        images,
        unit: raw.unit || "Pcs",
        category,
        subcategory,
        description: raw.description || raw.shortDescription || raw.name,
        stock: Number(raw.nonVariation?.stock ?? raw.totalStock ?? 25),
        featured: Boolean(raw.isFlashDeal || (raw.totalSell && raw.totalSell > 20)),
        product_level: "A",
        sort_order: startIdx + i + 1,
      };

      batchProducts.push(productRecord);
    }

    // When batch size reaches 50 or at the end, upsert to Supabase
    if (batchProducts.length >= BATCH_SIZE || i + CONCURRENCY >= targetSlugs.length) {
      if (batchProducts.length > 0) {
        const { error: upsertErr } = await supabase.from("products").upsert(batchProducts, {
          onConflict: "slug",
        });

        if (upsertErr) {
          console.error(`❌ Batch upsert error:`, upsertErr.message);
        } else {
          totalSaved += batchProducts.length;
          console.log(`✅ [${totalSaved}/${targetSlugs.length}] Synced batch into Supabase (Last: "${batchProducts[batchProducts.length - 1].name.slice(0, 35)}..." @ ৳${batchProducts[batchProducts.length - 1].price})`);
        }

        batchProducts = [];
      }
    }

    // Save checkpoint
    checkpoint.lastIndex = startIdx + i + chunk.length;
    checkpoint.totalProcessed = checkpoint.lastIndex;
    checkpoint.totalSucceeded = (checkpoint.totalSucceeded || 0) + chunkResults.filter(Boolean).length;
    saveCheckpoint(checkpoint);

    // Small delay to keep network smooth
    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`\n🎉 Ingestion Phase Complete!`);
  console.log(`📊 Successfully saved: ${totalSaved} products`);
  console.log(`⚠️ Skipped/Failed: ${totalErrors}`);
  console.log(`📍 Current Checkpoint Index: ${checkpoint.lastIndex}/${allSlugs.length}`);
}

main().catch((err) => {
  console.error("Ingestion script failed:", err);
  process.exit(1);
});
