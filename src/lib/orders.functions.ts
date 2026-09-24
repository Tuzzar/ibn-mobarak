import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Database, Json } from "@/integrations/supabase/types";

const uuidSchema = z.string().uuid();

const placeOrderSchema = z.object({
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().min(10).max(20),
  customer_email: z.string().trim().email().optional().or(z.literal("")),
  address: z.string().trim().min(5).max(500),
  city: z.string().trim().min(2).max(100),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(
    z.object({
      id: z.string().trim().min(1).max(200),
      quantity: z.number().int().min(1).max(1000),
    }),
  ).min(1).max(100),
  delivery_fee: z.number().min(0).max(1000),
});

type ProductRow = Pick<
  Database["public"]["Tables"]["products"]["Row"],
  "id" | "name" | "price" | "discount_amount" | "unit" | "weight_variants"
>;

function parseItemId(rawId: string) {
  const separator = rawId.indexOf("::");
  const productId = separator >= 0 ? rawId.slice(0, separator) : rawId;
  const variantLabel = separator >= 0 ? rawId.slice(separator + 2).trim() : null;
  return { productId: uuidSchema.parse(productId), variantLabel };
}

function getVariantRow(product: ProductRow, variantLabel: string) {
  const variants = Array.isArray(product.weight_variants) ? product.weight_variants : [];
  const variant = variants.find((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return false;
    return "label" in entry && String(entry.label).trim().toLowerCase() === variantLabel.trim().toLowerCase();
  }) as Record<string, unknown> | undefined;
  if (!variant) throw new Error(`Selected option (${variantLabel}) is not available.`);
  const stock = Math.floor(Number(variant.stock) || 0);
  if (stock <= 0) throw new Error(`Option ${variantLabel} is out of stock.`);
  const price = Number(variant.price) > 0 ? Number(variant.price) : null;
  const attribute = typeof variant.attribute === "string" ? variant.attribute : "Option";
  return { stock, price, attribute };
}

export const placeOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => placeOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const parsedItems = data.items.map((item) => ({ ...parseItemId(item.id), quantity: item.quantity }));
    const productIds = Array.from(new Set(parsedItems.map((item) => item.productId)));

    const { data: products, error: productError } = await admin
      .from("products")
      .select("id, name, price, discount_amount, unit, weight_variants")
      .in("id", productIds);

    if (productError) throw new Error("Could not validate order items.");

    const byId = new Map((products ?? []).map((product) => [product.id, product as ProductRow]));
    let subtotal = 0;
    const cleanItems = parsedItems.map((item) => {
      const product = byId.get(item.productId);
      if (!product) throw new Error("Selected product is not available.");

      let unitPrice: number;
      let attributeName = "Option";

      if (item.variantLabel) {
        const variantData = getVariantRow(product, item.variantLabel);
        if (item.quantity > variantData.stock) {
          throw new Error(`Only ${variantData.stock} pcs left for ${item.variantLabel}.`);
        }
        attributeName = variantData.attribute;
        unitPrice = variantData.price ?? Math.max(Number(product.price) - Number(product.discount_amount || 0), 0);
      } else {
        unitPrice = Math.max(Number(product.price) - Number(product.discount_amount || 0), 0);
      }

      if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new Error("Selected product price is invalid.");

      subtotal += unitPrice * item.quantity;
      return {
        id: product.id,
        name: item.variantLabel ? `${product.name} (${attributeName}: ${item.variantLabel})` : product.name,
        price: unitPrice,
        quantity: item.quantity,
        size: item.variantLabel || null,
        unit: item.variantLabel || product.unit,
      };
    });

    const total = subtotal + data.delivery_fee;
    const { data: order, error: insertError } = await admin
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || "",
        address: data.address,
        city: data.city,
        notes: data.notes || null,
        items: cleanItems as unknown as Json,
        subtotal,
        delivery_fee: data.delivery_fee,
        total,
        status: "pending",
      })
      .select("id, order_no")
      .single();

    if (insertError || !order?.id) throw new Error("Could not save order.");

    // Fire-and-forget courier history warm-up; never blocks order placement.
    try {
      const { runCourierCheck } = await import("./courier-runner.server");
      void runCourierCheck(data.customer_phone, false).catch(() => {});
    } catch {
      // ignore
    }

    // Fire-and-forget Telegram alert; never blocks order placement.
    try {
      const { notifyOrderEvent, cancelPendingLeadAlerts } = await import("./telegram.server");
      // Kill any queued "incomplete order" alert for this customer first.
      await cancelPendingLeadAlerts({ phone: data.customer_phone });
      void notifyOrderEvent({
        kind: "order",
        reference: order.order_no ? `#${order.order_no}` : `#${order.id.slice(0, 8)}`,
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        address: data.address,
        city: data.city,
        notes: data.notes || null,
        items: cleanItems,
        subtotal,
        delivery_fee: data.delivery_fee,
        total,
        source: "web",
      }).catch(() => {});
    } catch {
      // ignore
    }


    return { orderId: order.id, total };
  });

const updateAdminOrderSchema = z.object({
  orderId: z.string().min(1),
  form: z.object({
    customer_name: z.string().trim().min(1),
    customer_phone: z.string().trim().min(1),
    address: z.string().trim().min(1),
    notes: z.string().trim().optional().or(z.literal("")),
    status: z.string().trim().min(1),
  }),
  changes: z.array(
    z.object({
      field: z.string(),
      oldVal: z.string().nullable().optional(),
      newVal: z.string().nullable().optional(),
    }),
  ),
  user: z.object({
    id: z.string(),
    email: z.string().nullable().optional(),
  }),
});

