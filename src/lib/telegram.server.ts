// Server-only Telegram notification helpers.
// Settings live in the `app_settings` table (staff-only read via RLS; this
// module always uses the service-role admin client).

const KEYS = {
  token: "telegram_bot_token",
  chat: "telegram_chat_id",
  orders: "telegram_notify_orders",
  leads: "telegram_notify_leads",
  leadDelay: "telegram_lead_delay_minutes",
} as const;

export const DEFAULT_LEAD_DELAY_MINUTES = 2;


async function admin() {
  const { externalSupabaseAdmin } = await import(
    "@/integrations/supabase/external-admin.server"
  );
  return externalSupabaseAdmin;
}

export type TelegramSettings = {
  bot_token: string;
  chat_id: string;
  notify_orders: boolean;
  notify_leads: boolean;
  lead_delay_minutes: number;
};

export async function readTelegramSettings(): Promise<TelegramSettings> {
  const db = await admin();
  const { data } = await db
    .from("app_settings")
    .select("key, value")
    .in("key", Object.values(KEYS));
  const map = new Map((data ?? []).map((r: { key: string; value: string | null }) => [r.key, r.value ?? ""]));
  const rawDelay = Number(map.get(KEYS.leadDelay));
  return {
    bot_token: (map.get(KEYS.token) ?? "").trim(),
    chat_id: (map.get(KEYS.chat) ?? "").trim(),
    notify_orders: (map.get(KEYS.orders) ?? "1") !== "0",
    notify_leads: (map.get(KEYS.leads) ?? "1") !== "0",
    lead_delay_minutes: Number.isFinite(rawDelay) && rawDelay >= 0 ? Math.min(rawDelay, 1440) : DEFAULT_LEAD_DELAY_MINUTES,
  };
}

function mask(value: string) {
  if (!value) return "";
  if (value.length <= 8) return "••••";
  return `${value.slice(0, 4)}••••${value.slice(-4)}`;
}

export async function readTelegramSettingsMasked() {
  const s = await readTelegramSettings();
  return {
    bot_token: mask(s.bot_token),
    chat_id: s.chat_id,
    notify_orders: s.notify_orders,
    notify_leads: s.notify_leads,
    lead_delay_minutes: s.lead_delay_minutes,
    configured: Boolean(s.bot_token && s.chat_id),
  };
}

export async function writeTelegramSettings(input: {
  bot_token?: string;
  chat_id?: string;
  notify_orders?: boolean;
  notify_leads?: boolean;
  lead_delay_minutes?: number;
}) {
  const db = await admin();
  const rows: Array<{ key: string; value: string }> = [];
  if (input.bot_token && input.bot_token.trim()) rows.push({ key: KEYS.token, value: input.bot_token.trim() });
  if (typeof input.chat_id === "string") rows.push({ key: KEYS.chat, value: input.chat_id.trim() });
  if (typeof input.notify_orders === "boolean")
    rows.push({ key: KEYS.orders, value: input.notify_orders ? "1" : "0" });
  if (typeof input.notify_leads === "boolean")
    rows.push({ key: KEYS.leads, value: input.notify_leads ? "1" : "0" });
  if (typeof input.lead_delay_minutes === "number" && Number.isFinite(input.lead_delay_minutes))
    rows.push({
      key: KEYS.leadDelay,
      value: String(Math.max(0, Math.min(1440, Math.round(input.lead_delay_minutes)))),
    });
  if (rows.length === 0) return { saved: 0 };
  const { error } = await db.from("app_settings").upsert(rows, { onConflict: "key" });
  if (error) throw new Error(error.message);
  return { saved: rows.length };
}


