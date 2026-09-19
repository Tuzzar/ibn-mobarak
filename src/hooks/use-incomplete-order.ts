import { useCallback, useEffect, useRef } from "react";
import {
  saveIncompleteOrder,
  markIncompleteConverted,
} from "@/lib/incomplete-orders.functions";

const LEAD_KEY = "am_lead_v1";

function getSessionKey() {
  if (typeof window === "undefined") return "";
  try {
    let key = sessionStorage.getItem(LEAD_KEY);
    if (!key) {
      key = crypto.randomUUID();
      sessionStorage.setItem(LEAD_KEY, key);
    }
    return key;
  } catch {
    return "";
  }
}

export type IncompleteOrderPayload = {
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  notes: string;
  items: Array<{
    id?: string;
    name?: string;
    quantity: number;
    price?: number;
    unit?: string | null;
  }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  source: "checkout" | "landing";
  landing_slug?: string | null;
  product_id?: string | null;
};

/**
 * Saves partially filled order forms (abandoned carts / incomplete orders)
 * so staff can follow up by phone. Debounced, best-effort, never blocks the UI.
 */
export function useIncompleteOrderTracker(payload: IncompleteOrderPayload) {
  const latest = useRef(payload);
  latest.current = payload;

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSent = useRef<string>("");
  const converted = useRef(false);

  const flush = useCallback(() => {
    if (converted.current) return;
    const p = latest.current;
    const digits = p.customer_phone.replace(/\D/g, "");
    if (digits.length < 6 && p.customer_name.trim().length < 2) return;

    const sessionKey = getSessionKey();
    if (!sessionKey) return;

    const snapshot = JSON.stringify(p);
    if (snapshot === lastSent.current) return;
    lastSent.current = snapshot;

    void saveIncompleteOrder({
      data: {
        session_key: sessionKey,
        customer_name: p.customer_name.trim().slice(0, 100),
        customer_phone: p.customer_phone.trim().slice(0, 20),
        address: p.address.trim().slice(0, 500),
        city: p.city.trim().slice(0, 100),
        notes: p.notes.trim().slice(0, 500),
        items: p.items.slice(0, 100),
        subtotal: Math.max(0, Math.round(p.subtotal)),
        delivery_fee: Math.max(0, Math.round(p.delivery_fee)),
        total: Math.max(0, Math.round(p.total)),
        source: p.source,
        landing_slug: p.landing_slug ?? null,
        product_id: p.product_id ?? null,
      },
    }).catch(() => {});
  }, []);

  // Debounced save on any form change.
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 2000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [flush, payload]);

  // Final save when the visitor leaves the page.
  useEffect(() => {
    const onLeave = () => flush();
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", onLeave);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [flush]);

  const markConverted = useCallback((orderId: string | null) => {
    converted.current = true;
    if (timer.current) clearTimeout(timer.current);
    const sessionKey = getSessionKey();
    if (!sessionKey) return;
    void markIncompleteConverted({
      data: { session_key: sessionKey, order_id: orderId },
    })
      .catch(() => {})
      .finally(() => {
        try {
          sessionStorage.removeItem(LEAD_KEY);
        } catch {}
      });
  }, []);

  return { markConverted };
}
