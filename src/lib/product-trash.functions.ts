import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

export type TrashedProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stock: number;
  category: string | null;
  subcategory: string | null;
  unit: string | null;
  image_url: string | null;
  images: string[];
  featured: boolean;
  product_level: string;
  sort_order: number;
  weight_variants: Json;
  discount_amount: number;
  trashed_at: string;
};

const TRASH_SETTINGS_KEY = "trashed_products_v1";

async function loadTrashList(admin: any): Promise<TrashedProduct[]> {
  const { data } = await admin
    .from("app_settings")
    .select("value")
    .eq("key", TRASH_SETTINGS_KEY)
    .maybeSingle();

  if (!data?.value) return [];
  try {
    const parsed = JSON.parse(data.value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveTrashList(admin: any, list: TrashedProduct[]): Promise<void> {
  const { error } = await admin.from("app_settings").upsert({
    key: TRASH_SETTINGS_KEY,
    value: JSON.stringify(list),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Failed to save trash list: ${error.message}`);
}

export const getAdminTrashedProducts = createServerFn({ method: "GET" }).handler(
  async () => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );
    const list = await loadTrashList(admin);
    return list.sort(
      (a, b) =>
        new Date(b.trashed_at).getTime() - new Date(a.trashed_at).getTime(),
    );
  },
);

const moveProductSchema = z.object({
  productId: z.string().min(1),
});

export const moveAdminProductToTrash = createServerFn({ method: "POST" })
  .validator((input: unknown) => moveProductSchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    // 1. Fetch current product
    const { data: prod, error } = await admin
      .from("products")
      .select("*")
      .eq("id", data.productId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!prod) throw new Error("Product not found");

    // 2. Load existing trash
    const list = await loadTrashList(admin);

    // 3. Remove duplicate if already present in trash
    const filtered = list.filter((p) => p.id !== data.productId);

    // 4. Add to trash list with trashed_at timestamp
    const trashedItem: TrashedProduct = {
      id: prod.id,
      name: prod.name,
      slug: prod.slug,
      description: prod.description ?? null,
      price: Number(prod.price) || 0,
      stock: Number(prod.stock) || 0,
      category: prod.category ?? null,
      subcategory: prod.subcategory ?? null,
      unit: prod.unit ?? null,
      image_url: prod.image_url ?? null,
      images: Array.isArray(prod.images) ? (prod.images as string[]) : [],
      featured: Boolean(prod.featured),
      product_level: prod.product_level || "F",
      sort_order: Number(prod.sort_order) || 0,
      weight_variants: prod.weight_variants ?? [],
      discount_amount: Number(prod.discount_amount) || 0,
      trashed_at: new Date().toISOString(),
    };

    filtered.unshift(trashedItem);
    await saveTrashList(admin, filtered);

    // 5. Delete from active products table (R2 images remain intact)
    const { error: delErr } = await admin
      .from("products")
      .delete()
      .eq("id", data.productId);

    if (delErr) throw new Error(delErr.message);

    return { success: true, productName: prod.name };
  });

const restoreProductSchema = z.object({
  productId: z.string().min(1),
});

export const restoreAdminProductFromTrash = createServerFn({ method: "POST" })
  .validator((input: unknown) => restoreProductSchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    // 1. Find product in trash
    const list = await loadTrashList(admin);
    const item = list.find((p) => p.id === data.productId);
    if (!item) throw new Error("Item not found in trash");

    // 2. Check if slug is taken by another product in active catalog
    let finalSlug = item.slug;
    const { data: existing } = await admin
      .from("products")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (existing) {
      finalSlug = `${item.slug}-restored-${Date.now().toString(36).slice(-4)}`;
    }

    // 3. Re-insert into products table
    const insertPayload: any = {
      id: item.id,
      name: item.name,
      slug: finalSlug,
      description: item.description,
      price: item.price,
      stock: item.stock,
      category: item.category,
      subcategory: item.subcategory,
      unit: item.unit,
      image_url: item.image_url,
      images: item.images,
      featured: item.featured,
      product_level: item.product_level,
      sort_order: item.sort_order,
      weight_variants: item.weight_variants,
      discount_amount: item.discount_amount,
      updated_at: new Date().toISOString(),
    };

    const { error: insErr } = await admin.from("products").insert(insertPayload);
    if (insErr) throw new Error(`Failed to restore product: ${insErr.message}`);

    // 4. Remove from trash
    const remaining = list.filter((p) => p.id !== data.productId);
    await saveTrashList(admin, remaining);

    return { success: true, productName: item.name };
  });

const deletePermanentlySchema = z.object({
  productId: z.string().min(1),
  imageUrls: z.array(z.string()).optional(),
});

export const deleteAdminProductPermanently = createServerFn({ method: "POST" })
  .validator((input: unknown) => deletePermanentlySchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const list = await loadTrashList(admin);
    const item = list.find((p) => p.id === data.productId);

    // Collect all images to delete
    const itemImgs = item
      ? Array.from(
          new Set([
            ...(Array.isArray(item.images) ? item.images : []),
            ...(item.image_url ? [item.image_url] : []),
          ]),
        )
      : data.imageUrls ?? [];

    // Remove from trash list
    const remaining = list.filter((p) => p.id !== data.productId);
    await saveTrashList(admin, remaining);

    // Ensure deleted from products table as well
    await admin.from("products").delete().eq("id", data.productId);

    return { success: true, imagesToDelete: itemImgs };
  });

export const emptyAdminProductsTrash = createServerFn({ method: "POST" }).handler(
  async () => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const list = await loadTrashList(admin);
    const allImages: string[] = [];

    for (const item of list) {
      if (Array.isArray(item.images)) {
        item.images.forEach((img) => {
          if (img && typeof img === "string") allImages.push(img);
        });
      }
      if (item.image_url && typeof item.image_url === "string") {
        allImages.push(item.image_url);
      }
    }

    const uniqueImages = Array.from(new Set(allImages));

    // Clear trash in database
    await saveTrashList(admin, []);

    return {
      success: true,
      clearedCount: list.length,
      imagesToDelete: uniqueImages,
    };
  },
);
