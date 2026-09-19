import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouterState } from "@tanstack/react-router";
import { siteContentOptions } from "@/lib/queries";

declare global {
  interface Window {
    fbq?: ((...args: any[]) => void) & { callMethod?: any; queue?: any[]; loaded?: boolean; version?: string; push?: any };
    _fbq?: any;
  }
}

function isValidPixelId(id: string) {
  return /^\d{6,20}$/.test(id);
}

export function MetaPixel() {
  const { data } = useQuery(siteContentOptions());
  const pixelId = (data?.meta_pixel_id ?? "").trim();
  const initializedFor = useRef<string | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Inject base script + init once per pixel id
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pixelId || !isValidPixelId(pixelId)) return;
    if (initializedFor.current === pixelId) return;

    // Standard Meta Pixel base code
    if (!window.fbq) {
      const n: any = (window.fbq = function () {
        // eslint-disable-next-line prefer-rest-params
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
      });
      if (!window._fbq) window._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = "2.0";
      n.queue = [];
      const t = document.createElement("script");
      t.async = true;
      t.src = "https://connect.facebook.net/en_US/fbevents.js";
      const s = document.getElementsByTagName("script")[0];
      s.parentNode?.insertBefore(t, s);
    }

    window.fbq!("init", pixelId);
    window.fbq!("track", "PageView");
    initializedFor.current = pixelId;
  }, [pixelId]);

  // Track route changes (skip first — already tracked at init)
  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (!pixelId || !isValidPixelId(pixelId)) return;
    window.fbq?.("track", "PageView");
  }, [pathname, pixelId]);

  if (!pixelId || !isValidPixelId(pixelId)) return null;

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        alt=""
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
      />
    </noscript>
  );
}
