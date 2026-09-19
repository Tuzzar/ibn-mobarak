import { memo, useState, useMemo, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt: string;
  /** Set true for above-the-fold (LCP) images. Defaults to lazy. */
  priority?: boolean;
};

/**
 * If src is a Supabase storage public URL (`/storage/v1/object/public/...`),
 * rewrite it to the on-the-fly image transform endpoint (`/render/image/public/...`)
 * with width + quality params. Falls back to the original URL on any error
 * (via onError handler below) so the image always renders.
 *
 * Non-Supabase URLs (local imports, blob:, data:, external CDNs) are returned
 * unchanged.
 */
function toOptimizedSrc(src: string, width?: number | string): string {
  if (!src || typeof src !== "string") return src;
  if (!src.startsWith("http")) return src; // local import, blob, data URI
  if (!src.includes("/storage/v1/object/public/")) return src;
  // Already a render URL or already has transform params — leave it
  if (src.includes("/render/image/public/")) return src;
  if (src.includes("?") && (src.includes("width=") || src.includes("quality="))) return src;

  try {
    const rendered = src.replace(
      "/storage/v1/object/public/",
      "/storage/v1/render/image/public/",
    );
    const w = typeof width === "number" ? width : width ? parseInt(String(width), 10) : NaN;
    const params = new URLSearchParams();
    if (Number.isFinite(w) && w > 0) {
      // Cap to a sane max; supabase image resizer requires width <= 2500
      params.set("width", String(Math.min(Math.round(w), 2000)));
    }
    params.set("quality", "75");
    params.set("resize", "contain");
    const qs = params.toString();
    return qs ? `${rendered}?${qs}` : rendered;
  } catch {
    return src;
  }
}

function OptimizedImageBase({
  src,
  priority = false,
  loading,
  decoding,
  fetchPriority,
  className,
  onLoad,
  onError,
  width,
  style,
  ...rest
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  const optimizedSrc = useMemo(
    () => (failed ? src : toOptimizedSrc(src, width)),
    [src, width, failed],
  );

  return (
    <img
      {...rest}
      src={optimizedSrc}
      width={width}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={(e) => {
        // Fall back to the original src if the optimized URL fails for any reason
        if (!failed && optimizedSrc !== src) {
          setFailed(true);
        }
        onError?.(e);
      }}
      loading={loading ?? (priority ? "eager" : "lazy")}
      decoding={decoding ?? "async"}
      // @ts-expect-error — fetchpriority is valid HTML, React types lag
      fetchpriority={fetchPriority ?? (priority ? "high" : "low")}
      className={cn(className)}
      style={{
        ...style,
        opacity: loaded ? 1 : 0,
        transition: [style?.transition, "opacity 500ms ease-out"].filter(Boolean).join(", "),
      }}
    />
  );
}

export const OptimizedImage = memo(OptimizedImageBase);
