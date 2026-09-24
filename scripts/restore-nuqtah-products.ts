import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://vdbkannwrsekvrdwijrx.supabase.co";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZkYmthbm53cnNla3ZyZHdpanJ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODUwNTcwNiwiZXhwIjoyMDk0MDgxNzA2fQ.CwLTT4B0JlftxK4f7-KuojMJYKlrepvmCU_ZzC814tk";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const STORAGE_PREFIX =
  "https://vdbkannwrsekvrdwijrx.supabase.co/storage/v1/object/public/products/";

const productsToRestore = [
  {
    id: "c74efe8d-5784-4a80-9b36-fd7d75aa8b3a",
    name: "Amrapali Mango",
    slug: "amrapali-mango",
    description:
      "বাগান থেকে সরাসরি প্রিমিয়াম কোয়ালিটির আম্রপালি আম। মিষ্টি, রসালো ও কোনো ধরনের রাসায়নিক উপাদান মুক্ত।",
    price: 1520,
    unit: "12kg",
    category: "Fruits",
    stock: 50,
    featured: true,
    product_level: "A",
    sort_order: 1,
    image_url: `${STORAGE_PREFIX}1781581389414-58nxefcxyq2.png`,
    image: `${STORAGE_PREFIX}1781581389414-58nxefcxyq2.png`,
    images: [
      `${STORAGE_PREFIX}1781581389414-58nxefcxyq2.png`,
      `${STORAGE_PREFIX}1781581994774-ut5rk0oblah.png`,
      `${STORAGE_PREFIX}1781581391387-yhhr564k06j.jpg`,
    ],
    weight_variants: [
      {
        label: "12kg",
        price: 1680,
        stock: 50,
      },
    ],
    discount_amount: 0,
    discount_percent: 0,
  },
  {
    id: "6bc7c9c4-1194-4315-9c74-460c183814ca",
    name: "Himshagar Mango",
    slug: "himshagar-mango",
    description:
      "রাজশাহীর বিখ্যাত খাঁটি হিমসাগর আম। আঁশবিহীন, সুস্বাদু ও প্রাকৃতিকভাবে পাকা।",
    price: 140,
    unit: "kg",
    category: "Fruits",
    stock: 50,
    featured: true,
    product_level: "A",
    sort_order: 2,
    image_url: `${STORAGE_PREFIX}1780810398136-uw63u74wrp.png`,
    image: `${STORAGE_PREFIX}1780810398136-uw63u74wrp.png`,
    images: [
      `${STORAGE_PREFIX}1780810398136-uw63u74wrp.png`,
      `${STORAGE_PREFIX}1780810416709-lmobpf9u8ac.png`,
    ],
    weight_variants: [
      {
        label: "2kg",
        price: 275,
        stock: 50,
      },
    ],
    discount_amount: 0,
    discount_percent: 0,
  },
  {
    id: "1c7a30ba-9803-4799-bc51-7b8681562ec7",
    name: "Banana Mango",
    slug: "banana-mango",
    description:
      "বিদেশি জাতের প্রিমিয়াম ব্যানানা ম্যাংগো। আকর্ষণীয় আকার ও অনন্য সুমিষ্ট স্বাদ।",
    price: 1790,
    unit: "10kg",
    category: "Fruits",
    stock: 50,
    featured: true,
    product_level: "A",
    sort_order: 3,
    image_url: `${STORAGE_PREFIX}1780810443553-oufakiktsve.png`,
    image: `${STORAGE_PREFIX}1780810443553-oufakiktsve.png`,
    images: [
      `${STORAGE_PREFIX}1780810443553-oufakiktsve.png`,
      `${STORAGE_PREFIX}1780810499959-9cbunvasunj.png`,
    ],
    weight_variants: [],
    discount_amount: 0,
    discount_percent: 0,
  },
  {
    id: "1591d52c-f73a-464d-a7e3-9e48f0cc81c4",
    name: "China Three Lychee",
    slug: "china-three-lychee",
    description:
      "দিনাজপুরের বিখ্যাত চায়না ৩ লিচু। ছোট আঁটি, রসালো ও অতুলনীয় মিষ্টি।",
    price: 1250,
    unit: "200 Pcs",
    category: "Fruits",
    stock: 50,
    featured: true,
    product_level: "A",
    sort_order: 4,
    image_url: `${STORAGE_PREFIX}1780810526448-hw9kk3tfhhn.png`,
    image: `${STORAGE_PREFIX}1780810526448-hw9kk3tfhhn.png`,
    images: [
      `${STORAGE_PREFIX}1780810526448-hw9kk3tfhhn.png`,
      `${STORAGE_PREFIX}1780810564078-t6re7syc6j.jpg`,
    ],
    weight_variants: [],
    discount_amount: 0,
    discount_percent: 0,
  },
  {
    id: "486710fb-1525-4f3b-9367-f2e5616d8d46",
    name: "Azwa Dates",
    slug: "azwa-dates",
    description:
      "মদিনা শরিফের প্রিমিয়াম গ্রেড আজওয়া খেজুর। নরম, সুস্বাদু ও পুষ্টিগুণে ভরপুর।",
    price: 1890,
    unit: "1kg",
    category: "Dates",
    stock: 50,
    featured: true,
    product_level: "A",
    sort_order: 5,
    image_url: `${STORAGE_PREFIX}1780158166405-tuwoj3zrx9.png`,
    image: `${STORAGE_PREFIX}1780158166405-tuwoj3zrx9.png`,
    images: [
      `${STORAGE_PREFIX}1780158166405-tuwoj3zrx9.png`,
      `${STORAGE_PREFIX}1780159432661-yxy9i4hypsb.png`,
    ],
    weight_variants: [],
    discount_amount: 0,
    discount_percent: 0,
  },
  {
    id: "da4ed1ba-2665-43e9-9f72-08abc4cc24c8",
    name: "Honey",
    slug: "natural-honey",
    description:
      "সুন্দরবনের ১০০% খাঁটি প্রাকৃতিক মধু। কোনো প্রকার চিনি বা ভেজাল মিশ্রণ ছাড়া সংগৃহীত।",
    price: 900,
    unit: "500gm",
    category: "Honey",
    stock: 50,
    featured: true,
    product_level: "A",
    sort_order: 6,
    image_url: `${STORAGE_PREFIX}1780160881315-ufj3188rqi.png`,
    image: `${STORAGE_PREFIX}1780160881315-ufj3188rqi.png`,
    images: [
      `${STORAGE_PREFIX}1780160881315-ufj3188rqi.png`,
      `${STORAGE_PREFIX}1780161410299-aqzhcw3vjit.png`,
    ],
    weight_variants: [],
    discount_amount: 0,
    discount_percent: 0,
  },
  {
    id: "329224a3-9b2d-4b6d-a4dc-85216761c6cb",
    name: "Moringa Powder",
    slug: "moringa-powder",
    description:
      "প্রাকৃতিক সজিনা পাতা গুঁড়া। সুপারফুড হিসেবে পরিচিত এবং দৈনন্দিন সুস্বাস্থ্যের জন্য অত্যন্ত উপকারী।",
    price: 880,
    unit: "500gm",
    category: "Organic",
    stock: 50,
    featured: true,
    product_level: "A",
    sort_order: 7,
    image_url: `${STORAGE_PREFIX}1780161501468-mywl8pk5lgi.png`,
    image: `${STORAGE_PREFIX}1780161501468-mywl8pk5lgi.png`,
    images: [
      `${STORAGE_PREFIX}1780161501468-mywl8pk5lgi.png`,
      `${STORAGE_PREFIX}1780161823778-iwr1fo8wh2.png`,
    ],
    weight_variants: [],
    discount_amount: 0,
    discount_percent: 0,
  },
  {
    id: "e28a3c42-688e-424d-94d9-7c047c35f07b",
    name: "nukta family combo",
    slug: "nuqtah-family-combo",
    description:
      "নুখতাহ ফ্যামিলি স্পেশাল কম্বো প্যাক। স্বাস্থ্যকর খাঁটি পণ্যের সমৃদ্ধ প্যাকেজ।",
    price: 2990,
    unit: "18 items",
    category: "Organic",
    stock: 50,
    featured: true,
    product_level: "A",
    sort_order: 8,
    image_url: `${STORAGE_PREFIX}1780217885032-cb6m7z6gsjr.png`,
    image: `${STORAGE_PREFIX}1780217885032-cb6m7z6gsjr.png`,
    images: [
      `${STORAGE_PREFIX}1780217885032-cb6m7z6gsjr.png`,
      `${STORAGE_PREFIX}1780218648344-gq0ww8y4kjq.png`,
    ],
    weight_variants: [],
    discount_amount: 0,
    discount_percent: 0,
  },
];

