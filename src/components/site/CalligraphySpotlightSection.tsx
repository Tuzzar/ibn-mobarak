import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Feather, ArrowRight, CheckCircle2 } from "lucide-react";
import { categoryShowcaseProductsOptions } from "@/lib/queries";
import { ProductCard } from "./ProductCard";

import { DEMO_ART_PRODUCTS } from "@/data/artCatalog";

export function CalligraphySpotlightSection() {
  const { data: dbProducts = [] } = useQuery(categoryShowcaseProductsOptions("calligraphy", 6));
  const products =
    dbProducts.length > 0
      ? dbProducts
      : DEMO_ART_PRODUCTS.filter((p) => p.category === "calligraphy");

  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 md:py-14">
      {/* Section Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 mb-6 md:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-2">
            <Feather className="w-3.5 h-3.5" />
            <span>ক্যালিগ্রাফি কর্নার</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground">
            ইসলামিক ক্যালিগ্রাফি ও হ্যান্ড-লেটারিং সামগ্রী
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            হাতে তৈরি হেন্দাম ও জাভা কলম, পাইলট প্যারালাল পেন, লিকা, দাওয়াত ও স্পেশাল ক্যালিগ্রাফি পেপার
          </p>
        </div>

        <Link
          to="/products"
          search={{ category: "calligraphy" }}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-primary hover:text-accent transition-colors"
        >
          <span>সব ক্যালিগ্রাফি সামগ্রী দেখুন</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Grid: 1 Editorial Banner + 6 Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Feature Promo Card (Ahbab Style) */}
        <div className="lg:col-span-4 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-primary text-white p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden border border-gold/30 shadow-md">
          {/* Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-52 h-52 bg-gold/15 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-52 h-52 bg-accent/20 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-gold/20 text-gold text-[11px] font-bold uppercase tracking-wider mb-4 border border-gold/30">
              Traditional Islamic Art
            </span>
            <h3 className="font-display text-2xl sm:text-3xl font-bold leading-snug">
              খাত ও ক্যালিগ্রাফি শিল্পীদের সেরা পছন্দ
            </h3>
            <p className="mt-3 text-white/80 text-xs sm:text-sm leading-relaxed">
              সুলুস, নাসখ ও কুফি ক্যালিগ্রাফির জন্য নিখুঁত কাটের কলম এবং স্মুথ আর্ট কালি।
            </p>

            {/* Micro feature pills */}
            <ul className="mt-5 space-y-2.5 text-xs text-white/90">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span>অরিজিনাল পাইলট প্যারালাল ও নিব সেট</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span>প্রফেশনাল ব্ল্যাক ও গোল্ডেন ক্যালিগ্রাফি ইঙ্ক</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span>মুকাশশা ও গ্লসি প্র্যাকটিস পেপার</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 pt-6 border-t border-white/15 relative z-10">
            <Link
              to="/products"
              search={{ category: "calligraphy" }}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-gold text-gold-foreground font-bold text-xs sm:text-sm hover:brightness-105 transition-all shadow-md"
            >
              <span>কালেকশন এক্সপ্লোর করুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Product Grid: 6 Items (Horizontal swipe on mobile, 3 cols on desktop) */}
        <div className="lg:col-span-8 flex sm:grid overflow-x-auto sm:overflow-visible snap-x snap-mandatory sm:snap-none sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 pb-3 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {products.slice(0, 6).map((product) => (
            <div key={product.id} className="min-w-[210px] max-w-[250px] w-[66vw] sm:w-auto sm:min-w-0 sm:max-w-none snap-start shrink-0 sm:shrink">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
