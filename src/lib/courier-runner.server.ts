// Server-only runtime for courier checks: settings storage + cache + merge.
import {
  CACHE_TTL_MS,
  computeRate,
  createSteadfastConsignment,
  fetchBdCourier,
  fetchSteadfast,
  normalizePhone,
  type CourierBreakdown,
  type CourierSummary,
} from "./courier.server";

async function admin() {
  const { externalSupabaseAdmin } = await import(
    "@/integrations/supabase/external-admin.server"
  );
  return externalSupabaseAdmin as any;
}

export async function readCourierSettings(): Promise<Record<string, string>> {
  const db = await admin();
  const { data } = await db
    .from("app_settings")
    .select("key, value")
    .in("key", ["bdcourier_api_key", "steadfast_api_key", "steadfast_secret_key"]);
  const out: Record<string, string> = {};
  for (const row of data ?? []) if (row?.value) out[row.key] = String(row.value);
  return out;
}

function mask(v?: string) {
  if (!v) return "";
  if (v.length <= 6) return "••••";
  return `${v.slice(0, 3)}••••••${v.slice(-3)}`;
}

export async function readCourierSettingsMasked() {
  const s = await readCourierSettings();
  return {
    bdcourier_api_key: mask(s.bdcourier_api_key),
    steadfast_api_key: mask(s.steadfast_api_key),
    steadfast_secret_key: mask(s.steadfast_secret_key),
    configured: {
      bdcourier: Boolean(s.bdcourier_api_key),
      steadfast: Boolean(s.steadfast_api_key && s.steadfast_secret_key),
    },
  };
}

export async function writeCourierSettings(input: Record<string, string | undefined>) {
  const db = await admin();
  const rows = Object.entries(input)
    .filter(([, value]) => typeof value === "string" && value.trim().length > 0)
    .map(([key, value]) => ({ key, value: String(value).trim() }));
  if (rows.length === 0) return { saved: 0 };
  const { error } = await db.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return { saved: rows.length };
}

export async function runCourierCheck(rawPhone: string, force: boolean): Promise<CourierSummary> {
  const phone = normalizePhone(rawPhone);
  const db = await admin();

  const { data: cached } = await db
    .from("courier_checks")
    .select("*")
    .eq("phone", phone)
    .maybeSingle();

  const fresh =
    cached?.last_checked_at &&
    Date.now() - new Date(cached.last_checked_at).getTime() < CACHE_TTL_MS;

  if (cached && fresh && !force) return toSummary(phone, cached, false);

  const settings = await readCourierSettings();
  const hasBd = Boolean(settings.bdcourier_api_key);
  const hasSf = Boolean(settings.steadfast_api_key && settings.steadfast_secret_key);

  const [bdRes, sfRes] = await Promise.allSettled([
    hasBd ? fetchBdCourier(phone, settings.bdcourier_api_key) : Promise.reject(new Error("off")),
    hasSf
      ? fetchSteadfast(phone, settings.steadfast_api_key, settings.steadfast_secret_key)
      : Promise.reject(new Error("off")),
  ]);

  const bd = bdRes.status === "fulfilled" ? bdRes.value : null;
  const sf = sfRes.status === "fulfilled" ? sfRes.value : null;

  if (!bd && !sf) {
    if (cached) return toSummary(phone, cached, true);
    const reason =
      !hasBd && !hasSf
        ? "No courier API credentials configured."
        : "Courier services are not responding right now.";
    throw new Error(reason);
  }

  const couriers: CourierBreakdown[] = bd?.couriers ? [...bd.couriers] : [];
  if (sf && !couriers.some((c) => c.name.toLowerCase().includes("steadfast"))) {
    couriers.push({
      name: "steadfast",
      total: sf.total,
      delivered: sf.delivered,
      cancelled: sf.cancelled,
    });
  }

  const total = bd ? bd.total : sf!.total;
  const delivered = bd ? bd.delivered : sf!.delivered;
  const cancelled = bd ? bd.cancelled : sf!.cancelled;

  const row = {
    phone,
    total_parcel: total,
    delivered,
    cancelled,
    success_rate: computeRate(delivered, total),
    bdcourier_data: bd ? { couriers: bd.couriers, raw: bd.raw } : {},
    steadfast_data: sf
      ? { total: sf.total, delivered: sf.delivered, cancelled: sf.cancelled, raw: sf.raw }
      : {},
    last_checked_at: new Date().toISOString(),
  };

  await db.from("courier_checks").upsert(row, { onConflict: "phone" });

  return {
    ...row,
    couriers,
    sources: {
      bdcourier: hasBd ? (bd ? "ok" : "error") : "off",
      steadfast: hasSf ? (sf ? "ok" : "error") : "off",
    },
    stale: false,
  };
}

