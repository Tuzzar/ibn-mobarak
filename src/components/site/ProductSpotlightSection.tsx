import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";
import { showcaseProductsOptions, productBySlugOptions } from "@/lib/queries";
import { formatBDT } from "@/lib/cart";
import { OptimizedImage } from "./OptimizedImage";

const AUTOPLAY_MS = 4000;

export function ProductSpotlightSection({
  kicker,
  title,
  productSlug,
}: {
  kicker?: string;
  title?: string;
  productSlug?: string;
}) {
  const { data: showcase = [] } = useQuery({
    ...showcaseProductsOptions(),
    enabled: !productSlug,
  });
  const { data: picked } = useQuery({
    ...productBySlugOptions(productSlug ?? ""),
    enabled: !!productSlug,
  });
  const product: any = productSlug ? picked : showcase[0];

  const gallery: string[] = (() => {
    if (!product) return [];
    const arr = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const first = product.image_url ? [product.image_url] : [];
    return [...first, ...arr.filter((u: string) => u !== product.image_url)];
  })();

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(gallery.length - 1, i)));
  }, [gallery.length]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  useEffect(() => {
    if (paused || gallery.length < 2) return;
    const id = window.setInterval(() => {
      const el = scrollerRef.current;
      if (!el) return;
      const next = (Math.round(el.scrollLeft / el.clientWidth) + 1) % gallery.length;
      el.scrollTo({ left: next * el.clientWidth, behavior: "smooth" });
    }, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, gallery.length]);

  if (!product) return null;

  const discount = Math.max(0, Math.floor(Number(product.discount_amount) || 0));
  const hasDiscount = discount > 0 && discount < product.price;
  const effective = hasDiscount ? product.price - discount : product.price;
  const discountPct = hasDiscount ? Math.round((discount / product.price) * 100) : 0;

  return (
    <section className="bg-section-a">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-6 md:py-20">
        <div className="mb-6 md:mb-10 text-center md:text-left">
          <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-gold">
            {kicker?.trim() || "Product spotlight"}
          </span>
          <h2 className="font-display text-[1.25rem] md:text-3xl text-foreground mt-2 md:mt-3 leading-[1.15]">
            {title?.trim() || "A closer look at one of our favourites"}
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-5 md:gap-10 items-center rounded-2xl md:rounded-[2rem] bg-card border border-border/60 overflow-hidden md:shadow-[var(--shadow-card)]">
          {/* Photo carousel */}
          <div
            className="relative aspect-square bg-secondary/40"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={() => setPaused(true)}
          >
            <div
              ref={scrollerRef}
              onScroll={onScroll}
              className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]"
            >
              {gallery.map((src, i) => (
                <div key={i} className="snap-center shrink-0 w-full h-full">
                  <OptimizedImage
                    src={src}
                    alt={`${product.name} — ${i + 1}`}
                    width={1000}
                    priority={i === 0}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {product.category && (
              <span className="absolute top-3 left-3 z-10 text-[10px] uppercase tracking-[0.18em] bg-background/95 backdrop-blur px-2.5 py-1 rounded-full text-foreground font-medium shadow-sm">
                {product.category}
              </span>
            )}
            {hasDiscount && (
              <span className="absolute top-3 right-3 z-10 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-red-500 to-rose-600 text-white px-2.5 py-1 rounded-full shadow-lg ring-1 ring-white/30">
                -{discountPct}% OFF
              </span>
            )}

            {gallery.length > 1 && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 px-2.5 py-1.5 rounded-full bg-background/70 backdrop-blur">
                {gallery.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Photo ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === active ? "w-6 bg-primary" : "w-2.5 bg-foreground/25"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="p-5 md:p-10 flex flex-col gap-4 md:gap-5">
            <h3 className="font-display text-2xl md:text-4xl leading-[1.15] text-foreground">
              {product.name}
            </h3>

            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-display text-xl md:text-2xl text-primary">
                {formatBDT(effective)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatBDT(product.price)}
                </span>
              )}
              <span className="text-xs text-muted-foreground tracking-wide">
                / {product.unit ?? "kg"}
              </span>
            </div>

            {product.description && (
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed line-clamp-4 md:line-clamp-5">
                {product.description.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim()}
              </p>
            )}

            <div className="pt-2">
              <Link
                to="/products/$slug"
                params={{ slug: product.slug }}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-6 md:px-8 py-2.5 md:py-3 text-sm md:text-base font-medium transition-colors"
              >
                View Product <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