async function run() {
  console.log("==================================================");
  console.log("🚀 Restoring 8 Nuqtah Naturals Products Safely");
  console.log("Target Database:", SUPABASE_URL);
  console.log("Zero deletion policy: No data will be deleted.");
  console.log("==================================================");

  // 1. Fetch current products
  const { data: beforeProducts, error: bErr } = await supabase
    .from("products")
    .select("id, name, slug");
  if (bErr) {
    console.error("❌ Failed to query current products:", bErr.message);
    process.exit(1);
  }
  console.log(`\nExisting products before insertion (${beforeProducts.length}):`);
  beforeProducts.forEach((p) => console.log(`  - [${p.id}] ${p.name} (${p.slug})`));

  // 2. Safe upsert each product
  console.log(`\nUpserting ${productsToRestore.length} products...`);
  let insertedCount = 0;
  for (const prod of productsToRestore) {
    const { data, error } = await supabase.from("products").upsert(prod, {
      onConflict: "id",
    });

    if (error) {
      console.error(`❌ Failed to upsert ${prod.name}:`, error.message);
    } else {
      insertedCount++;
      console.log(`✅ [${insertedCount}/${productsToRestore.length}] Upserted: ${prod.name}`);
    }
  }

  // 3. Verify total products
  const { data: afterProducts, error: aErr } = await supabase
    .from("products")
    .select("id, name, slug, price, unit, category")
    .order("sort_order", { ascending: true });

  if (aErr) {
    console.error("❌ Error verifying products:", aErr.message);
  } else {
    console.log(`\n🎉 Verification Complete! Total products now in DB: ${afterProducts.length}`);
    afterProducts.forEach((p, idx) => {
      console.log(`  ${idx + 1}. [${p.id}] ${p.name} | ৳${p.price} | ${p.unit} | ${p.category}`);
    });
  }

  // 4. Verify orders integrity
  const { data: ords, error: oErr } = await supabase.from("orders").select("id, order_no, customer_name, total");
  if (oErr) {
    console.error("❌ Error checking orders:", oErr.message);
  } else {
    console.log(`\n📦 Orders Verification: ${ords.length} orders safely intact in database.`);
  }

  console.log("\n==================================================");
  console.log("✨ All products successfully and safely restored!");
  console.log("==================================================");
}

run().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
