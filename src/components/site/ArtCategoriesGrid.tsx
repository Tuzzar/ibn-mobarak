import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { ART_CATEGORIES } from "@/data/artCatalog";

export function ArtCategoriesGrid() {
  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 sm:py-14">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-px w-6 bg-gold" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-gold">
              Curated Collections
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold font-display text-foreground tracking-tight">
            জনপ্রিয় আর্ট ক্যাটাগরি
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl">
            শিল্পচর্চা, ক্যালিগ্রাফি ও স্কেচিংয়ের প্রতিটি মাধ্যমের জন্য সেরা মানের অথেনটিক সরঞ্জাম
          </p>
        </div>

        <Link
          to="/products"
          className="inline-flex items-center gap-2 self-start sm:self-auto px-4 py-2 rounded-full border border-border/80 hover:border-gold hover:text-gold text-xs font-semibold transition-all bg-card/60 hover:bg-card shadow-2xs group shrink-0"
        >
          <span>সব ক্যাটাগরি দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Grid: 2 balanced rows of 5 cards on desktop, 3 on tablet, 2 on mobile */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 sm:gap-4 lg:gap-5">
        {ART_CATEGORIES.map((c) => (
          <Link
            key={c.id}
            to="/products"
            search={{ category: c.slug }}
            className="group relative flex flex-col items-center text-center p-4 sm:p-5 rounded-2xl bg-card border border-border/75 hover:border-gold/60 transition-all duration-300 hover:shadow-[0_12px_28px_-10px_oklch(0.22_0.04_155_/_0.15)] hover:-translate-y-1 overflow-hidden"
          >
            {/* Top gold hairline accent on hover */}
            <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-gold/0 to-transparent group-hover:via-gold/80 transition-all duration-500" />

            {/* Premium Arch / Soft Squircle Frame */}
            <div className="relative w-24 h-24 sm:w-26 sm:h-26 rounded-2xl overflow-hidden bg-muted/20 p-1.5 ring-1 ring-border/70 group-hover:ring-2 group-hover:ring-gold/60 transition-all duration-300 shrink-0 shadow-xs">
              <img
                src={c.image}
                alt={c.name}
                loading="lazy"
                className="w-full h-full object-cover rounded-xl group-hover:scale-108 transition-transform duration-500 ease-out"
              />
              <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-inset ring-black/5 dark:ring-white/5" />
            </div>

            {/* Text details */}
            <div className="mt-3.5 w-full flex flex-col items-center">
              <h3 className="font-display text-sm sm:text-[15px] font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                {c.bengali}
              </h3>
              <span className="mt-1 text-[11px] font-medium text-muted-foreground group-hover:text-foreground/75 transition-colors">
                {c.count}
              </span>

              {/* Classic hover arrow micro-interaction */}
              <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-gold opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                <span>কালেকশন দেখুন</span>
                <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
