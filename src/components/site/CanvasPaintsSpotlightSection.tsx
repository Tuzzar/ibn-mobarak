import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Palette, ArrowRight } from "lucide-react";
import { categoryShowcaseProductsOptions } from "@/lib/queries";
import { ProductCard } from "./ProductCard";

const SUB_TABS = [
  { id: "canvas", label: "🖼️ ক্যানভাস ও বোর্ড" },
  { id: "paints", label: "🎨 কালার ও পেইন্টস" },
  { id: "brushes", label: "🖌️ প্রফেশনাল ব্রাশ" },
  { id: "easels", label: "🪵 ইজেল ও ডিসপ্লে স্ট্যান্ড" },
];

export function CanvasPaintsSpotlightSection() {
  const [activeCategory, setActiveCategory] = useState("canvas");
  const { data: products = [] } = useQuery(categoryShowcaseProductsOptions(activeCategory, 8));

  return (
    <section className="bg-card/50 border-y border-border/80 py-10 md:py-14">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Palette className="w-3.5 h-3.5" />
              <span>পেইন্টিং ও আর্ট স্টুডিও</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground">
              ক্যানভাস, অ্যাক্রিলিক কালার ও আর্ট টুলস
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              মন্ট মার্তে, ম্যারিজ, ক্যামেল ও জর্জিওন ব্যান্ডের অরিজিনাল কালার ও ক্যানভাস
            </p>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SUB_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  activeCategory === tab.id
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "bg-card border border-border/80 text-foreground/75 hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid: 8 Items */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {products.slice(0, 8).map((product, idx) => (
            <ProductCard key={product.id} product={product} priority={idx < 2} />
          ))}
        </div>

        {/* Bottom Explorer Link */}
        <div className="mt-8 text-center">
          <Link
            to="/products"
            search={{ category: activeCategory }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs sm:text-sm font-bold transition-all"
          >
            <span>এই ক্যাটেগরির সব পণ্য দেখুন</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
