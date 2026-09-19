import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { siteContentOptions } from "@/lib/queries";

export type BrandLogo = {
  /** Logo image URL (uploaded logo, or the bundled default). */
  url: string;
  /** Retained for backwards compatibility with saved site content. */
  scale: number;
  hasCustomLogo: boolean;
};

export const SITE_NAME = "Ibn Mobarak Art Gallery";
export const OLD_DEFAULT_LOGO_URL = "https://ayxnpifkrqohygyureqg.supabase.co/storage/v1/object/public/product-images/site/al-miftah-logo.png";
export const DEFAULT_LOGO_URL = "/logo.svg";


export function buildBrandLogo(map?: Record<string, string>): BrandLogo {
  const rawUrl = map?.brand_logo_url?.trim();
  const rawScale = Number(map?.brand_logo_scale);
  const scale =
    Number.isFinite(rawScale) && rawScale >= 0.5 && rawScale <= 2 ? rawScale : 1;
  const isOldLogo = !rawUrl || rawUrl === OLD_DEFAULT_LOGO_URL;
  const url = isOldLogo ? DEFAULT_LOGO_URL : rawUrl;
  return { url, scale, hasCustomLogo: true };
}

/**
 * Hydration-safe: SSR + first client render always use the bundled default,
 * then the uploaded logo is applied after mount.
 */
export function useBrandLogo(): BrandLogo {
  const { data } = useQuery(siteContentOptions());
  const [mounted, setMounted] = useState(false);
  const brand = buildBrandLogo(mounted ? data : undefined);
  const [url, setUrl] = useState(brand.url);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (mounted && brand.url) {
      setUrl(brand.url);
    }
  }, [brand.url, mounted]);

  return { url, scale: brand.scale, hasCustomLogo: Boolean(url) };
}
