import { Link, useNavigate } from "@tanstack/react-router";
import { memo, useCallback, useState } from "react";
import { ShoppingBag, Zap } from "lucide-react";
import { toast } from "sonner";
import { formatBDT, useCart } from "@/lib/cart";
import { OptimizedImage } from "./OptimizedImage";
import { Spinner } from "./Spinner";
import { parseSizes, totalSizeStock } from "@/lib/sizes";

type Props = {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    image_url: string | null;
    unit: string | null;
    category: string | null;
    discount_amount?: number | null;
    weight_variants?: unknown;
  };
  priority?: boolean;
};

function ProductCardBase({ product, priority = false }: Props) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const sizes = parseSizes(product.weight_variants);
  const hasSizes = sizes.length > 0;
  const soldOut = hasSizes && totalSizeStock(sizes) === 0;

  const discountAmount = Math.max(0, Math.floor(Number(product.discount_amount) || 0));
  const hasDiscount = discountAmount > 0 && discountAmount < product.price;
  const effectivePrice = hasDiscount ? product.price - discountAmount : product.price;
  const discountPct = hasDiscount ? Math.round((discountAmount / product.price) * 100) : 0;

  const addToCart = useCallback(() => {
    add(
      {
        id: product.id,
        name: product.name,
        price: effectivePrice,
        image_url: product.image_url,
        unit: product.unit,
        slug: product.slug,
      },
      1,
    );
  }, [add, product, effectivePrice]);

  const goToDetail = useCallback(() => {
    navigate({ to: "/products/$slug", params: { slug: product.slug } });
  }, [navigate, product.slug]);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (adding || buying || soldOut) return;
      if (hasSizes) {
        goToDetail();
        return;
      }
      setAdding(true);
      addToCart();
      toast.success(`${product.name} added to cart`);
      setTimeout(() => setAdding(false), 450);
    },
    [addToCart, product.name, adding, buying, hasSizes, soldOut, goToDetail],
  );

  const handleBuyNow = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (adding || buying || soldOut) return;
      if (hasSizes) {
        goToDetail();
        return;
      }
      setBuying(true);
      addToCart();
      navigate({ to: "/checkout" });
    },
    [addToCart, navigate, adding, buying, hasSizes, soldOut, goToDetail],
  );

  return (
    <Link
      to="/products/$slug"
      params={{ slug: product.slug }}
      className="group flex flex-col h-full bg-card border border-border/70 overflow-hidden transition-all duration-500 hover:border-gold/70 hover:shadow-[var(--shadow-editorial)] md:hover:-translate-y-1"
    >
      {/* Image with gold hairline frame */}
      <div className="relative aspect-square overflow-hidden bg-secondary/40">
        {product.image_url ? (
          <OptimizedImage
            src={product.image_url}
            alt={product.name}
            priority={priority}
            sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] will-change-transform"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm bg-muted">
            No image
          </div>
        )}

        {/* Gold hairline inner frame */}
        <div className="pointer-events-none absolute inset-2 border border-gold/0 group-hover:border-gold/60 transition-colors duration-500" />

        {product.category && (
          <span className="absolute top-3 left-3 text-[10px] uppercase tracking-[0.22em] bg-background/95 backdrop-blur px-2.5 py-1 text-foreground font-medium">
            {product.category}
          </span>
        )}

        {hasDiscount && (
          <span className="absolute top-2.5 right-2.5 text-[10px] md:text-xs font-bold uppercase tracking-wider bg-accent text-accent-foreground px-2.5 py-1 rounded-full shadow-xs">
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3 md:p-5 gap-2 md:gap-3">
        <h3 className="font-display text-sm md:text-lg leading-[1.25] md:leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5em]">
          {product.name}
        </h3>

        {/* Gold hairline */}
        <div className="h-px w-8 bg-gold/60" />

        <div className="flex items-baseline gap-1.5 md:gap-2 flex-wrap">
          <span className="font-display text-base md:text-xl text-primary">
            {hasSizes && sizes.some((s) => s.price !== sizes[0]?.price && s.price > 0) && (
              <span className="text-xs font-sans text-muted-foreground mr-1">From</span>
            )}
            {formatBDT(
              hasSizes
                ? Math.min(...sizes.map((s) => s.price).filter((p) => p > 0)) || effectivePrice
                : effectivePrice
            )}
          </span>
          {hasDiscount && (
            <span className="text-[11px] md:text-xs text-muted-foreground line-through">
              {formatBDT(product.price)}
            </span>
          )}
        </div>

        {hasSizes && !soldOut && (
          <div className="flex flex-wrap gap-1">
            {sizes.slice(0, 5).map((s) => (
              <span
                key={s.label}
                className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                  s.stock > 0
                    ? "border-border/80 bg-muted/30 text-foreground/80"
                    : "border-border/40 text-muted-foreground line-through opacity-60"
                }`}
              >
                {s.label}
              </span>
            ))}
            {sizes.length > 5 && (
              <span className="text-[10px] text-muted-foreground self-center">
                +{sizes.length - 5}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto pt-1 flex flex-col sm:flex-row md:flex-col lg:flex-row gap-1.5 md:gap-2">
          <button
            onClick={handleAdd}
            disabled={adding || buying || soldOut}
            aria-label={hasSizes ? `Choose options for ${product.name}` : `Add ${product.name} to cart`}
            className="flex-1 inline-flex items-center justify-center gap-1.5 border border-primary/40 bg-background hover:bg-primary hover:text-primary-foreground text-primary rounded-full py-1.5 md:py-2.5 text-[11px] md:text-sm font-medium tracking-wide transition-colors disabled:opacity-60"
          >
            {adding ? <Spinner className="w-3.5 h-3.5" /> : <ShoppingBag className="w-3.5 h-3.5" />}
            {soldOut ? "Stock nei" : hasSizes ? "অপশন দেখুন" : adding ? "Adding…" : "যোগ করুন"}
          </button>
          <button
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary hover:bg-accent hover:text-accent-foreground text-primary-foreground rounded-full py-1.5 md:py-2.5 text-[11px] md:text-sm font-semibold tracking-wide transition-colors disabled:opacity-60"
            onClick={handleBuyNow}
            disabled={buying || adding || soldOut}
            aria-label={`Buy ${product.name} now`}
          >
            {buying ? <Spinner className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5" />}
            {soldOut ? "Out of stock" : buying ? "Processing…" : "কিনুন"}
          </button>
        </div>
      </div>
    </Link>
  );
}

export const ProductCard = memo(ProductCardBase);
