import { Star, CheckCircle } from "lucide-react";
import { ARTIST_TESTIMONIALS } from "@/data/artCatalog";
import { useState, useRef } from "react";

export function ArtistReviewsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    if (clientWidth > 0) {
      const idx = Math.round(scrollLeft / (clientWidth * 0.84));
      setActiveIndex(Math.min(Math.max(0, idx), ARTIST_TESTIMONIALS.length - 1));
    }
  };

  const scrollTo = (idx: number) => {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.clientWidth * 0.84 + 16;
    scrollRef.current.scrollTo({ left: idx * cardWidth, behavior: "smooth" });
    setActiveIndex(idx);
  };

  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-10 md:py-14">
      <div className="text-center max-w-2xl mx-auto mb-6 md:mb-8">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          গ্রাহক ও শিল্পীদের অভিজ্ঞতা
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground mt-1">
          বিশ্বস্ততার সাথে পৌঁছে দিচ্ছি আর্টের আনন্দ
        </h2>
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex md:grid overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none md:grid-cols-3 gap-4 sm:gap-6 pb-2 md:pb-0 -mx-4 px-4 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {ARTIST_TESTIMONIALS.map((review) => (
          <div
            key={review.id}
            className="w-[84vw] max-w-[340px] md:w-auto md:max-w-none shrink-0 md:shrink snap-center p-5 sm:p-6 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between relative group hover:border-primary/40 transition-colors"
          >
            <div>
              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-foreground/85 leading-relaxed italic whitespace-normal break-words">
                "{review.content}"
              </p>
            </div>

            {/* Author */}
            <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-xs sm:text-sm text-foreground">
                  {review.name}
                </h4>
                <p className="text-[11px] text-muted-foreground">{review.role}</p>
              </div>

              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>Verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Pagination Indicator Dots */}
      <div className="flex md:hidden items-center justify-center gap-2 mt-4">
        {ARTIST_TESTIMONIALS.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => scrollTo(i)}
            aria-label={`Go to review ${i + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-6 bg-primary"
                : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
