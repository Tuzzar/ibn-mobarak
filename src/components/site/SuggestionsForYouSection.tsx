import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";
import { suggestionsProductsOptions } from "@/lib/queries";
import { ProductCard } from "./ProductCard";

type SuggestionTab = "popular" | "new" | "budget";

const TABS: { id: SuggestionTab; label: string }[] = [
  { id: "popular", label: "🔥 সর্বাধিক বিক্রিত (Best Sellers)" },
  { id: "new", label: "✨ নতুন আগমন (New Arrivals)" },
  { id: "budget", label: "🏷️ বাজেট ফ্রেন্ডলি (Under ৳500)" },
];

export function SuggestionsForYouSection() {
  const [activeTab, setActiveTab] = useState<SuggestionTab>("popular");
  const { data: products = [] } = useQuery(suggestionsProductsOptions(activeTab, 8));

  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 md:py-14">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 md:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-bold uppercase tracking-wider mb-2">
            <span>আপনার জন্য রিকমেন্ডেড</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground">
            শিল্পীদের জন্য বিশেষ বাছাই
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            দৈনন্দিন প্র্যাকটিস, প্রজেক্ট ও উপহারের জন্য সেরা সামগ্রীসমূহ
          </p>
        </div>

        {/* Suggestion Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
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

      {/* 8 Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        {products.slice(0, 8).map((product, idx) => (
          <ProductCard key={product.id} product={product} priority={idx < 2} />
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-card border border-primary/30 hover:border-primary text-primary font-bold text-xs sm:text-sm shadow-xs transition-all"
        >
          <span>আমাদের সম্পূর্ণ ৩,৯০০+ আর্ট ক্যাটালগ দেখুন</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