function toSummary(phone: string, row: any, stale: boolean): CourierSummary {
  const couriers: CourierBreakdown[] = Array.isArray(row?.bdcourier_data?.couriers)
    ? [...row.bdcourier_data.couriers]
    : [];
  // Steadfast can arrive from BDCourier's breakdown AND from the direct
  // Steadfast API — only add the direct one when BDCourier didn't include it.
  const sf = row?.steadfast_data;
  if (
    sf &&
    typeof sf.total === "number" &&
    !couriers.some((c) => c.name?.toLowerCase().includes("steadfast"))
  ) {
    couriers.push({
      name: "steadfast",
      total: sf.total,
      delivered: sf.delivered ?? 0,
      cancelled: sf.cancelled ?? 0,
    });
  }
  return {
    phone,
    total_parcel: row.total_parcel ?? 0,
    delivered: row.delivered ?? 0,
    cancelled: row.cancelled ?? 0,
    success_rate: Number(row.success_rate ?? 0),
    couriers,
    last_checked_at: row.last_checked_at,
    sources: { bdcourier: "ok", steadfast: "ok" },
    stale,
  };
}

export async function assertStaff(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("is_staff", { _user_id: context.userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Staff privileges required");
}

/** Push an order to Steadfast, mark it shipped and log the change. */
export async function sendOrderToSteadfast(
  orderId: string,
  actor: { userId: string; email: string | null },
) {
  const db = await admin();

  const { data: order, error } = await db
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order) throw new Error("Order not found.");
  if (order.status === "cancelled") throw new Error("Cancelled order cannot be shipped.");
  if (order.courier_consignment_id) {
    return {
      already: true as const,
      consignment_id: String(order.courier_consignment_id),
      tracking_code: order.courier_tracking_code ?? null,
      courier_status: order.courier_status ?? null,
    };
  }

  const settings = await readCourierSettings();
  if (!settings.steadfast_api_key || !settings.steadfast_secret_key) {
    throw new Error("Steadfast API credentials are not configured (Admin → Site Content).");
  }

  const phone = normalizePhone(order.customer_phone);
  const address = [order.address, order.city].filter(Boolean).join(", ").trim();
  if (address.length < 5) throw new Error("Delivery address is too short for Steadfast.");

  const items = Array.isArray(order.items) ? order.items : [];
  const noteParts = [
    items
      .map((i: any) => `${i?.name ?? "item"}${i?.size ? ` (${i.size})` : ""} x${i?.quantity ?? 1}`)
      .join(", "),
    order.notes ? `Note: ${order.notes}` : "",
  ].filter(Boolean);

  const invoice = `ALM-${order.order_no ?? String(order.id).slice(0, 8).toUpperCase()}`;

  const consignment = await createSteadfastConsignment(
    {
      invoice,
      recipient_name: String(order.customer_name).slice(0, 100),
      recipient_phone: phone,
      recipient_address: address.slice(0, 250),
      cod_amount: Math.round(Number(order.total) || 0),
      note: noteParts.join(" | ").slice(0, 250),
    },
    settings.steadfast_api_key,
    settings.steadfast_secret_key,
  );

  const { error: upErr } = await db
    .from("orders")
    .update({
      courier_consignment_id: consignment.consignment_id,
      courier_tracking_code: consignment.tracking_code,
      courier_status: consignment.status,
      courier_sent_at: new Date().toISOString(),
      status: "shipped",
    })
    .eq("id", orderId);
  if (upErr) throw new Error(upErr.message);

  await db.from("order_history").insert([
    {
      order_id: orderId,
      field_name: "status",
      old_value: order.status,
      new_value: "shipped",
      changed_by: actor.userId,
      changed_by_email: actor.email,
    },
    {
      order_id: orderId,
      field_name: "courier",
      old_value: null,
      new_value: `Steadfast ${consignment.consignment_id}${
        consignment.tracking_code ? ` / ${consignment.tracking_code}` : ""
      }`,
      changed_by: actor.userId,
      changed_by_email: actor.email,
    },
  ]);

  return {
    already: false as const,
    consignment_id: consignment.consignment_id,
    tracking_code: consignment.tracking_code,
    courier_status: consignment.status,
  };
}
