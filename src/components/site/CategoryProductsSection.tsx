import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { categoryProductsOptions } from "@/lib/queries";

type Props = {
  category: string;
  eyebrow?: string;
  title?: string;
  className?: string;
};

export function CategoryProductsSection({
  category,
  eyebrow = "Popular Category",
  title,
  className = "bg-section-b",
}: Props) {
  const { data: items = [] } = useQuery(categoryProductsOptions(category));

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows, items.length]);

  const scrollByCard = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 24 : el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  if (items.length === 0) return null;

  const heading = title ?? `Best of ${category}`;

  return (
    <section className={className}>
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-6 md:py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-6 md:mb-10">
          <div className="max-w-xl">
            <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-gold">
              {eyebrow}
            </span>
            <h2 className="font-display text-[1.25rem] md:text-3xl text-primary-foreground mt-2 md:mt-3 leading-[1.15]">
              {heading}
            </h2>
          </div>
          <Link
            to="/products"
            search={{ category }}
            className="self-start md:self-auto inline-flex items-center gap-2 text-sm font-medium text-primary-foreground border-b border-primary-foreground/40 pb-1 hover:border-gold transition"
          >
            View all {category} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="relative group/carousel">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Previous products"
            disabled={!canPrev}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 w-11 h-11 rounded-full bg-background/95 backdrop-blur border border-border shadow-lg items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Next products"
            disabled={!canNext}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-11 h-11 rounded-full bg-background/95 backdrop-blur border border-border shadow-lg items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            ref={scrollerRef}
            className="flex gap-3 sm:gap-5 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-3 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-2 lg:px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [-webkit-overflow-scrolling:touch] [overscroll-behavior-x:contain]"
          >
            {items.map((p, i) => (
              <div
                key={p.id}
                data-card
                className="snap-start shrink-0 w-[calc(50%-0.375rem)] sm:w-[44%] md:w-[33%] lg:w-[24%]"
              >
                <ProductCard product={p} priority={i < 4} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}