export const updateAdminOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateAdminOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    // 1. Update orders table
    const { error: upErr } = await admin
      .from("orders")
      .update({
        customer_name: data.form.customer_name,
        customer_phone: data.form.customer_phone,
        address: data.form.address,
        notes: data.form.notes || null,
        status: data.form.status,
      })
      .eq("id", data.orderId);

    if (upErr) throw new Error(upErr.message);

    // 2. Insert order history via service_role to avoid client RLS policy failures
    if (data.changes.length > 0) {
      const rows = data.changes.map((c) => ({
        order_id: data.orderId,
        field_name: c.field,
        old_value: c.oldVal ?? null,
        new_value: c.newVal ?? null,
        changed_by: data.user.id,
        changed_by_email: data.user.email ?? null,
      }));
      const { error: histErr } = await admin.from("order_history").insert(rows);
      if (histErr) {
        console.warn("Could not insert order_history:", histErr);
      }
    }

    return { success: true };
  });

const trashActionSchema = z.object({
  orderId: z.string().min(1),
  user: z.object({
    id: z.string(),
    email: z.string().nullable().optional(),
  }),
});

export const moveAdminOrderToTrash = createServerFn({ method: "POST" })
  .validator((input: unknown) => trashActionSchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const { data: curr } = await admin
      .from("orders")
      .select("status")
      .eq("id", data.orderId)
      .single();

    const oldStatus = curr?.status || "pending";

    const { error: upErr } = await admin
      .from("orders")
      .update({ status: "trash" })
      .eq("id", data.orderId);

    if (upErr) throw new Error(upErr.message);

    await admin.from("order_history").insert({
      order_id: data.orderId,
      field_name: "status",
      old_value: oldStatus,
      new_value: "trash",
      changed_by: data.user.id,
      changed_by_email: data.user.email ?? null,
    });

    return { success: true };
  });

export const restoreAdminOrderFromTrash = createServerFn({ method: "POST" })
  .validator((input: unknown) => trashActionSchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const { data: history } = await admin
      .from("order_history")
      .select("old_value")
      .eq("order_id", data.orderId)
      .eq("field_name", "status")
      .order("created_at", { ascending: false })
      .limit(1);

    const prevStatus =
      history?.[0]?.old_value && history[0].old_value !== "trash"
        ? history[0].old_value
        : "pending";

    const { error: upErr } = await admin
      .from("orders")
      .update({ status: prevStatus })
      .eq("id", data.orderId);

    if (upErr) throw new Error(upErr.message);

    await admin.from("order_history").insert({
      order_id: data.orderId,
      field_name: "status",
      old_value: "trash",
      new_value: prevStatus,
      changed_by: data.user.id,
      changed_by_email: data.user.email ?? null,
    });

    return { success: true, restoredStatus: prevStatus };
  });

const deletePermanentlySchema = z.object({
  orderId: z.string().min(1),
});

export const deleteAdminOrderPermanently = createServerFn({ method: "POST" })
  .validator((input: unknown) => deletePermanentlySchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const { error: delErr } = await admin
      .from("orders")
      .delete()
      .eq("id", data.orderId);

    if (delErr) throw new Error(delErr.message);

    return { success: true };
  });

const updateAdminOrderItemsSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(
    z.object({
      name: z.string().min(1),
      quantity: z.number().int().positive(),
      price: z.number().nonnegative(),
      unit: z.string().optional(),
      size: z.string().nullable().optional(),
    }),
  ),
  subtotal: z.number().nonnegative(),
  delivery_fee: z.number().nonnegative(),
  total: z.number().nonnegative(),
  user: z.object({
    id: z.string(),
    email: z.string().nullable().optional(),
  }),
});

export const updateAdminOrderItems = createServerFn({ method: "POST" })
  .validator((input: unknown) => updateAdminOrderItemsSchema.parse(input))
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: admin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const { data: curr } = await admin
      .from("orders")
      .select("items, subtotal, delivery_fee, total")
      .eq("id", data.orderId)
      .single();

    const { error: upErr } = await admin
      .from("orders")
      .update({
        items: data.items as unknown as Json,
        subtotal: data.subtotal,
        delivery_fee: data.delivery_fee,
        total: data.total,
      })
      .eq("id", data.orderId);

    if (upErr) throw new Error(upErr.message);

    const historyRows = [];
    if (curr) {
      if (Number(curr.subtotal) !== Number(data.subtotal)) {
        historyRows.push({
          order_id: data.orderId,
          field_name: "subtotal",
          old_value: String(curr.subtotal),
          new_value: String(data.subtotal),
          changed_by: data.user.id,
          changed_by_email: data.user.email ?? null,
        });
      }
      if (Number(curr.delivery_fee) !== Number(data.delivery_fee)) {
        historyRows.push({
          order_id: data.orderId,
          field_name: "delivery_fee",
          old_value: String(curr.delivery_fee),
          new_value: String(data.delivery_fee),
          changed_by: data.user.id,
          changed_by_email: data.user.email ?? null,
        });
      }
      if (Number(curr.total) !== Number(data.total)) {
        historyRows.push({
          order_id: data.orderId,
          field_name: "total",
          old_value: String(curr.total),
          new_value: String(data.total),
          changed_by: data.user.id,
          changed_by_email: data.user.email ?? null,
        });
      }
    }
    historyRows.push({
      order_id: data.orderId,
      field_name: "items",
      old_value: `${Array.isArray(curr?.items) ? curr.items.length : 0} items`,
      new_value: `${data.items.length} items (${data.items.map((it) => `${it.name} x${it.quantity}`).join(", ")})`,
      changed_by: data.user.id,
      changed_by_email: data.user.email ?? null,
    });

    await admin.from("order_history").insert(historyRows);

    return { success: true };
  });