export function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Sends a message. Never throws — returns ok/error so callers can ignore it. */
export async function sendTelegram(text: string): Promise<{ ok: boolean; error?: string }> {
  const s = await readTelegramSettings();
  if (!s.bot_token || !s.chat_id) return { ok: false, error: "Telegram is not configured." };
  try {
    const res = await fetch(`https://api.telegram.org/bot${s.bot_token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: s.chat_id,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
    if (!res.ok || body.ok === false) {
      const error = body.description || `Telegram error ${res.status}`;
      console.error("Telegram sendMessage failed:", error);
      return { ok: false, error };
    }
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : "Network error";
    console.error("Telegram sendMessage failed:", error);
    return { ok: false, error };
  }
}

const bdt = (n: number) => `৳${Math.round(Number(n) || 0).toLocaleString("en-US")}`;

type LineItem = { name?: string | null; quantity?: number | null; price?: number | null };

function itemLines(items: LineItem[]) {
  if (!items.length) return "—";
  return items
    .map((i) => {
      const qty = Number(i.quantity) || 1;
      const name = escapeHtml(String(i.name ?? "Product"));
      const amount = i.price != null ? ` — ${bdt(Number(i.price) * qty)}` : "";
      return `• ${qty} × ${name}${amount}`;
    })
    .join("\n");
}

export type OrderNotice = {
  kind: "order" | "lead";
  reference: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  notes?: string | null;
  items: LineItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  source?: string | null;
};

export function formatOrderMessage(o: OrderNotice) {
  const header =
    o.kind === "order"
      ? `🟢 <b>নতুন অর্ডার</b> ${escapeHtml(o.reference)}`
      : `🟠 <b>ইনকমপ্লিট অর্ডার (lead)</b> ${escapeHtml(o.reference)}`;
  const dash = (v: string) => (v && v.trim() ? escapeHtml(v.trim()) : "—");
  const place = [o.address, o.city].filter((v) => v && v.trim()).join(", ");

  const lines = [
    header,
    "",
    `👤 ${dash(o.customer_name)}`,
    `📞 ${dash(o.customer_phone)}`,
    `📍 ${dash(place)}`,
    "",
    itemLines(o.items),
    "",
    `ডেলিভারি: ${bdt(o.delivery_fee)}`,
    `<b>মোট: ${bdt(o.total)}</b>`,
  ];
  if (o.notes && o.notes.trim()) lines.push("", `📝 ${escapeHtml(o.notes.trim())}`);
  if (o.source) lines.push("", `<i>source: ${escapeHtml(o.source)}</i>`);
  return lines.join("\n");
}

/** Fire-and-forget notification; safe to call from any order path. */
export async function notifyOrderEvent(notice: OrderNotice) {
  const s = await readTelegramSettings();
  if (notice.kind === "order" && !s.notify_orders) return;
  if (notice.kind === "lead" && !s.notify_leads) return;
  await sendTelegram(formatOrderMessage(notice));
}

/**
 * Cancels queued lead alerts (marks them as already handled) so a customer who
 * completes the order never triggers a duplicate "incomplete order" message.
 */
export async function cancelPendingLeadAlerts(opts: {
  session_key?: string | null;
  phone?: string | null;
  incomplete_id?: string | null;
}) {
  try {
    const db = await admin();
    const now = new Date().toISOString();
    if (opts.incomplete_id) {
      await db
        .from("incomplete_orders")
        .update({ notified_at: now })
        .eq("id", opts.incomplete_id)
        .is("notified_at", null);
    }
    if (opts.session_key) {
      await db
        .from("incomplete_orders")
        .update({ notified_at: now })
        .eq("session_key", opts.session_key)
        .is("notified_at", null);
    }
    const digits = (opts.phone ?? "").replace(/\D/g, "").slice(-10);
    if (digits.length >= 10) {
      const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
      await db
        .from("incomplete_orders")
        .update({ notified_at: now })
        .is("notified_at", null)
        .gte("created_at", since)
        .like("customer_phone", `%${digits}`);
    }
  } catch (e) {
    console.error("cancelPendingLeadAlerts failed:", e);
  }
}

type IncompleteRow = {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  items: unknown;
  subtotal: number | null;
  delivery_fee: number | null;
  total: number | null;
  source: string | null;
  landing_slug: string | null;
};

/**
 * Sends every lead alert whose waiting period has passed and that was not
 * converted into a real order. Idempotent: each row is stamped once.
 */
export async function flushPendingLeadAlerts(): Promise<{ sent: number }> {
  const db = await admin();
  const nowIso = new Date().toISOString();

  const { data: rows } = await db
    .from("incomplete_orders")
    .select(
      "id, customer_name, customer_phone, address, city, notes, items, subtotal, delivery_fee, total, source, landing_slug",
    )
    .is("notified_at", null)
    .eq("status", "new")
    .not("notify_after", "is", null)
    .lte("notify_after", nowIso)
    .order("notify_after", { ascending: true })
    .limit(20);

  const pending = (rows ?? []) as IncompleteRow[];
  if (!pending.length) return { sent: 0 };

  const settings = await readTelegramSettings();
  let sent = 0;

  for (const row of pending) {
    // Claim the row first so a concurrent run cannot send it twice.
    const { data: claimed } = await db
      .from("incomplete_orders")
      .update({ notified_at: new Date().toISOString() })
      .eq("id", row.id)
      .is("notified_at", null)
      .select("id");
    if (!claimed || claimed.length === 0) continue;
    if (!settings.notify_leads || !settings.bot_token || !settings.chat_id) continue;

    const items = Array.isArray(row.items) ? (row.items as LineItem[]) : [];
    const ok = await sendTelegram(
      formatOrderMessage({
        kind: "lead",
        reference: "",
        customer_name: row.customer_name ?? "",
        customer_phone: row.customer_phone ?? "",
        address: row.address ?? "",
        city: row.city ?? "",
        notes: row.notes,
        items,
        subtotal: Number(row.subtotal) || 0,
        delivery_fee: Number(row.delivery_fee) || 0,
        total: Number(row.total) || 0,
        source: row.landing_slug ? `landing/${row.landing_slug}` : row.source,
      }),
    );
    if (ok.ok) sent += 1;
  }

  return { sent };
}
