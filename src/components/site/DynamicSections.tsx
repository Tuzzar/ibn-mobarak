import { Component, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { homeSectionsOptions, type HomeSectionRow } from "@/lib/home-sections";
import { supabase } from "@/integrations/supabase/external";
import { queryOptions } from "@tanstack/react-query";
import { ProductCard } from "./ProductCard";
import { ProductSpotlightSection } from "./ProductSpotlightSection";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function DynamicSections() {
  const { data: sections = [] } = useQuery(homeSectionsOptions());
  if (sections.length === 0) return null;
  return (
    <>
      {sections.map((s) => (
        <SectionErrorBoundary key={s.id}>
          <SectionRenderer section={s} />
        </SectionErrorBoundary>
      ))}
    </>
  );
}

function SectionRenderer({ section }: { section: HomeSectionRow }) {
  switch (section.type) {
    case "rich_text":
      return <RichTextSection config={section.config as any} />;
    case "image_banner":
      return <ImageBannerSection config={section.config as any} />;
    case "product_spotlight":
      return <SpotlightWrapper config={section.config as any} />;
    case "product_grid":
      return <ProductGridSection config={section.config as any} />;
    case "product_showcase":
      return <ShowcaseWrapper config={section.config as any} />;
    case "category_grid":
      return <CategoryGridSection config={section.config as any} />;
    case "testimonials_block":
      return <TestimonialsBlock config={section.config as any} />;
    case "faq_block":
      return <FaqBlock config={section.config as any} />;
    default:
      return null;
  }
}

const LIST_COLS =
  "id, slug, name, price, image_url, unit, category, featured, stock, product_level, sort_order, discount_amount";
const DETAIL_COLS =
  "id, slug, name, price, image_url, images, unit, category, featured, stock, description, product_level, sort_order, weight_variants, discount_amount";

function SpotlightWrapper({
  config,
}: {
  config: { kicker?: string; heading?: string; product_slug?: string };
}) {
  if (!config.product_slug) return null;
  return (
    <ProductSpotlightSection
      kicker={config.kicker}
      title={config.heading}
      productSlug={config.product_slug}
    />
  );
}

function ShowcaseWrapper({
  config,
}: {
  config: { kicker?: string; heading?: string; product_slugs?: string[] };
}) {
  const slugs = (config.product_slugs ?? []).filter(Boolean);
  const { data = [] } = useQuery(
    queryOptions({
      queryKey: ["dyn-showcase", slugs.join(",")],
      enabled: slugs.length > 0,
      staleTime: 5 * 60_000,
      queryFn: async () => {
        const { data } = await supabase
          .from("products")
          .select(LIST_COLS)
          .in("slug", slugs);
        const order = new Map(slugs.map((s, i) => [s, i]));
        return (data ?? []).sort(
          (a: any, b: any) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0),
        );
      },
    }),
  );
  if (data.length === 0) return null;
  return (
    <section className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-12 md:py-20">
      {(config.kicker || config.heading) && (
        <div className="mb-8 md:mb-12 text-center">
          {config.kicker && (
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              {config.kicker}
            </p>
          )}
          {config.heading && (
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              {config.heading}
            </h2>
          )}
        </div>
      )}
      <div
        className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {data.map((p: any) => (
          <div
            key={p.id}
            className="snap-start shrink-0 w-[70%] sm:w-[45%] md:w-[32%] lg:w-[24%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

function ProductGridSection({
  config,
}: {
  config: {
    heading?: string;
    kicker?: string;
    category?: string;
    category_slugs?: string[];
    product_slugs?: string[];
    limit?: number;
    layout?: "grid" | "slider";
    see_all_href?: string;
  };
}) {
  const limit = Math.max(2, Math.min(24, Number(config.limit) || 8));
  const productSlugs = (config.product_slugs ?? []).filter(Boolean);
  const categorySlugs = (config.category_slugs ?? []).filter(Boolean);
  const legacyCategory = config.category?.trim() || null;
  const allCategories =
    categorySlugs.length > 0
      ? categorySlugs
      : legacyCategory
      ? [legacyCategory]
      : [];
  const mode = productSlugs.length > 0 ? "picked" : "filter";
  const { data = [] } = useQuery(
    queryOptions({
      queryKey: [
        "dyn-grid",
        mode,
        productSlugs.join(","),
        allCategories.join(","),
        limit,
      ],
      staleTime: 5 * 60_000,
      queryFn: async () => {
        if (mode === "picked") {
          const { data } = await supabase
            .from("products")
            .select(LIST_COLS)
            .in("slug", productSlugs);
          const order = new Map(productSlugs.map((s, i) => [s, i]));
          return (data ?? []).sort(
            (a: any, b: any) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0),
          );
        }
        let q = supabase
          .from("products")
          .select(LIST_COLS)
          .order("product_level", { ascending: true })
          .order("sort_order", { ascending: true })
          .limit(limit);
        if (allCategories.length === 1) q = q.eq("category", allCategories[0]);
        else if (allCategories.length > 1) q = q.in("category", allCategories);
        const { data } = await q;
        return data ?? [];
      },
    }),
  );
  if (data.length === 0) return null;
  const isSlider = config.layout === "slider";
  const seeAll = config.see_all_href?.trim();
  return (
    <section className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-12 md:py-20">
      {(config.kicker || config.heading || (isSlider && seeAll)) && (
        <div
          className={`mb-8 md:mb-12 ${
            isSlider
              ? "flex items-end justify-between gap-4 text-left"
              : "text-center"
          }`}
        >
          <div>
            {config.kicker && (
              <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
                {config.kicker}
              </p>
            )}
            {config.heading && (
              <h2 className="font-display text-3xl md:text-5xl text-foreground">
                {config.heading}
              </h2>
            )}
          </div>
          {isSlider && seeAll && (
            <Link
              to={seeAll as any}
              className="shrink-0 inline-flex items-center gap-1.5 text-sm uppercase tracking-[0.18em] text-primary hover:underline"
            >
              See all <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}
      {isSlider ? (
        <div className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {data.map((p: any) => (
            <div
              key={p.id}
              className="snap-start shrink-0 w-[55%] sm:w-[38%] md:w-[28%] lg:w-[22%]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
          {data.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}

function RichTextSection({
  config,
}: {
  config: { heading?: string; body?: string; align?: "left" | "center" | "right" };
}) {
  const align = config.align ?? "center";
  const alignClass =
    align === "left" ? "text-left" : align === "right" ? "text-right" : "text-center mx-auto";
  return (
    <section className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-5xl py-14 md:py-20">
      <div className={`${alignClass} max-w-3xl`}>
        {config.heading ? (
          <h2 className="font-display text-3xl md:text-5xl text-foreground leading-tight">
            {config.heading}
          </h2>
        ) : null}
        {config.body ? (
          <p className="text-foreground/70 mt-5 text-base md:text-lg leading-relaxed whitespace-pre-line">
            {config.body}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ImageBannerSection({
  config,
}: {
  config: {
    image_url?: string;
    heading?: string;
    subheading?: string;
    cta_label?: string;
    cta_href?: string;
  };
}) {
  if (!config.image_url && !config.heading) return null;
  return (
    <section className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-10 md:py-16">
      <div className="relative overflow-hidden rounded-sm border border-border/70 bg-muted aspect-[16/9] md:aspect-[21/9]">
        {config.image_url ? (
          <img
            src={config.image_url}
            alt={config.heading ?? ""}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-transparent" />
        <div className="relative h-full flex flex-col justify-center p-8 sm:p-12 md:p-16 text-white max-w-2xl">
          {config.heading ? (
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl leading-[1.05]">
              {config.heading}
            </h2>
          ) : null}
          {config.subheading ? (
            <p className="mt-4 text-white/85 text-sm md:text-base max-w-md">
              {config.subheading}
            </p>
          ) : null}
          {config.cta_label && config.cta_href ? (
            <Link
              to={config.cta_href as any}
              className="mt-7 inline-flex items-center gap-2 self-start bg-white text-foreground px-6 py-3 text-sm uppercase tracking-[0.18em] hover:bg-white/90 transition"
            >
              {config.cta_label}
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}

class SectionErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: unknown) {
    console.error("DynamicSection render error", err);
  }
  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}
function CategoryGridSection({
  config,
}: {
  config: { heading?: string; kicker?: string; category_slugs?: string[] };
}) {
  const slugs = (config.category_slugs ?? []).filter(Boolean);
  if (slugs.length === 0) return null;
  return (
    <section className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-12 md:py-20">
      {(config.kicker || config.heading) && (
        <div className="mb-8 md:mb-12 text-center">
          {config.kicker && (
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              {config.kicker}
            </p>
          )}
          {config.heading && (
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              {config.heading}
            </h2>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
        {slugs.map((slug) => (
          <Link
            key={slug}
            to="/products"
            search={{ category: slug } as any}
            className="group relative flex items-center justify-center aspect-[4/3] rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition overflow-hidden"
          >
            <span className="font-display text-lg md:text-xl text-foreground group-hover:text-primary capitalize text-center px-4">
              {slug.replace(/-/g, " ")}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function TestimonialsBlock({
  config,
}: {
  config: {
    heading?: string;
    kicker?: string;
    items?: { name?: string; location?: string; quote?: string; image_url?: string }[];
  };
}) {
  const items = config.items ?? [];
  if (items.length === 0) return null;
  return (
    <section className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-12 md:py-20">
      {(config.kicker || config.heading) && (
        <div className="mb-8 md:mb-12 text-center">
          {config.kicker && (
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              {config.kicker}
            </p>
          )}
          {config.heading && (
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              {config.heading}
            </h2>
          )}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((t, i) => (
          <figure
            key={i}
            className="border border-border bg-card rounded-xl p-6 flex flex-col gap-4"
          >
            <blockquote className="text-foreground/80 leading-relaxed text-sm md:text-base">
              “{t.quote}”
            </blockquote>
            <figcaption className="flex items-center gap-3 mt-auto">
              {t.image_url ? (
                <img
                  src={t.image_url}
                  alt={t.name ?? ""}
                  className="w-10 h-10 rounded-full object-cover border border-border"
                  loading="lazy"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-muted" />
              )}
              <div>
                <div className="font-medium text-sm text-foreground">{t.name}</div>
                {t.location && (
                  <div className="text-xs text-foreground/60">{t.location}</div>
                )}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

function FaqBlock({
  config,
}: {
  config: { heading?: string; kicker?: string; items?: { q?: string; a?: string }[] };
}) {
  const items = config.items ?? [];
  const [open, setOpen] = useState<number | null>(0);
  if (items.length === 0) return null;
  return (
    <section className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-4xl py-12 md:py-20">
      {(config.kicker || config.heading) && (
        <div className="mb-8 md:mb-12 text-center">
          {config.kicker && (
            <p className="text-xs uppercase tracking-[0.25em] text-primary mb-3">
              {config.kicker}
            </p>
          )}
          {config.heading && (
            <h2 className="font-display text-3xl md:text-5xl text-foreground">
              {config.heading}
            </h2>
          )}
        </div>
      )}
      <div className="divide-y divide-border border-y border-border">
        {items.map((it, i) => {
          const isOpen = open === i;
          return (
            <div key={i}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="w-full flex items-center justify-between text-left py-4 md:py-5 gap-4"
              >
                <span className="font-display text-base md:text-lg text-foreground">
                  {it.q}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-foreground/60 transition-transform shrink-0 ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && it.a && (
                <p className="pb-5 text-foreground/70 leading-relaxed text-sm md:text-base whitespace-pre-line">
                  {it.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
