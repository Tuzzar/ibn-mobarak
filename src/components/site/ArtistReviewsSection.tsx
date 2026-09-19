import { Star, CheckCircle, Quote } from "lucide-react";
import { ARTIST_TESTIMONIALS } from "@/data/artCatalog";

export function ArtistReviewsSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-12">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent">
          গ্রাহক ও শিল্পীদের অভিজ্ঞতা
        </span>
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display text-foreground mt-1">
          বিশ্বস্ততার সাথে পৌঁছে দিচ্ছি আর্টের আনন্দ
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2">
          সারা বাংলাদেশ থেকে হাজারো শিল্পী, ক্যালিগ্রাফার এবং চারুকলার শিক্ষার্থীদের প্রথম পছন্দ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {ARTIST_TESTIMONIALS.map((review) => (
          <div
            key={review.id}
            className="p-6 rounded-2xl bg-card border border-border/80 shadow-xs flex flex-col justify-between relative group hover:border-primary/40 transition-colors"
          >
            <div>
              {/* Stars */}
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-xs sm:text-sm text-foreground/80 leading-relaxed italic">
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

              <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>Verified</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
