// Server-only helpers for the courier fraud / delivery-history system.
// Credentials are stored in the external Supabase `app_settings` table and
// managed from the admin panel — never bundled into client code.

export type CourierBreakdown = {
  name: string;
  total: number;
  delivered: number;
  cancelled: number;
};

export type CourierSummary = {
  phone: string;
  total_parcel: number;
  delivered: number;
  cancelled: number;
  success_rate: number;
  couriers: CourierBreakdown[];
  last_checked_at: string;
  sources: { bdcourier: "ok" | "error" | "off"; steadfast: "ok" | "error" | "off" };
  stale: boolean;
};

export const COURIER_SETTING_KEYS = [
  "bdcourier_api_key",
  "steadfast_api_key",
  "steadfast_secret_key",
] as const;

export type CourierSettingKey = (typeof COURIER_SETTING_KEYS)[number];

export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** Normalize any BD phone input to an 11 digit 01XXXXXXXXX string. */
export function normalizePhone(raw: string): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  let n = digits;
  if (n.startsWith("880")) n = n.slice(3);
  if (n.startsWith("0")) n = n.slice(1);
  if (n.length === 10 && n.startsWith("1")) return `0${n}`;
  throw new Error("Invalid Bangladeshi phone number.");
}

async function fetchJson(url: string, init: RequestInit, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const text = await res.text();
    if (!res.ok) throw new Error(`[${res.status}] ${text.slice(0, 300)}`);
    return text ? JSON.parse(text) : {};
  } finally {
    clearTimeout(timer);
  }
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(Math.round(n), 0) : 0;
}

/** BDCourier aggregated multi-courier report. */
export async function fetchBdCourier(phone: string, apiKey: string) {
  const json = await fetchJson("https://bdcourier.com/api/courier-check", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ phone }),
  });

  const courier = (json?.courierData ?? json?.data ?? json) as Record<string, any>;
  const couriers: CourierBreakdown[] = [];
  for (const [name, value] of Object.entries(courier ?? {})) {
    if (name === "summary" || !value || typeof value !== "object") continue;
    couriers.push({
      name,
      total: num((value as any).total_parcel ?? (value as any).total),
      delivered: num((value as any).success_parcel ?? (value as any).delivered),
      cancelled: num((value as any).cancelled_parcel ?? (value as any).cancelled),
    });
  }
  const summary = (courier?.summary ?? {}) as Record<string, any>;
  const total = num(summary.total_parcel) || couriers.reduce((s, c) => s + c.total, 0);
  const delivered = num(summary.success_parcel) || couriers.reduce((s, c) => s + c.delivered, 0);
  const cancelled = num(summary.cancelled_parcel) || couriers.reduce((s, c) => s + c.cancelled, 0);

  return { total, delivered, cancelled, couriers, raw: json };
}

/** Steadfast merchant fraud / delivery record. */
export async function fetchSteadfast(phone: string, apiKey: string, secretKey: string) {
  const json = await fetchJson(
    `https://portal.packzy.com/api/v1/fraud_check/${encodeURIComponent(phone)}`,
    {
      method: "GET",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    },
  );

  const d = (json?.data ?? json) as Record<string, any>;
  const total = num(d.total_delivered ?? d.total_parcel) + num(d.total_cancelled);
  return {
    total: num(d.total_parcel) || total,
    delivered: num(d.total_delivered ?? d.delivered),
    cancelled: num(d.total_cancelled ?? d.cancelled),
    raw: json,
  };
}

export function computeRate(delivered: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((delivered / total) * 1000) / 10;
}

/** Create a delivery consignment in Steadfast. */
export async function createSteadfastConsignment(
  payload: {
    invoice: string;
    recipient_name: string;
    recipient_phone: string;
    recipient_address: string;
    cod_amount: number;
    note?: string;
  },
  apiKey: string,
  secretKey: string,
) {
  const json = await fetchJson(
    "https://portal.packzy.com/api/v1/create_order",
    {
      method: "POST",
      headers: {
        "Api-Key": apiKey,
        "Secret-Key": secretKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    },
    15000,
  );

  const c = (json?.consignment ?? json?.data ?? {}) as Record<string, any>;
  if (!c?.consignment_id) {
    const msg = json?.message ?? json?.errors ?? "Steadfast did not return a consignment.";
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg).slice(0, 300));
  }
  return {
    consignment_id: String(c.consignment_id),
    tracking_code: c.tracking_code ? String(c.tracking_code) : null,
    status: c.status ? String(c.status) : "in_review",
    raw: json,
  };
}
