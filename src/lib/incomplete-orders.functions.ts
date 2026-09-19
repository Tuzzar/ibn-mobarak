import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";
import { requireExternalSupabaseAuth } from "@/integrations/supabase/external-auth-middleware";

const convertSchema = z.object({
  incomplete_id: z.string().uuid(),
  customer_name: z.string().trim().min(2).max(100),
  customer_phone: z.string().trim().min(6).max(20),
  address: z.string().trim().min(3).max(500),
  city: z.string().trim().min(1).max(100),
  notes: z.string().trim().max(500).default(""),
  delivery_fee: z.number().min(0).max(1000),
  items: z
    .array(
      z.object({
        id: z.string().trim().min(1).max(200),
        quantity: z.number().int().min(1).max(1000),
      }),
    )
    .min(1)
    .max(100),
});

export const convertIncompleteToOrder = createServerFn({ method: "POST" })
  .middleware([requireExternalSupabaseAuth])
  .validator((input: unknown) => convertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { assertStaff } = await import("./courier-runner.server");
    await assertStaff(context);
    const { convertIncomplete } = await import("./order-convert.server");
    return convertIncomplete(data);
  });


const itemSchema = z.object({
  id: z.string().trim().max(200).optional().or(z.literal("")),
  name: z.string().trim().max(200).optional().or(z.literal("")),
  quantity: z.number().int().min(1).max(1000),
  price: z.number().min(0).max(10_000_000).optional(),
  unit: z.string().trim().max(60).nullable().optional(),
});

const saveSchema = z.object({
  session_key: z.string().trim().min(8).max(80),
  customer_name: z.string().trim().max(100).default(""),
  customer_phone: z.string().trim().max(20).default(""),
  address: z.string().trim().max(500).default(""),
  city: z.string().trim().max(100).default(""),
  notes: z.string().trim().max(500).default(""),
  items: z.array(itemSchema).max(100).default([]),
  subtotal: z.number().min(0).max(10_000_000).default(0),
  delivery_fee: z.number().min(0).max(10_000).default(0),
  total: z.number().min(0).max(10_000_000).default(0),
  source: z.enum(["checkout", "landing"]).default("checkout"),
  landing_slug: z.string().trim().max(120).nullable().default(null),
  product_id: z.string().uuid().nullable().default(null),
});

export const saveIncompleteOrder = createServerFn({ method: "POST" })
  .validator((input: unknown) => saveSchema.parse(input))
  .handler(async ({ data }) => {
    // Only worth storing if there is a usable contact hint.
    const digits = data.customer_phone.replace(/\D/g, "");
    if (digits.length < 6 && data.customer_name.length < 2) {
      return { saved: false as const };
    }

    const { externalSupabaseAdmin: supabaseAdmin } = await import(
      "@/integrations/supabase/external-admin.server"
    );

    const { data: existing } = await supabaseAdmin
      .from("incomplete_orders")
      .select("id")
      .eq("session_key", data.session_key)
      .maybeSingle();

    const { readTelegramSettings, flushPendingLeadAlerts, DEFAULT_LEAD_DELAY_MINUTES } =
      await import("./telegram.server");

    // Queue the lead alert instead of sending it right away — if the customer
    // finishes the order within the delay, the alert is cancelled.
    let notifyAfter: string | null = null;
    if (!existing) {
      let delay = DEFAULT_LEAD_DELAY_MINUTES;
      try {
        delay = (await readTelegramSettings()).lead_delay_minutes;
      } catch {
        // keep default
      }
      notifyAfter = new Date(Date.now() + Math.max(0, delay) * 60_000).toISOString();
    }

    const { error } = await supabaseAdmin
      .from("incomplete_orders")
      .upsert(
        {
          session_key: data.session_key,
          customer_name: data.customer_name,
          customer_phone: data.customer_phone,
          address: data.address,
          city: data.city,
          notes: data.notes || null,
          items: data.items as unknown as Json,
          subtotal: data.subtotal,
          delivery_fee: data.delivery_fee,
          total: data.total,
          source: data.source,
          landing_slug: data.landing_slug,
          product_id: data.product_id,
          ...(notifyAfter ? { notify_after: notifyAfter } : {}),
        },
        { onConflict: "session_key", ignoreDuplicates: false },
      );

    if (error) return { saved: false as const };

    // Opportunistic flush of any lead whose waiting period has expired.
    try {
      void flushPendingLeadAlerts().catch(() => {});
    } catch {
      // ignore
    }

    return { saved: true as const };
  });


export const markIncompleteConverted = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        session_key: z.string().trim().min(8).max(80),
        order_id: z.string().uuid().nullable().default(null),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const { externalSupabaseAdmin: supabaseAdmin } = await import(
      "@/integrations/supabase/external-admin.server"
    );
    await supabaseAdmin
      .from("incomplete_orders")
      .update({
        status: "converted",
        converted_order_id: data.order_id,
        notified_at: new Date().toISOString(),
      })
      .eq("session_key", data.session_key);

    return { ok: true as const };
  });
