// Universal Product Variants Engine for Art & Craft Supplies
// Supports sizes (A3, A4, 8x8), volumes (100ml, 250ml), colors (Golden, Silver), and pack counts.

export const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL"] as const;
export type SizeLabel = string;

export interface ProductVariant {
  id?: string;
  label: string; // e.g. "A3", "A4", "A5", "Golden", "Silver", "100ml", "8x8 inch"
  attribute?: string; // e.g. "Pad Size", "Colour", "Volume", "Size", "Pack Size"
  price: number; // Variant-specific price in BDT
  original_price?: number; // Regular/strike price if discounted
  stock: number; // Variant-specific inventory
  image_url?: string | null; // Optional variant-specific image
  sku?: string;
}

export type SizeStock = ProductVariant;

const STANDARD_ORDER = new Map<string, number>([
  ["A5", 1],
  ["A4", 2],
  ["A3", 3],
  ["A2", 4],
  ["A1", 5],
  ["S", 10],
  ["M", 11],
  ["L", 12],
  ["XL", 13],
  ["XXL", 14],
  ["XXXL", 15],
]);

export function isSizeLabel(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** Parse the raw jsonb variants column into ordered product variant rows. */
export function parseSizes(raw: unknown): ProductVariant[] {
  if (!Array.isArray(raw)) return [];
  const rows: ProductVariant[] = [];

  for (const entry of raw) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    const label = String(
      (entry as any).label ?? (entry as any).name ?? ""
    ).trim();
    if (!label) continue;

    // Deduplicate by label (case-insensitive)
    if (rows.some((r) => r.label.toLowerCase() === label.toLowerCase())) continue;

    const attribute = String(
      (entry as any).attribute ?? (entry as any).attributeName ?? "Size"
    ).trim();

    const price = Math.max(
      0,
      Number((entry as any).price ?? (entry as any).sellingPrice) || 0
    );

    const original_price = (entry as any).original_price
      ? Math.max(0, Number((entry as any).original_price) || 0)
      : undefined;

    const stock = Math.max(
      0,
      Math.floor(Number((entry as any).stock) || 0)
    );

    const image_url = (entry as any).image_url
      ? String((entry as any).image_url)
      : null;

    rows.push({
      id: String((entry as any).id ?? (entry as any)._id ?? label),
      label,
      attribute: attribute || "Size",
      price,
      original_price,
      stock,
      image_url,
    });
  }

  // Smart sort: standard paper sizes / S-M-L first, then price ascending
  return rows.sort((a, b) => {
    const orderA = STANDARD_ORDER.get(a.label.toUpperCase());
    const orderB = STANDARD_ORDER.get(b.label.toUpperCase());
    if (orderA != null && orderB != null) return orderA - orderB;
    if (orderA != null) return -1;
    if (orderB != null) return 1;
    if (a.price !== b.price) return a.price - b.price;
    return a.label.localeCompare(b.label);
  });
}

export function totalSizeStock(sizes: ProductVariant[]): number {
  return sizes.reduce((sum, s) => sum + Math.max(0, s.stock), 0);
}

export function findSize(sizes: ProductVariant[], label: string | null | undefined) {
  if (!label) return undefined;
  const target = label.trim().toLowerCase();
  return sizes.find((s) => s.label.toLowerCase() === target || s.id === label);
}

/** Group variants by their attribute name, e.g. { "Pad Size": [A3, A4, A5] } */
export function groupVariantsByAttribute(variants: ProductVariant[]): Record<string, ProductVariant[]> {
  const groups: Record<string, ProductVariant[]> = {};
  for (const v of variants) {
    const attr = v.attribute || "Size";
    if (!groups[attr]) groups[attr] = [];
    groups[attr].push(v);
  }
  return groups;
}

/** Short admin summary, e.g. "A3·101  A4·79  A5·50". */
export function sizeSummary(sizes: ProductVariant[]): string {
  return sizes.map((s) => `${s.label}·${s.stock}`).join("  ");
}
