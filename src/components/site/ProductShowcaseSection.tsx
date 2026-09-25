import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { showcaseProductsOptions } from "@/lib/queries";
import { formatBDT, useCart } from "@/lib/cart";
import { OptimizedImage } from "./OptimizedImage";
import { Spinner } from "./Spinner";

type Showcase = {
  id: string;
  slug: string;
  name: string;
  price: number;
  image_url: string | null;
  images?: string[] | null;
  unit?: string | null;
  category?: string | null;
  discount_amount?: number | null;
};

function ShowcaseCard({ product, priority }: { product: Showcase; priority?: boolean }) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const gallery = (() => {
    const arr = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
    const first = product.image_url ? [product.image_url] : [];
    const merged = [...first, ...arr.filter((u) => u !== product.image_url)];
    return merged.length ? merged : [];
  })();

  const photoRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState(0);

  const onScroll = useCallback(() => {
    const el = photoRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    setActive(Math.max(0, Math.min(gallery.length - 1, i)));
  }, [gallery.length]);

  const goTo = (i: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const el = photoRef.current;
    if (!el) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const discount = Math.max(0, Math.floor(Number(product.discount_amount) || 0));
  const hasDiscount = discount > 0 && discount < product.price;
  const effective = hasDiscount ? product.price - discount : product.price;
  const discountPct = hasDiscount ? Math.round((discount / product.price) * 100) : 0;

  const addToCart = () => {
    add(
      {
        id: product.id,
        name: product.name,
        price: effective,
        image_url: product.image_url,
        unit: product.unit ?? null,
        slug: product.slug,
      },
      1,
    );
  };

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || buying) return;
    setAdding(true);
    addToCart();
    toast.success(`${product.name} added to cart`);
    setTimeout(() => setAdding(false), 450);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding || buying) return;
    setBuying(true);
    addToCart();
    navigate({ to: "/checkout" });
  };

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col h-full rounded-xl md:rounded-3xl bg-card border border-border/60 md:shadow-[var(--shadow-card)] overflow-hidden transition-all duration-500 md:hover:-translate-y-1 md:hover:shadow-[var(--shadow-premium)] hover:border-primary/30"
    >
      {/* Image carousel */}
      <div className="relative aspect-square overflow-hidden bg-secondary/40">
        {gallery.length > 0 ? (
          <div
            ref={photoRef}
            onScroll={onScroll}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]"
          >
            {gallery.map((src, i) => (
              <div key={i} className="snap-center shrink-0 w-full h-full">
                <OptimizedImage
                  src={src}
                  alt={`${product.name} — ${i + 1}`}
                  width={700}
                  priority={priority && i === 0}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-muted">
            No image
          </div>
        )}

        {product.category && (
          <span className="absolute top-3 left-3 z-10 text-[10px] uppercase tracking-[0.18em] bg-background/95 backdrop-blur px-2.5 py-1 rounded-full text-foreground font-medium shadow-sm pointer-events-none">
            {product.category}
          </span>
        )}

        {hasDiscount && (
          <span className="absolute top-3 right-3 z-10 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-gradient-to-br from-red-500 to-rose-600 text-white px-2.5 py-1 rounded-full shadow-lg ring-1 ring-white/30 pointer-events-none">
            -{discountPct}% OFF
          </span>
        )}

        {/* Segmented progress bar */}
        {gallery.length > 1 && (
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 flex gap-1 px-2 py-1 rounded-full bg-background/70 backdrop-blur">
            {gallery.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Photo ${i + 1}`}
                onClick={(e) => goTo(i, e)}
                className={`h-1 rounded-full transition-all ${
                  i === active ? "w-5 bg-primary" : "w-2.5 bg-foreground/25"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 md:p-5 gap-2 md:gap-3">
        <h3 className="font-display text-[13px] md:text-lg leading-[1.25] md:leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5em] break-words">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5 md:gap-2 flex-wrap">
          <span className="font-display text-sm md:text-base text-primary">{formatBDT(effective)}</span>
          {hasDiscount && (
            <span className="text-[11px] md:text-xs text-muted-foreground line-through">
              {formatBDT(product.price)}
            </span>
          )}
          <span className="text-[10px] md:text-[11px] text-muted-foreground tracking-wide">
            / {product.unit ?? "kg"}
          </span>
        </div>

        <div className="mt-auto pt-2 flex flex-col gap-1.5 w-full">
          <button
            onClick={handleAdd}
            disabled={adding || buying}
            className="w-full inline-flex items-center justify-center gap-1.5 border border-primary/40 bg-background hover:bg-primary hover:text-primary-foreground text-primary rounded-full py-2 px-2.5 text-xs sm:text-[13px] font-medium transition-colors disabled:opacity-60 cursor-pointer active:scale-[0.98]"
          >
            {adding ? <Spinner className="w-3.5 h-3.5 shrink-0" /> : <ShoppingBag className="w-3.5 h-3.5 shrink-0" />}
            <span>{adding ? "Adding…" : "Add"}</span>
          </button>
          <button
            onClick={handleBuy}
            disabled={buying || adding}
            className="w-full inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground rounded-full py-2 px-2.5 text-xs sm:text-[13px] font-semibold transition-colors disabled:opacity-60 cursor-pointer active:scale-[0.98]"
          >
            {buying ? <Spinner className="w-3.5 h-3.5 shrink-0" /> : <Zap className="w-3.5 h-3.5 shrink-0" />}
            <span>{buying ? "Processing…" : "Buy Now"}</span>
          </button>
        </div>
      </div>
    </Link>
  );
}

export function ProductShowcaseSection({
  kicker,
  title,
}: {
  kicker?: string;
  title?: string;
}) {
  const { data = [] } = useQuery(showcaseProductsOptions());
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const update = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    update();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update, data.length]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-showcase-card]");
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (!data.length) return null;

  return (
    <section className="bg-section-b">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-6 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 md:mb-10">
          <div className="max-w-xl">
            <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-gold">
              {kicker?.trim() || "In the spotlight"}
            </span>
            <h2 className="font-display text-[1.25rem] md:text-3xl text-primary-foreground mt-2 md:mt-3 leading-[1.15]">
              {title?.trim() || "Look closer — swipe the photos"}
            </h2>
          </div>
          <Link
            to="/products"
            className="self-start md:self-auto inline-flex items-center gap-2 text-sm font-medium text-primary-foreground border-b border-primary-foreground/40 pb-1 hover:border-gold transition"
          >
            View all products <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative group/showcase">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous"
            disabled={!canPrev}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-11 h-11 rounded-full bg-background/95 backdrop-blur border border-border shadow-lg items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Next"
            disabled={!canNext}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-11 h-11 rounded-full bg-background/95 backdrop-blur border border-border shadow-lg items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-2 lg:px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]"
          >
            {data.map((p, i) => (
              <div
                key={p.id}
                data-showcase-card
                className="snap-start shrink-0 w-[70%] sm:w-[55%] md:w-[40%] lg:w-[32%]"
              >
                <ShowcaseCard product={p as Showcase} priority={i < 2} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
