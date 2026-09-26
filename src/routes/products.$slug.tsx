import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  Minus,
  Plus,
  ShoppingBag,
  ArrowLeft,
  Zap,
  Leaf,
  ShieldCheck,
  HandHeart,
  Truck,
  Banknote,
  Award,
  Check,
  Clock,
  Gift,
  MessageCircle,
  ZoomIn,
  X,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import { useCart, formatBDT } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { useContactInfo } from "@/lib/contact";
import { SITE_URL } from "@/lib/brand";
import { OptimizedImage } from "@/components/site/OptimizedImage";
import { ProductCard } from "@/components/site/ProductCard";
import { Spinner } from "@/components/site/Spinner";
import { ProductDetailSkeleton } from "@/components/site/ProductDetailSkeleton";
import { productBySlugOptions, relatedProductsOptions, siteContentOptions } from "@/lib/queries";
import { findSize, parseSizes, totalSizeStock } from "@/lib/sizes";

export const Route = createFileRoute("/products/$slug")({
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(
      productBySlugOptions(params.slug),
    );
    if (!data) throw notFound();
    return { product: data };
  },
  head: ({ params, loaderData }) => {
    const product = loaderData?.product as any;
    const url = `${SITE_URL}/products/${params.slug}`;
    if (!product) {
      return {
        meta: [{ title: "Product — Ibn Mobarak Art Gallery" }],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const title = `${product.name} — Buy Online | Ibn Mobarak Art Gallery`;
    const rawDesc: string = (product.description ?? "").toString().trim();
    const cleanDesc = rawDesc.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
    const description =
      (cleanDesc.length > 0
        ? cleanDesc.slice(0, 155)
        : `Buy ${product.name} online — premium art supply by Ibn Mobarak Art Gallery, delivered across Bangladesh.`);
    const image: string | undefined = product.image_url || undefined;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        ...(image ? [
          { property: "og:image", content: image },
          { name: "twitter:image", content: image },
        ] : []),
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: cleanDesc || undefined,
            image: image ? [image] : undefined,
            sku: product.id,
            category: product.category || undefined,
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "BDT",
              price: Number(product.price),
              availability:
                Number(product.stock) > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductDetail,
  pendingComponent: ProductDetailSkeleton,
  errorComponent: ({ error }) => (
    <div className="container mx-auto px-6 py-20 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="container mx-auto px-6 py-20 text-center">
      Product not found.
    </div>
  ),
});


function ProductDetail() {
  const { slug } = Route.useParams();
  const [qty, setQty] = useState(1);
  const { add } = useCart();
  const navigate = useNavigate();
  const { data: product } = useSuspenseQuery(productBySlugOptions(slug));
  const { data: siteContent } = useQuery(siteContentOptions());
  const contact = useContactInfo();

  const trustBadges = useMemo(() => [
    { icon: Award, label: siteContent?.product_badge_1 || "Premium" },
    { icon: ShieldCheck, label: siteContent?.product_badge_2 || "Quality Checked" },
    { icon: Banknote, label: siteContent?.product_badge_3 || "Cash on Delivery" },
    { icon: Truck, label: siteContent?.product_badge_4 || "Nationwide Delivery" },
    { icon: Gift, label: siteContent?.product_badge_5 || "Gift-Wrapped" },
  ], [siteContent]);

  const rawVariants = (product as any)?.weight_variants;
  const sizes = useMemo(
    () => parseSizes(rawVariants),
    [rawVariants],
  );
  const hasSizes = sizes.length > 0;
  const sizeStockTotal = totalSizeStock(sizes);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const { isFavorite, toggleFavorite } = useWishlist();
  const isFav = product ? isFavorite(product.id) : false;

  useEffect(() => {
    if (sizes.length > 0) {
      const firstInStock = sizes.find((s) => s.stock > 0) || sizes[0];
      setSelectedSize(firstInStock?.label ?? null);
    } else {
      setSelectedSize(null);
    }
    setQty(1);
  }, [slug, sizes]);

  const activeSize = findSize(sizes, selectedSize) || (hasSizes ? sizes[0] : undefined);

  // Dynamic pricing based on active variant
  const basePrice = Number(activeSize?.price || product?.price || 0);
  const originalPrice = activeSize?.original_price;
  const discountAmount = originalPrice && originalPrice > basePrice
    ? originalPrice - basePrice
    : Math.max(0, Math.floor(Number((product as any)?.discount_amount) || 0));
  const hasDiscount = discountAmount > 0;
  const activePrice = basePrice;
  const originalPriceToDisplay = originalPrice || (hasDiscount ? basePrice + discountAmount : null);
  const discountPct = originalPriceToDisplay && originalPriceToDisplay > activePrice
    ? Math.round(((originalPriceToDisplay - activePrice) / originalPriceToDisplay) * 100)
    : 0;
  const activeUnit = activeSize ? activeSize.label : (product?.unit ?? "pcs");
  const maxQty = activeSize ? Math.max(1, activeSize.stock) : Math.max(1, Number(product?.stock ?? 25));

  const rawImages = (product as any)?.images;
  const primaryImageUrl = product?.image_url;
  const images = useMemo(() => {
    const arr = Array.isArray(rawImages)
      ? rawImages.filter((u): u is string => typeof u === "string" && u.length > 0)
      : [];
    if (arr.length === 0 && primaryImageUrl) arr.push(primaryImageUrl);
    // Ensure primary image_url is first if present
    if (primaryImageUrl && arr[0] !== primaryImageUrl) {
      const idx = arr.indexOf(primaryImageUrl);
      if (idx > 0) {
        arr.splice(idx, 1);
        arr.unshift(primaryImageUrl);
      }
    }
    return Array.from(new Set(arr));
  }, [rawImages, primaryImageUrl]);
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    setActiveIdx(0);
  }, [slug]);

  // Image zoom (desktop hover)
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 });
  const onMove = useCallback((e: React.MouseEvent) => {
    const el = imgWrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setZoom({
      on: true,
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    });
  }, []);

  const { data: related = [] } = useQuery(
    relatedProductsOptions(product?.category ?? null, product?.id ?? ""),
  );

  const addToCart = useCallback(
    (n = qty) => {
      if (!product) return;
      const attrName = activeSize?.attribute || "Option";
      const variantSuffix = activeSize ? ` (${attrName}: ${activeSize.label})` : "";
      add(
        {
          id: activeSize ? `${product.id}::${activeSize.label}` : product.id,
          name: `${product.name}${variantSuffix}`,
          price: activePrice,
          image_url: activeSize?.image_url || product.image_url,
          unit: activeUnit,
          slug: product.slug,
        },
        n,
      );
    },
    [add, product, qty, activeSize, activePrice, activeUnit],
  );


  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const handleAdd = useCallback(async () => {
    if (adding || buying) return;
    setAdding(true);
    addToCart();
    toast.success(`${qty} × ${product!.name} added to cart`);
    // brief feedback window for the spinner before resetting
    setTimeout(() => setAdding(false), 450);
  }, [addToCart, product, qty, adding, buying]);

  const handleBuyNow = useCallback(() => {
    if (adding || buying) return;
    setBuying(true);
    addToCart();
    navigate({ to: "/checkout" });
  }, [addToCart, navigate, adding, buying]);

  // Show sticky CTA on mobile only after the user scrolls past the inline actions.
  const [showStickyCta, setShowStickyCta] = useState(false);
  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!product) return null;
  const activeImage = images[activeIdx] ?? null;
  const oos = hasSizes ? sizeStockTotal === 0 : product.stock === 0;
  const needsSize = hasSizes && !activeSize;
  const blocked = oos || needsSize;

  return (
    <div className="bg-background text-foreground">
    <div className="container mx-auto px-4 sm:px-6 max-w-7xl py-6 md:py-16 pb-32 md:pb-16 animate-in fade-in duration-500">
      <Link
        to="/products"
        className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-muted-foreground hover:text-primary mb-6 md:mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to shop
      </Link>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
        {/* Gallery */}
        <div className="flex flex-col-reverse md:flex-row gap-3 md:gap-4">
          {images.length > 1 && (
            <div className="flex md:flex-col gap-2 md:gap-3 md:w-20">
              {images.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActiveIdx(i)}
                  className={`relative aspect-square w-16 md:w-20 overflow-hidden border transition-all ${
                    i === activeIdx
                      ? "border-gold shadow-[var(--shadow-gold)]"
                      : "border-border hover:border-gold/60"
                  }`}
                >
                  <OptimizedImage
                    src={src}
                    alt={`${product.name} ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          <div
            ref={imgWrapRef}
            onMouseMove={onMove}
            onMouseLeave={() => setZoom((z) => ({ ...z, on: false }))}
            onClick={() => setLightboxOpen(true)}
            className="relative flex-1 aspect-square overflow-hidden bg-secondary/40 border border-border shadow-[var(--shadow-card)] cursor-zoom-in group"
          >
            {activeImage ? (
              <OptimizedImage
                key={activeImage}
                src={activeImage}
                alt={product.name}
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="w-full h-full object-cover transition-all duration-500 ease-out will-change-transform animate-in fade-in zoom-in-[1.02]"
                style={
                  zoom.on
                    ? {
                        transform: `scale(2)`,
                        transformOrigin: `${zoom.x}% ${zoom.y}%`,
                      }
                    : undefined
                }
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
            {/* Gold hairline inner frame */}
            <div className="pointer-events-none absolute inset-3 border border-gold/40" />
            
            {/* Click to expand pill */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] uppercase tracking-wider bg-background/90 backdrop-blur px-2.5 py-1 rounded-full border border-gold/30 text-foreground shadow-sm">
              <ZoomIn className="w-3 h-3 text-gold" />
              <span>বড় করে দেখুন</span>
            </div>

            <div className="hidden md:block absolute bottom-3 right-3 text-[10px] uppercase tracking-widest bg-background/95 backdrop-blur px-2.5 py-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
              Hover to zoom
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {product.category && (
              <span className="text-[11px] uppercase tracking-[0.28em] text-gold font-medium">
                {product.category}
              </span>
            )}
            {product.featured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary text-primary-foreground shadow-xs">
                ★ Best Seller in {product.category || "Art Supplies"}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl md:text-5xl text-foreground mt-2 md:mt-2.5 leading-[1.1]">
            {product.name}
          </h1>

          <div className="mt-3 md:mt-4 h-px w-16 bg-gold/60" />

          {/* Price display matching Ahbab */}
          <div className="font-display text-3xl md:text-4xl text-primary mt-4 flex items-baseline gap-3 flex-wrap">
            <span>{formatBDT(activePrice)}</span>
            {hasDiscount && (
              <>
                <span className="font-sans text-base md:text-lg text-muted-foreground line-through">
                  {formatBDT(originalPriceToDisplay ?? basePrice)}
                </span>
                <span className="font-sans text-xs font-semibold uppercase tracking-[0.15em] bg-gold text-gold-foreground px-2.5 py-1 rounded">
                  Save {discountPct}%
                </span>
              </>
            )}
          </div>

          {/* Availability Status */}
          <div className="mt-3 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground uppercase tracking-wider font-semibold">
              Availability:
            </span>
            {oos ? (
              <span className="text-destructive font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-destructive" /> Out of Stock
              </span>
            ) : (
              <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                In Stock {activeSize ? `(${activeSize.stock} available)` : ""}
              </span>
            )}
          </div>

          {/* Variant / Size Selector Pills (Ahbab Style) */}
          {hasSizes && (
            <div className="mt-6 pt-5 border-t border-border/60">
              <div className="flex items-baseline justify-between gap-3 mb-2.5">
                <div className="text-xs uppercase tracking-[0.2em] font-bold text-foreground">
                  {activeSize?.attribute ? `${activeSize.attribute.toUpperCase()}:` : "PAD SIZE:"}
                </div>
                {activeSize && (
                  <span className="text-xs font-medium text-muted-foreground">
                    Selected: <strong className="text-primary">{activeSize.label}</strong>
                    {activeSize.price > 0 && <> — {formatBDT(activeSize.price)}</>}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2.5">
                {sizes.map((s) => {
                  const active = activeSize?.label === s.label;
                  const soldOut = s.stock <= 0;
                  return (
                    <button
                      key={s.label}
                      type="button"
                      disabled={soldOut}
                      onClick={() => {
                        setSelectedSize(s.label);
                        setQty(1);
                        if (s.image_url) {
                          const imgIdx = images.indexOf(s.image_url);
                          if (imgIdx >= 0) setActiveIdx(imgIdx);
                        }
                      }}
                      className={`min-w-[3.5rem] px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all border ${
                        soldOut
                          ? "border-border/60 text-muted-foreground line-through cursor-not-allowed bg-muted/20 opacity-60"
                          : active
                            ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-gold/40 ring-offset-2 ring-offset-background font-bold"
                            : "bg-card text-foreground border-border hover:border-gold hover:text-primary"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}


          {/* Quantity + Actions (Desktop & Mobile unified and clean above the fold) */}
          <div className="mt-6 pt-5 border-t border-border/60">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Quantity Counter */}
              <div className="flex items-center justify-between sm:justify-start gap-3 border border-border rounded-xl bg-card px-3 py-1.5 shrink-0">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold sm:hidden">
                  পরিমাণ
                </span>
                <div className="inline-flex items-center">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors text-foreground"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-9 text-center font-bold text-sm text-foreground">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    aria-label="Increase quantity"
                    className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded-lg transition-colors text-foreground"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Add to Cart */}
              <button
                onClick={handleAdd}
                disabled={blocked || adding || buying}
                className={`flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all shadow-xs active:scale-[0.99] disabled:opacity-80 ${
                  oos
                    ? "border border-destructive/40 bg-destructive/10 text-destructive cursor-not-allowed"
                    : "border-2 border-primary bg-card text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-md"
                }`}
              >
                {adding ? <Spinner className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{oos ? "স্টক আউট" : needsSize ? "সাইজ সিলেক্ট করুন" : adding ? "যোগ হচ্ছে…" : "কার্টে যোগ করুন"}</span>
              </button>

              {/* Buy Now (Primary CTA) */}
              <button
                onClick={handleBuyNow}
                disabled={blocked || buying || adding}
                className="flex-1 min-h-[48px] inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground px-4 sm:px-5 py-3 rounded-xl font-bold text-sm tracking-wide whitespace-nowrap transition-all shadow-md hover:shadow-lg active:scale-[0.99] disabled:opacity-50"
              >
                {buying ? <Spinner className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                <span>{oos ? "স্টক আউট" : needsSize ? "সাইজ সিলেক্ট করুন" : buying ? "অর্ডার হচ্ছে…" : "অর্ডার করুন"}</span>
              </button>

              {/* Wishlist Toggle Button */}
              <button
                type="button"
                onClick={() =>
                  toggleFavorite({
                    id: product.id,
                    name: product.name,
                    price: activePrice,
                    original_price: originalPriceToDisplay,
                    image_url: activeImage || product.image_url,
                    slug: product.slug,
                    category: product.category,
                    inStock: !oos,
                  })
                }
                className={`w-12 h-12 rounded-xl border flex items-center justify-center transition shrink-0 cursor-pointer ${
                  isFav
                    ? "bg-rose-500 text-white border-rose-500 shadow-sm"
                    : "bg-card border-border hover:border-rose-400 hover:text-rose-500 text-muted-foreground"
                }`}
                aria-label={isFav ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
                title={isFav ? "পছন্দের তালিকা থেকে সরান" : "পছন্দের তালিকায় রাখুন"}
              >
                <Heart className={`w-5 h-5 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>

            {/* Direct WhatsApp Consultation CTA */}
            <a
              href={`https://wa.me/${contact.whatsappNumber || "8801677870998"}?text=${encodeURIComponent(
                `আসসালামু আলাইকুম, আমি Ibn Mobarak Art Gallery থেকে "${product.name}" সম্পর্কে জানতে চাচ্ছি: ${SITE_URL}/products/${product.slug}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full mt-3 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wide transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>{siteContent?.product_whatsapp_cta_text || "WhatsApp এ এই পণ্য সম্পর্কে প্রশ্ন করুন"}</span>
            </a>

            {/* Estimated Dispatch Alert */}
            <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3.5 py-2.5 rounded-xl border border-border/60">
              <Clock className="w-4 h-4 text-gold shrink-0" />
              <span>
                {siteContent?.product_delivery_notice || (
                  <>আজ অর্ডার করলে সম্ভাব্য ডেলিভারি: <strong>১-৩ কার্যদিবসের মধ্যে</strong> (ঢাকা ১-২ দিন, ঢাকার বাইরে ২-৪ দিন)</>
                )}
              </span>
            </div>
          </div>

          {/* Quick Perks / Delivery summary in Buy Box */}
          <div className="mt-5 p-3.5 rounded-xl bg-card border border-border/70 space-y-2 text-xs text-foreground/80">
            <div className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-gold shrink-0" />
              <span>
                <strong>সারা দেশে হোম ডেলিভারি:</strong> {siteContent?.product_delivery_fee_summary || "ঢাকা ৳৮০, ঢাকার বাইরে ৳১৩০ (১ কেজি পর্যন্ত ফিক্সড, এরপর প্রতি অতিরিক্ত কেজিতে ৳২০)।"}
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>১০০% অরিজিনাল পণ্য:</strong> যাচাইকৃত আর্ট ব্র্যান্ড ও নিরাপদ ট্রানজিট প্যাকেজিং
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <Banknote className="w-4 h-4 text-gold shrink-0" />
              <span>
                পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধের নিশ্চয়তা
              </span>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-5 grid grid-cols-5 gap-2">
            {trustBadges.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-1 p-2 border border-border/70 rounded-lg bg-card text-center transition-colors hover:border-gold/60"
              >
                <Icon className="w-4 h-4 text-gold" />
                <span className="text-[10px] leading-tight text-foreground/75 font-medium">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Product Information & Specifications (Full Width below fold) */}
      <section className="mt-14 md:mt-20 border-t border-border/80 pt-10 md:pt-14">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-8 md:mb-12">
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold font-semibold">
              Product Overview & Specifications
            </span>
            <h2 className="font-display text-2xl md:text-3xl text-foreground mt-1.5">
              পণ্যের বিস্তারিত বিবরণ
            </h2>
            <div className="mt-3 h-0.5 w-16 bg-gold/70 mx-auto rounded-full" />
          </div>

          {/* Artisan Statement Banner */}
          <div className="mb-8 border border-gold/40 bg-card rounded-2xl p-5 md:p-6 flex items-start gap-3.5 shadow-xs">
            <HandHeart className="w-6 h-6 text-gold mt-0.5 shrink-0" />
            <div>
              <h3 className="font-display text-base md:text-lg text-primary font-semibold">
                শিল্প ও নান্দনিকতা — Ibn Mobarak Art Gallery
              </h3>
              <p className="mt-1 text-sm md:text-[15px] text-foreground/85 leading-relaxed">
                প্রতিটি আর্ট সামগ্রী, পেপার ও ক্যালিগ্রাফি টুল যত্নসহকারে যাচাইকৃত এবং প্রফেশনাল শিল্পীদের মানদণ্ডে উত্তীর্ণ। আমরা নিশ্চিত করি সেরা ব্র্যান্ডের আসল পণ্য ও নিরাপদ ডেলিভারি।
              </p>
            </div>
          </div>

          {/* Detailed Rich HTML Description */}
          {product.description && (
            <div className="bg-card border border-border/70 rounded-2xl p-6 md:p-8 shadow-xs">
              <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-gold mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gold inline-block" />
                বিস্তারিত তথ্য ও ব্যবহারবিধি
              </h3>
              <div
                className="text-foreground/85 leading-relaxed text-sm md:text-base product-rich-description prose max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            </div>
          )}

          {/* Highlights & Features Grid */}
          <div className="mt-8 bg-card border border-border/70 rounded-2xl p-6 md:p-8 shadow-xs">
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-gold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-gold inline-block" />
              পণ্যটির বিশেষ সুবিধাসমূহ
            </h3>
            <ul className="grid sm:grid-cols-2 gap-3.5">
              {[
                "১০০% জেনুইন আর্ট ব্র্যান্ড ও প্রিমিয়াম কোয়ালিটি নিশ্চয়তা",
                "নিরাপদ, আর্ট-গ্রেড ও নিখুঁত ট্রানজিট প্যাকেজিং",
                "সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা",
                "শিল্প, স্কেচ ও ক্যালিগ্রাফি বিশেষজ্ঞদের পছন্দের পণ্য",
                "কোনো ত্রুটি থাকলে তাৎক্ষণিক কাস্টমার সাপোর্ট ও রিপ্লেসমেন্ট সুবিধা",
                "হাতে পেয়ে দেখে মূল্য পরিশোধের সম্পূর্ণ স্বাধীনতা",
              ].map((h) => (
                <li
                  key={h}
                  className="flex items-start gap-2.5 text-sm md:text-[15px] text-foreground/85"
                >
                  <Check className="w-4 h-4 text-gold mt-1 shrink-0" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Delivery & Assurance Details Cards */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-border/70 rounded-2xl bg-card p-5 text-left">
              <Truck className="w-5 h-5 text-gold mb-2.5" />
              <h4 className="text-sm font-semibold text-foreground">সারা দেশে ডেলিভারি</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                ঢাকা সিটিতে ২-৩ কর্মদিবস এবং জেলা পর্যায়ে ৩-৫ কর্মদিবসের মধ্যে কুরিয়ারের মাধ্যমে পৌঁছে দেওয়া হয়।
              </p>
            </div>
            <div className="border border-border/70 rounded-2xl bg-card p-5 text-left">
              <Banknote className="w-5 h-5 text-gold mb-2.5" />
              <h4 className="text-sm font-semibold text-foreground">ক্যাশ অন ডেলিভারি</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                কোনো অগ্রিম পেমেন্ট ছাড়াই অর্ডার করুন, ডেলিভারি ম্যানের কাছ থেকে পার্সেল গ্রহণ করার সময় বিল পরিশোধ করুন।
              </p>
            </div>
            <div className="border border-border/70 rounded-2xl bg-card p-5 text-left">
              <Award className="w-5 h-5 text-gold mb-2.5" />
              <h4 className="text-sm font-semibold text-foreground">গুণগত মানের নিশ্চয়তা</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                সরাসরি বিশ্বস্ত আর্ট ব্র্যান্ড ও প্রস্তুতকারক থেকে সংগৃহীত। আসল ও মানসম্মত আর্ট সামগ্রীর শতভাগ নিশ্চয়তা।
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section className="mt-20 md:mt-28">
          <div className="flex items-end justify-between mb-6 md:mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.28em] text-gold font-medium">
                You may also like
              </span>
              <h2 className="font-display text-2xl md:text-3xl text-foreground mt-2">
                Related products
              </h2>
              <div className="mt-3 h-px w-12 bg-gold/60" />
            </div>
            <Link
              to="/products"
              className="text-sm text-primary hover:text-gold transition-colors hidden sm:inline"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {related.slice(0, 4).map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* Sticky mobile CTA — only after user scrolls */}
      <div
        className={`md:hidden fixed bottom-16 left-0 right-0 z-40 border-t border-gold/40 bg-background/95 backdrop-blur-xl px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] shadow-[0_-8px_24px_-12px_oklch(0.36_0.08_165_/_0.25)] transition-all duration-300 ${
          showStickyCta
            ? "translate-y-0 opacity-100 pointer-events-auto"
            : "translate-y-full opacity-0 pointer-events-none"
        }`}
        aria-hidden={!showStickyCta}
      >
        <div className="flex items-center gap-2">
          <div className="flex flex-col leading-tight pr-1">
            <span className="text-[10px] uppercase tracking-wider text-gold">
              Price
            </span>
            <span className="font-display text-lg text-primary">
              {formatBDT(activePrice * qty)}
            </span>
          </div>
          <button
            onClick={handleAdd}
            disabled={blocked || adding || buying}
            className="flex-1 inline-flex items-center justify-center gap-1.5 border border-primary text-primary rounded-full py-2.5 px-3 text-xs sm:text-sm font-medium whitespace-nowrap disabled:opacity-50"
          >
            {adding ? <Spinner className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
            <span>{adding ? "যোগ হচ্ছে…" : "কার্টে যোগ করুন"}</span>
          </button>
          <button
            onClick={handleBuyNow}
            disabled={blocked || buying || adding}
            className="flex-1 inline-flex items-center justify-center gap-1.5 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground rounded-full py-2.5 px-3 text-xs sm:text-sm font-bold whitespace-nowrap disabled:opacity-50 shadow-sm"
          >
            {buying ? <Spinner className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            <span>{oos ? "স্টক আউট" : needsSize ? "অপশন বাছাই করুন" : buying ? "অর্ডার হচ্ছে…" : "অর্ডার করুন"}</span>
          </button>
        </div>
      </div>

      {/* Fullscreen Art Lightbox Modal */}
      {lightboxOpen && activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close image preview"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={activeImage}
            alt={product.name}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
    </div>
  );
}

