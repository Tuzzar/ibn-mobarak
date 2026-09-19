import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { landingPageBySlugOptions } from "@/lib/landing-queries";
import { featuredProductsOptions } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/external";
import { queryOptions } from "@tanstack/react-query";
import { Check, ShoppingCart, Phone, Leaf, ShieldCheck, Truck, Wallet, ChevronDown, Play, Palette, Heart, Award, Scissors, Gem, Package } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { LandingOrderForm } from "@/components/landing/LandingOrderForm";
import { VisitMainSiteCard } from "@/components/landing/VisitMainSiteCard";
import { extractYouTubeId } from "@/routes/admin.site-content";
import logo from "@/assets/logo.png";


const productByIdOptions = (id: string | null) =>
  queryOptions({
    queryKey: ["product-by-id", id],
    enabled: !!id,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!id) return null;
      const { data } = await supabase
        .from("products")
        .select(
          "id, slug, name, price, image_url, images, unit, description, weight_variants, discount_amount, stock",
        )
        .eq("id", id)
        .maybeSingle();
      return data;
    },
  });

export const Route = createFileRoute("/landing/$slug")({
  loader: async ({ params, context }) => {
    const page = await context.queryClient.ensureQueryData(
      landingPageBySlugOptions(params.slug),
    );
    if (!page) throw notFound();
    if (page.product_id) {
      context.queryClient.prefetchQuery(productByIdOptions(page.product_id));
    }
    context.queryClient.prefetchQuery(featuredProductsOptions());
    return { page };
  },
  head: ({ loaderData, params }) => {
    const p = loaderData?.page;
    const title = p?.seo_title || p?.hero_headline || `Order — Ibn Mobarak Art Gallery`;
    const desc = p?.seo_description || p?.hero_subheadline || "Order fresh, hand-picked produce.";
    const img = p?.og_image_url || p?.hero_image_url || undefined;
    const url = `https://fulbanu.lovable.app/landing/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "noindex, nofollow" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:url", content: url },
        { property: "og:type", content: "product" },
        ...(img ? [{ property: "og:image", content: img }, { name: "twitter:image", content: img }] : []),
      ],
    };
  },
  component: LandingSlugPage,
  notFoundComponent: () => (
    <div className="max-w-md mx-auto px-4 py-20 text-center">
      <h1 className="font-display text-3xl text-primary mb-2">Page not found</h1>
      <p className="text-sm text-muted-foreground">This landing page is no longer active.</p>
    </div>
  ),
});

/* ---------- Static Bangla content (fallback / decorative copy) ---------- */

const DEFAULT_HERO_BULLETS = [
  "১০০% হাতে তৈরি",
  "গ্রামীণ কারিগরদের সরাসরি সংগ্রহ",
  "সারা বাংলাদেশে হোম ডেলিভারি",
  "ক্যাশ অন ডেলিভারি",
];

const DEFAULT_HERO_BADGE_TOP = "হ্যান্ডমেড ইন বাংলাদেশ";
const DEFAULT_HERO_BADGE_BOTTOM = "লিমিটেড স্টক";

const DEFAULT_TRUST_STRIP = [
  { text: "হাতে তৈরি", icon: "sparkles" },
  { text: "প্রাকৃতিক উপাদান", icon: "leaf" },
  { text: "হোম ডেলিভারি", icon: "truck" },
  { text: "ক্যাশ অন ডেলিভারি", icon: "wallet" },
];

const WHY_WITHU = [
  { t: "হাতে সেলাই", d: "প্রতিটি স্টিচ গ্রামীণ কারিগরের হাতে — কোনো মেশিন নয়।" },
  { t: "প্রাকৃতিক উপাদান", d: "১০০% সুতি, প্রাকৃতিক রঙ — ত্বকের জন্য নিরাপদ।" },
  { t: "ইউনিক ডিজাইন", d: "প্রতিটি পণ্যের মোটিফ আলাদা — শুধুই আপনার।" },
  { t: "যত্নসহকারে প্যাকিং", d: "নিরাপদ প্যাকেজিংয়ে ঘরে পৌঁছে যাবে।" },
  { t: "ন্যায্য পারিশ্রমিক", d: "কারিগরদের সরাসরি সহায়তা — কোনো মধ্যস্বত্বভোগী নেই।" },
  { t: "টেকসই ঐতিহ্য", d: "যত্ন নিলে প্রজন্ম থেকে প্রজন্মে।" },
];

const WHY_WITHU_POINTS = [
  "বাংলাদেশের ১৫+ জেলার কারিগর",
  "প্রতিটি কাঁথা ইউনিক",
  "নরম ও আরামদায়ক",
  "প্রাকৃতিক রঙ",
  "টেকসই ও দীর্ঘস্থায়ী",
  "পরিবেশবান্ধব",
];

const PROMISES = [
  "অরিজিনাল হ্যান্ডমেড",
  "প্রাকৃতিক উপাদান",
  "মান যাচাই করে প্যাকিং",
  "৭ দিনে রিটার্ন",
  "নিরাপদ ডেলিভারি",
];

const JOURNEY = [
  { n: "১", t: "অর্ডার করুন", d: "ফর্ম পূরণ করুন বা কল দিন।" },
  { n: "২", t: "কনফার্মেশন", d: "আমরা কল দিয়ে কনফার্ম করব।" },
  { n: "৩", t: "প্যাকিং", d: "যত্নসহকারে প্যাক করা হবে।" },
  { n: "৪", t: "ডেলিভারি", d: "২–৫ কর্মদিবসে আপনার দরজায়।" },
];

const DEFAULT_STATS = [
  { n: "১৫+", l: "জেলার কারিগর" },
  { n: "৫,০০০+", l: "সন্তুষ্ট পরিবার" },
  { n: "১০০%", l: "হাতে তৈরি" },
];

const FALLBACK_FAQ = [
  { question: "ডেলিভারি কত দিনে পাব?", answer: "ঢাকার ভিতরে ২–৩ দিন, ঢাকার বাইরে ৩–৫ কর্মদিবস।" },
  { question: "পেমেন্ট কীভাবে করব?", answer: "ক্যাশ অন ডেলিভারি — পণ্য হাতে পেয়ে টাকা দিন।" },
  { question: "পণ্য পছন্দ না হলে?", answer: "৭ দিনের মধ্যে রিটার্ন/রিপ্লেস করা যাবে।" },
  { question: "কাঁথা কি সত্যিই হাতে সেলাই?", answer: "জি, প্রতিটি স্টিচ গ্রামীণ কারিগরের হাতে — কোনো মেশিন ব্যবহার হয় না।" },
];

const pickArr = <T,>(v: T[] | null | undefined, fb: T[]): T[] =>
  Array.isArray(v) && v.length > 0 ? v : fb;
const pickStr = (v: string | null | undefined, fb: string): string =>
  v && v.trim() ? v : fb;

/* ---------- Page ---------- */

function LandingSlugPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(landingPageBySlugOptions(slug));
  const page = data!;
  const { data: product } = useQuery(productByIdOptions(page?.product_id ?? null));
  const [variantIdx, setVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const firstFieldRef = useRef<HTMLInputElement>(null);


  const variants = useMemo(() => {
    const raw = (product as any)?.weight_variants;
    if (Array.isArray(raw) && raw.length) return raw as { label: string; price: number }[];
    return [];
  }, [product]);

  const activeVariant = variants[variantIdx];
  const originalPrice = activeVariant?.price ?? product?.price ?? 0;
  const productDiscount = (product as any)?.discount_amount ?? 0;
  const landingDiscountAmount = (page as any)?.discount_amount as number | null | undefined;
  const landingDiscountPercent = (page as any)?.discount_percent as number | null | undefined;
  const freeDelivery = (page as any)?.free_delivery ?? true;

  // Resolution: landing amount > landing percent > product discount
  let discount = 0;
  if (landingDiscountAmount && landingDiscountAmount > 0) {
    discount = landingDiscountAmount;
  } else if (landingDiscountPercent && landingDiscountPercent > 0) {
    discount = Math.round((originalPrice * landingDiscountPercent) / 100);
  } else if (!activeVariant) {
    discount = productDiscount;
  }
  const finalPrice = Math.max(originalPrice - discount, 0);
  const savings = Math.max(originalPrice - finalPrice, 0);
  const savingsPct = originalPrice > 0 ? Math.round((savings / originalPrice) * 100) : 0;
  const totalPrice = finalPrice * qty;
  // Bangla numerals helper
  const toBn = (n: number) =>
    String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[Number(d)]);

  const features = page.features?.length ? page.features.map((f: any) => ({ t: f.title, d: f.description || "" })) : WHY_WITHU;
  const faq = page.faq?.length ? page.faq : FALLBACK_FAQ;

  // Meta Pixel
  useEffect(() => {
    if (!page?.meta_pixel_id || typeof window === "undefined") return;
    const w = window as any;
    if (!w.fbq) {
      const s = document.createElement("script");
      s.async = true;
      s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');`;
      document.head.appendChild(s);
    }
    w.fbq?.("init", page.meta_pixel_id);
    w.fbq?.("track", "PageView");
    w.fbq?.("track", "ViewContent");
  }, [page?.meta_pixel_id]);

  const onOrder = () => {
    if (!product) return;
    (window as any).fbq?.("track", "AddToCart", { value: totalPrice, currency: "BDT" });
    (window as any).fbq?.("track", "InitiateCheckout", { value: totalPrice, currency: "BDT" });
    const el = document.getElementById("order");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => firstFieldRef.current?.focus(), 600);
    }
  };


  return (
    <div className="pb-32 lg:pb-12">

      {/* ============ HERO ============ */}
      <section className="relative overflow-hidden">
        {/* decorative backdrop */}
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -top-32 -left-24 w-[28rem] h-[28rem] rounded-full bg-secondary/30 blur-3xl" />
          <div className="absolute top-20 -right-24 w-[24rem] h-[24rem] rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        </div>
        <div className="max-w-6xl mx-auto px-4 pt-10 md:pt-16 pb-10 md:pb-20 grid lg:grid-cols-12 gap-10 items-center">
          <div className="fade-up order-2 lg:order-1 lg:col-span-7">
            {page.offer_text && (
              <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] bg-secondary/15 text-secondary-foreground border border-secondary/40 px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                {page.offer_text}
              </span>
            )}
            <h1 className="font-display text-[2.5rem] sm:text-5xl md:text-6xl lg:text-[4.25rem] text-foreground leading-[1.02] tracking-tight">
              {page.hero_headline || "ফুলবানু সংগ্রহ"}
            </h1>
            {page.hero_subheadline && (
              <p className="mt-6 text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl border-l-2 border-accent/50 pl-4">
                {page.hero_subheadline}
              </p>
            )}

            <ul className="mt-7 flex flex-wrap gap-2 max-w-xl">
              {pickArr(page.hero_bullets, DEFAULT_HERO_BULLETS).map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium bg-card border border-border rounded-full pl-2 pr-3.5 py-1.5 shadow-sm"
                >
                  <span className="w-5 h-5 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>

            {product && (
              <div className="mt-8 max-w-xl">
                <div className="relative rounded-3xl border border-primary/25 bg-card/80 backdrop-blur p-5 md:p-6 shadow-[0_20px_60px_-25px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
                  <div aria-hidden className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  {/* Limited offer badge */}
                  {page.urgency_text && (
                    <div className="absolute -top-3 left-5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold uppercase tracking-[0.18em] shadow-md">
                      🔥 সীমিত সময়ের অফার
                    </div>
                  )}

                  <div className="text-[10px] text-muted-foreground uppercase tracking-[0.22em] font-bold">
                    আজকের দাম
                  </div>

                  <div className="mt-2 flex flex-wrap items-end gap-3">
                    <div className="font-numeric text-5xl md:text-6xl font-bold text-primary leading-none tracking-tighter">
                      ৳{toBn(finalPrice)}
                    </div>
                    {savings > 0 && (
                      <>
                        <div className="font-numeric text-lg md:text-xl text-muted-foreground line-through decoration-2 decoration-destructive/60 mb-1">
                          ৳{toBn(originalPrice)}
                        </div>
                        {savingsPct > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-destructive text-destructive-foreground text-xs font-bold mb-1">
                            -{toBn(savingsPct)}%
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {activeVariant && (page.quantity_note?.trim() || true) && (
                    <div className="text-xs text-muted-foreground mt-2.5">
                      {activeVariant.label}
                      {page.quantity_note?.trim() ? ` • ${page.quantity_note}` : ""}
                    </div>
                  )}

                  {/* Badges row */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {savings > 0 && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/70 dark:border-emerald-800/70">
                        💰 সাশ্রয় ৳{toBn(savings)}
                      </span>
                    )}
                    {freeDelivery && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 text-xs font-bold border border-sky-200/70 dark:border-sky-800/70">
                        🚚 ফ্রি ডেলিভারি
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200/70 dark:border-amber-800/70">
                      💵 ক্যাশ অন ডেলিভারি
                    </span>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-2.5">
                    <a
                      href="#order"
                      className="pulse-cta group h-14 px-7 flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground font-display text-base shadow-lg hover:shadow-xl transition-shadow"
                    >
                      <ShoppingCart className="w-5 h-5" /> এখনই অর্ডার করুন
                      <span className="ml-1 opacity-70 group-hover:translate-x-0.5 transition">→</span>
                    </a>
                    {page.cta_phone && (
                      <a
                        href={`tel:${page.cta_phone}`}
                        className="h-14 px-5 inline-flex items-center justify-center gap-2 rounded-full border-2 border-border hover:border-accent text-foreground hover:text-accent font-semibold text-sm transition"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {page.urgency_text && (
                    <p className="mt-4 text-sm font-semibold text-destructive flex items-center gap-2">
                      ⏰ {page.urgency_text}
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>

          <div className="order-1 lg:order-2 lg:col-span-5 fade-up">
            <div className="relative">
              {/* offset frame */}
              <div aria-hidden className="absolute -inset-2 translate-x-3 translate-y-3 border-2 border-accent/40 rounded-[2rem]" />
              <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-muted shadow-[0_30px_80px_-30px_color-mix(in_oklab,var(--primary)_50%,transparent)]">
                {(page.hero_image_url || product?.image_url) ? (
                  <img
                    src={page.hero_image_url || product?.image_url || ""}
                    alt={page.hero_headline || "Ibn Mobarak Art Gallery"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-8xl bg-gradient-to-br from-secondary/30 to-primary/10">🪡</div>
                )}
                {/* corner tag */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur text-[10px] font-bold uppercase tracking-[0.18em] text-foreground border border-border/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                  {pickStr(page.hero_badge_top, DEFAULT_HERO_BADGE_TOP)}
                </div>
              </div>
              <div className="absolute -bottom-5 -left-3 sm:-left-6 bg-background border border-border rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 max-w-[80%]">
                <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
                  <Palette className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">Ibn Mobarak Art Gallery</div>
                  <div className="font-display text-sm text-foreground truncate">{pickStr(page.hero_badge_bottom, DEFAULT_HERO_BADGE_BOTTOM)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TRUST STRIP ============ */}
      <section className="bg-foreground text-background py-4 border-y border-foreground/0">
        <div className="max-w-6xl mx-auto px-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-3 md:gap-x-4">
          {pickArr(page.trust_strip, DEFAULT_TRUST_STRIP).map((b, i) => {
            const iconMap: Record<string, React.ReactNode> = {
              truck: <Truck className="w-5 h-5" />,
              wallet: <Wallet className="w-5 h-5" />,
              shield: <ShieldCheck className="w-5 h-5" />,
              leaf: <Leaf className="w-5 h-5" />,
              sparkles: <Palette className="w-5 h-5" />,
              heart: <Heart className="w-5 h-5" />,
              award: <Award className="w-5 h-5" />,
              scissors: <Scissors className="w-5 h-5" />,
              gem: <Gem className="w-5 h-5" />,
              package: <Package className="w-5 h-5" />,
            };
            const fallback = [<Palette className="w-5 h-5" />, <Heart className="w-5 h-5" />, <Truck className="w-5 h-5" />, <Wallet className="w-5 h-5" />];
            const iconKey = (b as any).icon as string | undefined;
            const icon = (iconKey && iconMap[iconKey]) || fallback[i % fallback.length];
            return (
              <React.Fragment key={b.text + i}>
                {i > 0 && <span aria-hidden className="hidden md:inline-block w-1 h-1 rounded-full bg-background/30" />}
                <div className="inline-flex items-center gap-2 text-sm font-semibold px-2">
                  <span className="text-secondary">{icon}</span>
                  <span className="tracking-wide">{b.text}</span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* ============ VIDEO SHOWCASE ============ */}
      {(() => {
        const sources = [
          ...(page.video_urls?.split(/\r?\n/) ?? []),
          ...(page.video_url?.split(/\r?\n/) ?? []),
        ];
        const ids = sources
          .map((s) => s.trim())
          .filter(Boolean)
          .map((s) => extractYouTubeId(s))
          .filter((x): x is string => !!x);
        if (ids.length === 0) return null;
        return (
          <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 items-center">
              <div className="lg:col-span-5 lg:sticky lg:top-24">
                {page.video_label && (
                  <div className="inline-flex items-center gap-2 mb-3">
                    <span className="w-8 h-px bg-primary" />
                    <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-primary font-bold">
                      {page.video_label}
                    </span>
                  </div>
                )}
                <h2 className="font-display text-3xl md:text-4xl lg:text-5xl text-foreground leading-[1.1] tracking-tight">
                  {page.video_heading || "ভিডিওতে দেখুন"}
                </h2>
                {page.video_description && (
                  <p className="text-muted-foreground mt-4 md:mt-5 text-[14px] md:text-base leading-relaxed max-w-md">
                    {page.video_description}
                  </p>
                )}
                <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{ids.length} ভিডিও</span>
                </div>
              </div>
              <div className="lg:col-span-7">
                <LandingVideoCarousel videoIds={ids} />
              </div>
            </div>
          </section>
        );
      })()}

      {/* ============ TESTIMONIALS ============ */}
      {(page.review_images?.length ?? 0) > 0 && (
        <section className="relative bg-foreground text-background py-16 md:py-20 overflow-hidden">
          <div aria-hidden className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
          <div className="relative max-w-6xl mx-auto px-4">
            <div className="absolute -top-6 right-4 md:right-8 font-display text-[6rem] md:text-[9rem] leading-none text-secondary/20 select-none">"</div>
            <SectionHeading
              kicker={pickStr(page.testimonials_kicker, "❤️ গ্রাহকদের অভিজ্ঞতা")}
              title={pickStr(page.testimonials_title, "হাজারো পরিবারের ভালোবাসা")}
              invert
            />
            <ReviewsCarousel images={page.review_images} />
          </div>
        </section>
      )}


      {/* ============ WHY NUQTAH ============ */}
      <section className="bg-background/60 py-16 border-y border-border/60">
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeading kicker={pickStr(page.features_kicker, "⭐ কেন Ibn Mobarak Art Gallery?")} title={pickStr(page.features_title, "আমরা শুধু পণ্য নয় — পৌঁছে দিই ঐতিহ্যের ছোঁয়া")} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
            {features.map((f, i) => {
              const Icon = [Palette, Heart, Award, Scissors, Gem, Package][i % 6];
              return (
                <div key={i} className="group relative pl-5 border-l-2 border-border hover:border-primary transition-colors">
                  <div className="flex items-baseline gap-3 mb-2">
                    <span className="font-display text-3xl text-primary/30 group-hover:text-primary transition-colors leading-none">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                  </div>
                  <div className="font-display text-lg text-foreground mb-1.5">{f.t}</div>
                  {f.d && <div className="text-sm text-muted-foreground leading-relaxed">{f.d}</div>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ WHY AMRAPALI ============ */}
      <section className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-12 gap-8 md:gap-12 items-center">
        <div className="md:col-span-7 md:order-2">
          <div className="relative">
            <div aria-hidden className="absolute -top-6 -left-3 font-display text-7xl md:text-9xl text-primary/10 leading-none select-none">"</div>
            <SectionHeading kicker={pickStr(page.amrapali_kicker, "✨ আমাদের গল্প")} title={pickStr(page.amrapali_title, "ফুলবানু — ঐতিহ্যকে ঘরে ঘরে")} align="left" />
          </div>
          <ul className="mt-4 divide-y divide-border/60 border-y border-border/60">
            {pickArr(page.amrapali_points, WHY_WITHU_POINTS).map((t, i) => (
              <li key={t} className="flex items-center gap-4 py-3.5">
                <span className="font-numeric text-xs text-primary/60 w-6 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <Check className="w-4 h-4 text-secondary shrink-0" />
                <span className="font-medium text-base">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-5 md:order-1">
          <div className="relative aspect-[4/5] rounded-[2rem] overflow-hidden bg-gradient-to-br from-secondary/30 to-primary/20 shadow-xl">
            {product?.image_url ? (
              <img src={product.image_url} alt={product?.name || "Ibn Mobarak Art Gallery"} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10rem]">🧵</div>
            )}
            <div className="absolute bottom-4 left-4 right-4 bg-background/90 backdrop-blur rounded-2xl px-4 py-3 border border-border">
              <div className="text-[10px] uppercase tracking-widest text-primary font-bold">Heritage Craft</div>
              <div className="font-display text-sm text-foreground mt-0.5 truncate">{product?.name || "Ibn Mobarak Art Gallery Studio"}</div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ OUR PROMISE ============ */}
      <section className="bg-accent/8 py-14" style={{ backgroundColor: "color-mix(in oklab, var(--accent) 8%, transparent)" }}>
        <div className="max-w-6xl mx-auto px-4">
          <SectionHeading kicker={pickStr(page.promise_kicker, "📦 আমাদের প্রতিশ্রুতি")} title={pickStr(page.promise_title, "যা আপনি আমাদের কাছ থেকে পাবেন")} />
          <div className="flex flex-wrap justify-center gap-3 md:gap-4">
            {pickArr(page.promise_items, PROMISES).map((p, i) => {
              const Icon = [Palette, Leaf, ShieldCheck, Heart, Truck][i % 5];
              return (
                <div key={p} className="inline-flex items-center gap-2.5 bg-card pl-2 pr-4 py-2 rounded-full border border-accent/40 shadow-sm hover:shadow-md hover:border-accent transition">
                  <span className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-sm whitespace-nowrap">{p}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ VISIT MAIN SITE (middle) ============ */}
      <div className="py-10">
        <VisitMainSiteCard />
      </div>

      {/* ============ JOURNEY ============ */}
      <section className="max-w-6xl mx-auto px-4 py-14">
        <SectionHeading kicker={pickStr(page.journey_kicker, "🚚 অর্ডার থেকে ডেলিভারি")} title={pickStr(page.journey_title, "সহজ ধাপে আপনার ঘরে")} />
        {/* Mobile: vertical timeline */}
        <ol className="md:hidden relative pl-10 space-y-5 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-primary before:via-secondary before:to-accent">
          {pickArr(page.journey_steps, JOURNEY).map((s) => (
            <li key={s.n} className="relative">
              <span className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-sm border-4 border-background">
                {s.n}
              </span>
              <div className="bg-card rounded-2xl p-4 border border-border">
                <div className="font-semibold text-sm">{s.t}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.d}</div>
              </div>
            </li>
          ))}
        </ol>
        {/* Desktop: staggered horizontal rail */}
        <div className="hidden md:grid grid-cols-4 gap-6 relative">
          <div aria-hidden className="absolute top-7 left-[8%] right-[8%] h-px bg-[repeating-linear-gradient(to_right,currentColor_0_6px,transparent_6px_12px)] text-primary/40" />
          {pickArr(page.journey_steps, JOURNEY).map((s, i) => (
            <div key={s.n} className={`relative ${i % 2 === 1 ? "mt-10" : ""}`}>
              <div className="relative z-10 mx-auto w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-display text-xl border-4 border-background shadow-lg">
                {s.n}
              </div>
              <div className="mt-4 text-center px-2">
                <div className="font-display text-base text-foreground">{s.t}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </section>



      {/* ============ STATS ============ */}
      <section className="py-14">
        <div className="max-w-5xl mx-auto px-4">
          <div className="rounded-3xl bg-gradient-to-br from-primary to-secondary text-primary-foreground p-8 md:p-12 shadow-2xl">
            <div className="text-center mb-8">
              <div className="text-xs font-bold uppercase tracking-widest opacity-80">{pickStr(page.stats_kicker, "📊 সংখ্যায় ফুলবানু")}</div>
              <h3 className="font-display text-2xl md:text-3xl mt-1">{pickStr(page.stats_title, "আমাদের যাত্রার গল্প")}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:gap-6 text-center">
              {pickArr(page.stats_items, DEFAULT_STATS).map((s) => (
                <div key={s.l} className="min-w-0 px-1">
                  <div className="font-numeric text-xl sm:text-3xl md:text-5xl leading-tight whitespace-nowrap">{s.n}</div>
                  <div className="text-[11px] sm:text-xs md:text-sm opacity-90 mt-1">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <SectionHeading kicker={pickStr(page.faq_kicker, "❓ FAQ")} title={pickStr(page.faq_title, "প্রায় জিজ্ঞাসিত প্রশ্ন")} />
        <div className="divide-y divide-border border-y border-border">
          {faq.map((q, i) => (
            <details key={i} className="group py-4">
              <summary className="cursor-pointer list-none flex items-start gap-4">
                <span className="font-numeric text-xs text-primary/60 pt-1 w-8 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-display text-base md:text-lg text-foreground">{q.question}</span>
                <span className="w-7 h-7 rounded-full border border-border text-primary flex items-center justify-center group-open:rotate-180 group-open:bg-primary group-open:text-primary-foreground transition shrink-0">
                  <ChevronDown className="w-4 h-4" />
                </span>
              </summary>
              <p className="mt-3 pl-12 pr-10 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{q.answer}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ============ FINAL CTA / ORDER BLOCK ============ */}
      <section id="order" className="px-4 py-14">
        <div className="max-w-4xl mx-auto rounded-3xl bg-foreground text-background p-6 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-secondary/30 blur-3xl" />
          <div className="relative">
            <div className="text-center mb-6">
              <div className="text-xs font-bold uppercase tracking-widest text-secondary">{pickStr(page.final_cta_kicker, "🚚 এখনই অর্ডার করুন")}</div>
              <h2 className="font-display text-3xl md:text-4xl mt-2">{pickStr(page.final_cta_title, "আজকের স্টক সীমিত")}</h2>
              <p className="text-sm opacity-80 mt-2">{pickStr(page.final_cta_description, "প্রতিটি কাঁথা হাতে তৈরি, তাই সংখ্যা সীমিত — আজই অর্ডার নিশ্চিত করুন।")}</p>
            </div>

            {product && (
              <div className="bg-background text-foreground rounded-2xl p-5 md:p-6">
                <div className="flex items-start gap-4">
                  {product.image_url && (
                    <img src={product.image_url} alt={product.name} className="w-20 h-20 md:w-24 md:h-24 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-lg md:text-xl text-foreground">{product.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">{page.quantity_note?.trim() || "প্রতিটি পণ্য হাতে তৈরি ও ইউনিক"}</div>
                  </div>
                </div>

                {variants.length > 0 && (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">সাইজ নির্বাচন করুন</div>
                    <div className="grid grid-cols-2 gap-2">
                      {variants.map((v, i) => (
                        <button
                          key={v.label}
                          onClick={() => setVariantIdx(i)}
                          className={`px-3 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                            i === variantIdx
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="font-semibold">{v.label}</div>
                          <div className="font-numeric text-base">৳{v.price}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="flex items-center border-2 border-border rounded-xl">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-10 h-11 text-xl font-bold">−</button>
                    <span className="w-10 text-center font-semibold">{qty}</span>
                    <button onClick={() => setQty((q) => q + 1)} className="w-10 h-11 text-xl font-bold">+</button>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">পণ্যের মূল্য</div>
                    <div className="font-numeric text-2xl text-primary">৳{totalPrice}</div>
                  </div>
                </div>

                <LandingOrderForm
                  ref={firstFieldRef}
                  product={{ id: product.id, name: product.name, unit: product.unit }}
                  variant={activeVariant}
                  qty={qty}
                  unitPrice={finalPrice}
                  originalUnitPrice={originalPrice}
                  ctaPhone={page.cta_phone}
                  ctaText={page.cta_button_text}
                />


                {page.cta_phone && (
                  <a
                    href={`tel:${page.cta_phone}`}
                    className="mt-3 w-full h-12 rounded-2xl border-2 border-accent text-accent font-semibold flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" /> ফোন করুন: {page.cta_phone}
                  </a>
                )}
                {page.cta_phone && (
                  <a
                    href={`https://wa.me/${page.cta_phone.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener"
                    className="mt-2 w-full h-12 rounded-2xl bg-[#25D366] text-white font-semibold flex items-center justify-center gap-2 hover:bg-[#1ebe5d] transition"
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
                    WhatsApp এ অর্ডার করুন
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ============ VISIT MAIN SITE (below order form) ============ */}
      <div className="pb-24 lg:pb-10 pt-2">
        <VisitMainSiteCard />
      </div>

      {/* ============ STICKY BOTTOM CTA (mobile) ============ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur border-t border-border p-3 flex items-center gap-2 shadow-2xl">
        {page.cta_phone && (
          <a
            href={`tel:${page.cta_phone}`}
            className="h-12 w-12 rounded-xl border-2 border-accent text-accent flex items-center justify-center shrink-0"
            aria-label="Call"
          >
            <Phone className="w-5 h-5" />
          </a>
        )}
        {page.cta_phone && (
          <a
            href={`https://wa.me/${page.cta_phone.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener"
            aria-label="WhatsApp"
            className="h-12 w-12 rounded-xl bg-[#25D366] text-white flex items-center justify-center shrink-0"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          </a>
        )}
        <button
          onClick={onOrder}
          disabled={!product}
          className="flex-1 h-12 rounded-xl bg-primary text-primary-foreground font-display text-sm flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>অর্ডার করুন</span>
          {product && <span className="font-numeric">— ৳{totalPrice}</span>}
        </button>
      </div>
    </div>
  );
}

function SectionHeading({
  kicker, title, align = "center", invert = false,
}: { kicker: string; title: string; align?: "center" | "left"; invert?: boolean }) {
  return (
    <div className={`mb-8 ${align === "center" ? "text-center" : "text-left"}`}>
      <div className={`text-xs font-bold uppercase tracking-widest ${invert ? "text-secondary" : "text-primary"}`}>{kicker}</div>
      <h2 className={`font-display text-2xl md:text-4xl mt-2 ${invert ? "text-background" : "text-foreground"}`}>{title}</h2>
    </div>
  );
}

function ReviewsCarousel({ images }: { images: string[] }) {
  const autoplay = useRef(Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start", dragFree: false, containScroll: false },
    [autoplay.current],
  );
  const [selected, setSelected] = useState(0);
  const [snaps, setSnaps] = useState<number[]>([]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    setSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", () => {
      setSnaps(emblaApi.scrollSnapList());
      onSelect();
    });
    onSelect();
  }, [emblaApi]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex -ml-4 touch-pan-y">
          {images.map((src, i) => (
            <div
              key={src + i}
              className="pl-4 shrink-0 grow-0 basis-[80%] sm:basis-1/2 lg:basis-1/3"
            >
              <div className="bg-background/5 backdrop-blur rounded-2xl border border-background/10 overflow-hidden h-full">
                <img
                  src={src}
                  alt={`Customer review ${i + 1}`}
                  loading="lazy"
                  className="w-full h-auto object-contain bg-background/5"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {snaps.length > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {snaps.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to review ${i + 1}`}
              onClick={() => emblaApi?.scrollTo(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === selected ? "w-6 bg-secondary" : "w-1.5 bg-background/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LandingVideoPlayer({
  videoId,
  isPlaying,
  onPlay,
}: {
  videoId: string;
  isPlaying?: boolean;
  onPlay?: () => void;
}) {
  const [internalClicked, setInternalClicked] = useState(false);
  const clicked = isPlaying !== undefined ? isPlaying : internalClicked;
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&autoplay=1`;
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-xl bg-card border border-border/60 group">
      <div className="aspect-video relative">
        {!clicked ? (
          <>
            <img
              src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
              onError={(e) => {
                const img = e.currentTarget;
                if (img.src.includes("maxresdefault")) {
                  img.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                }
              }}
              alt="Video thumbnail"
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <button
              onClick={() => {
                if (onPlay) onPlay();
                else setInternalClicked(true);
              }}
              className="absolute inset-0 z-10 flex items-center justify-center bg-background/30 backdrop-blur-[1px] transition-opacity duration-300 group-hover:bg-background/20"
              aria-label="Play video"
            >
              <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                <Play className="w-7 h-7 md:w-8 md:h-8 fill-current ml-1" />
              </span>
            </button>
          </>
        ) : (
          <iframe
            src={src}
            title="Landing video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full border-0"
          />
        )}
      </div>
    </div>
  );
}

function LandingVideoCarousel({ videoIds }: { videoIds: string[] }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selected, setSelected] = useState(0);
  const [activePlayingIndex, setActivePlayingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelected(emblaApi.selectedScrollSnap());
      setActivePlayingIndex(null); // stop any playing video on slide change
    };
    emblaApi.on("select", onSelect);
    onSelect();
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  if (videoIds.length === 0) return null;

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
        <div className="flex">
          {videoIds.map((id, i) => (
            <div key={id + i} className="min-w-0 flex-[0_0_100%]">
              <LandingVideoPlayer
                videoId={id}
                isPlaying={activePlayingIndex === i}
                onPlay={() => setActivePlayingIndex(i)}
              />
            </div>
          ))}
        </div>
      </div>

      {videoIds.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous video"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-background/85 hover:bg-background text-foreground shadow-md flex items-center justify-center z-10 transition"
          >
            <ChevronDown className="w-5 h-5 rotate-90" />
          </button>
          <button
            type="button"
            aria-label="Next video"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 md:w-10 md:h-10 rounded-full bg-background/85 hover:bg-background text-foreground shadow-md flex items-center justify-center z-10 transition"
          >
            <ChevronDown className="w-5 h-5 -rotate-90" />
          </button>

          <div className="flex items-center justify-center gap-1.5 mt-4">
            {videoIds.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Go to video ${i + 1}`}
                onClick={() => emblaApi?.scrollTo(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === selected ? "w-6 bg-primary" : "w-1.5 bg-foreground/25 hover:bg-foreground/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
