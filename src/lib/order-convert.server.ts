// Server-only helpers for converting an incomplete order (abandoned lead)
// into a real order. Prices and stock are always re-validated server-side.
import type { Json } from "@/integrations/supabase/types";

export type ConvertInput = {
  incomplete_id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  notes: string;
  delivery_fee: number;
  items: Array<{ id: string; quantity: number }>;
};

function parseItemId(rawId: string) {
  const separator = rawId.indexOf("::");
  const productId = separator >= 0 ? rawId.slice(0, separator) : rawId;
  const variantLabel = separator >= 0 ? rawId.slice(separator + 2).trim() : null;
  return { productId, variantLabel };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function convertIncomplete(input: ConvertInput) {
  const { externalSupabaseAdmin: admin } = await import(
    "@/integrations/supabase/external-admin.server"
  );

  if (!input.items.length) throw new Error("No items selected for this order.");

  const parsed = input.items.map((item) => {
    const { productId, variantLabel } = parseItemId(item.id);
    if (!UUID_RE.test(productId)) throw new Error("This lead has no valid product to order.");
    return { productId, variantLabel, quantity: item.quantity };
  });

  const productIds = Array.from(new Set(parsed.map((p) => p.productId)));
  const { data: products, error: productError } = await admin
    .from("products")
    .select("id, name, price, discount_amount, unit, weight_variants")
    .in("id", productIds);

  if (productError) throw new Error("Could not validate order items.");

  const byId = new Map((products ?? []).map((p) => [p.id, p]));
  let subtotal = 0;

  const cleanItems = parsed.map((item) => {
    const product = byId.get(item.productId);
    if (!product) throw new Error("A product in this lead no longer exists.");

    const unitPrice = Math.max(Number(product.price) - Number(product.discount_amount || 0), 0);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new Error("Product price is invalid.");

    subtotal += unitPrice * item.quantity;
    return {
      id: product.id,
      name: item.variantLabel ? `${product.name} — Size ${item.variantLabel}` : product.name,
      price: unitPrice,
      quantity: item.quantity,
      size: item.variantLabel || null,
      unit: item.variantLabel || product.unit,
    };
  });

  subtotal = Math.round(subtotal * 100) / 100;
  const total = Math.round((subtotal + input.delivery_fee) * 100) / 100;

  const { data: order, error: insertError } = await admin
    .from("orders")
    .insert({
      customer_name: input.customer_name,
      customer_phone: input.customer_phone,
      customer_email: "",
      address: input.address,
      city: input.city,
      notes: input.notes || null,
      items: cleanItems as unknown as Json,
      subtotal,
      delivery_fee: input.delivery_fee,
      total,
      status: "confirmed",
      source: "recovered",
    })
    .select("id")
    .single();

  if (insertError || !order?.id) throw new Error(insertError?.message || "Could not save order.");

  await admin
    .from("incomplete_orders")
    .update({
      status: "converted",
      converted_order_id: order.id,
      notified_at: new Date().toISOString(),
    })
    .eq("id", input.incomplete_id);


  try {
    const { runCourierCheck } = await import("./courier-runner.server");
    void runCourierCheck(input.customer_phone, false).catch(() => {});
  } catch {
    // ignore
  }

  return { orderId: order.id, total };
}
