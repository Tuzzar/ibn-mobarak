import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flame, ArrowRight, Clock } from "lucide-react";
import { flashDealsProductsOptions } from "@/lib/queries";
import { ProductCard } from "./ProductCard";

export function ArtFlashDealsSection() {
  const { data: deals = [] } = useQuery(flashDealsProductsOptions(8));

  // Live countdown timer (simulating daily flash deal cycles)
  const [timeLeft, setTimeLeft] = useState({ hours: 7, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 11, minutes: 59, seconds: 59 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDigits = (n: number) => n.toString().padStart(2, "0");

  if (!deals || deals.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-amber-500/[0.04] via-card to-background border-y border-amber-500/20 py-8 md:py-12 relative overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
        {/* Header with Title + Countdown Timer */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 md:mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Flame className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>ফ্ল্যাশ ডিল ও ছাড়</span>
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground">
              সীমিত সময়ের বিশেষ ডিসকাউন্ট
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              স্টক শেষ হওয়ার আগেই আপনার পছন্দের আর্ট সামগ্রী সংগ্রহ করুন
            </p>
          </div>

          {/* Right Side: Countdown Timer & View All */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 bg-card border border-amber-500/30 shadow-xs px-3.5 py-2 rounded-2xl">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground mr-1">অফার শেষ হতে বাকি:</span>
              <div className="flex items-center gap-1 font-mono text-xs sm:text-sm font-bold text-foreground">
                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  {formatDigits(timeLeft.hours)}
                </span>
                <span>:</span>
                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  {formatDigits(timeLeft.minutes)}
                </span>
                <span>:</span>
                <span className="bg-amber-500/15 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded">
                  {formatDigits(timeLeft.seconds)}
                </span>
              </div>
            </div>

            <Link
              to="/products"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-amber-600 transition-colors"
            >
              <span>সকল অফার দেখুন</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Product Grid (Responsive: 2 on mobile, 3 on tablet, 4 on desktop) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
          {deals.slice(0, 8).map((product, idx) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={idx < 2}
            />
          ))}
        </div>

        {/* Mobile View All button */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-card border border-amber-500/40 text-primary text-xs font-bold shadow-xs hover:bg-muted"
          >
            <span>সব ফ্ল্যাশ ডিল দেখুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
