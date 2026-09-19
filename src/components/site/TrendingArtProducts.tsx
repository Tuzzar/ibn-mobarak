import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Flame } from "lucide-react";
import { ProductCard } from "./ProductCard";
import { DEMO_ART_PRODUCTS } from "@/data/artCatalog";
import { categoryShowcaseProductsOptions } from "@/lib/queries";

type Props = {
  dbProducts?: any[];
};

const FILTER_TABS = [
  { id: "all", label: "সব প্রোডাক্টস" },
  { id: "paints", label: "🎨 কালার ও পেইন্টস" },
  { id: "brushes", label: "🖌️ ব্রাশ ও টুলস" },
  { id: "canvas", label: "🖼️ ক্যানভাস ও বোর্ড" },
  { id: "calligraphy", label: "✒️ ক্যালিগ্রাফি" },
  { id: "drawing", label: "✏️ ড্রয়িং ও স্কেচিং" },
];

export function TrendingArtProducts({ dbProducts }: Props) {
  const [activeTab, setActiveTab] = useState("all");

  // Query specific category when not "all"
  const { data: categoryData } = useQuery({
    ...categoryShowcaseProductsOptions(activeTab, 8),
    enabled: activeTab !== "all",
  });

  const allItems: any[] =
    dbProducts && dbProducts.length > 0 ? dbProducts : DEMO_ART_PRODUCTS;

  const displayItems =
    activeTab === "all"
      ? allItems
      : categoryData && categoryData.length > 0
        ? categoryData
        : allItems.filter((p) => p.category === activeTab);

  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-8">
      {/* Section Header with Tabs */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
            <Flame className="w-3.5 h-3.5" />
            বেস্ট সেলিং আর্ট কিটস
          </span>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground mt-0.5">
            শিল্পী ও ক্রাফটারদের পছন্দের তালিকা
          </h2>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-card border border-border/80 text-foreground/75 hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {displayItems.slice(0, 8).map((product, idx) => (
          <ProductCard
            key={product.id}
            product={product}
            priority={idx < 4}
          />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:bg-primary/90 shadow-sm transition-all"
        >
          <span>সকল আর্ট সামগ্রী দেখুন</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
