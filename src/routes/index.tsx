import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowRight, Phone, Palette, MessageCircle, MapPin } from "lucide-react";
import {
  featuredProductsOptions,
  siteContentOptions,
  flashDealsProductsOptions,
  categoryShowcaseProductsOptions,
  suggestionsProductsOptions,
} from "@/lib/queries";
import { useContactInfo } from "@/lib/contact";
import { QuickCategoryBar } from "@/components/site/QuickCategoryBar";
import { ArtHeroSection } from "@/components/site/ArtHeroSection";
import { ArtTrustBadges } from "@/components/site/ArtTrustBadges";
import { ArtCategoriesGrid } from "@/components/site/ArtCategoriesGrid";
import { ArtFlashDealsSection } from "@/components/site/ArtFlashDealsSection";
import { TrendingArtProducts } from "@/components/site/TrendingArtProducts";
import { CalligraphySpotlightSection } from "@/components/site/CalligraphySpotlightSection";
import { ArtComboSpotlight } from "@/components/site/ArtComboSpotlight";
import { CanvasPaintsSpotlightSection } from "@/components/site/CanvasPaintsSpotlightSection";
import { SuggestionsForYouSection } from "@/components/site/SuggestionsForYouSection";
import { ArtistReviewsSection } from "@/components/site/ArtistReviewsSection";
import { FaqSection } from "@/components/site/FaqSection";
import { DynamicSections } from "@/components/site/DynamicSections";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.allSettled([
      context.queryClient.ensureQueryData(featuredProductsOptions()),
      context.queryClient.ensureQueryData(flashDealsProductsOptions(8)),
      context.queryClient.ensureQueryData(categoryShowcaseProductsOptions("calligraphy", 6)),
      context.queryClient.ensureQueryData(suggestionsProductsOptions("popular", 8)),
      context.queryClient.prefetchQuery(siteContentOptions()),
    ]);
  },
  component: Home,
  head: () => ({
    meta: [
      { title: "Ibn Mobarak Art Gallery — Premium Art & Calligraphy Supplies in Bangladesh" },
      {
        name: "description",
        content:
          "Ibn Mobarak Art Gallery — Explore professional artist paints, stretched canvases, calligraphy pens, easels, and exclusive art kits. Cash on delivery across Bangladesh.",
      },
      { property: "og:title", content: "Ibn Mobarak Art Gallery — Premium Art & Calligraphy Supplies" },
      { property: "og:description", content: "Art supplies, calligraphy kits, stretched canvas and paints delivered across Bangladesh." },
      { property: "og:url", content: "/" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "canonical", href: "/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Ibn Mobarak Art Gallery",
          potentialAction: {
            "@type": "SearchAction",
            target: "/products?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
});

function Home() {
  const { data: featured = [] } = useSuspenseQuery(featuredProductsOptions());
  const { data: contentData } = useQuery(siteContentOptions());
  const contact = useContactInfo();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const content = mounted ? contentData : undefined;

  // Visibility toggle helpers (matches admin Site Content visibility flags)
  const hide = (key: string) =>
    ((content as Record<string, string | undefined> | undefined)?.[key] ?? "") === "1";

  const showFaq = !hide("section_hidden_home_faq");

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Fast Category Pills Navigation */}
      <QuickCategoryBar />

      {/* 2. Main Hero Banner & Side Promo (ArtLab & Ahbab style) */}
      <ArtHeroSection />

      {/* 3. Trust Badges (Delivery, Originality, Bubble-wrap packing, Support) */}
      <ArtTrustBadges />

      {/* 4. Circular / Visual Art Categories Grid (Ahbab Our Collection) */}
      <ArtCategoriesGrid />

      {/* 5. Special Flash Deals with Live Countdown Timer (Ahbab Style) */}
      <ArtFlashDealsSection />

      {/* 6. Trending Art Products with Category Filter Tabs (Ahbab Discover Premium) */}
      <TrendingArtProducts dbProducts={featured} />

      {/* 7. Special Category Spotlight 1: Islamic Calligraphy Corner */}
      <CalligraphySpotlightSection />

      {/* 8. Special Mega Combo Spotlight Section */}
      <ArtComboSpotlight />

      {/* 9. Special Category Spotlight 2: Canvas, Paints & Easels Showcase */}
      <CanvasPaintsSpotlightSection />

      {/* 10. Suggestions For You / Artist Recommendations Grid (Ahbab Style) */}
      <SuggestionsForYouSection />

      {/* 11. Artist Customer Reviews & Social Proof */}
      <ArtistReviewsSection />

      {/* 12. Art Store FAQ Section */}
      {showFaq && (
        <div className="bg-section-a">
          <FaqSection />
        </div>
      )}

      {/* 13. Dynamic Sections if configured in admin */}
      <DynamicSections />

      {/* 11. Studio Showcase & Contact CTA */}
      <section className="container mx-auto px-4 sm:px-6 max-w-7xl py-12 md:py-16">
        <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-primary p-6 sm:p-10 lg:p-12 text-primary-foreground relative overflow-hidden shadow-2xl border border-gold/30">
          {/* Subtle decorative glow */}
          <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-accent/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -top-20 w-80 h-80 bg-gold/15 rounded-full blur-2xl pointer-events-none" />

          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Left Content */}
            <div className="lg:col-span-7">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gold/20 text-gold text-xs font-semibold uppercase tracking-wider mb-4 border border-gold/30">
                <Palette className="w-3.5 h-3.5" />
                ফিজিক্যাল স্টুডিও ও কাস্টম আর্ট হাব
              </span>
              <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
                আপনার পছন্দের ক্যানভাস, কালার ও ক্যালিগ্রাফি ফ্রেম — এক ছাদের নিচে
              </h2>
              <p className="mt-4 text-primary-foreground/85 text-sm sm:text-base leading-relaxed">
                ইবনে মোবারক আর্ট গ্যালারিতে পাবেন প্রিমিয়াম অ্যাক্রিলিক কালার, ক্যানভাস বোর্ড, ইজেল এবং মনকাড়া ক্যালিগ্রাফি আর্টওয়ার্ক। সরাসরি স্টুডিওতে এসে বাছাই করতে পারেন কিংবা অনলাইন থেকে সহজে অর্ডার করুন।
              </p>

              {/* Badges / Address */}
              <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-primary-foreground/80">
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <MapPin className="w-4 h-4 text-gold shrink-0" />
                  <span>{contact.address}</span>
                </div>
                <div className="inline-flex items-center gap-2 bg-white/10 px-3.5 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span>হটলাইন: {contact.phone}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3.5">
                <Link
                  to="/products"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gold text-gold-foreground font-bold text-sm hover:brightness-105 shadow-md transition-all"
                >
                  <span>কালেকশন দেখুন</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href={contact.whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp এ চ্যাট করুন</span>
                </a>
                <Link
                  to="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium text-sm border border-white/20 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span>স্টুডিও লোকেশন</span>
                </Link>
              </div>
            </div>

            {/* Right Studio Photo Card */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border-2 border-gold/40 shadow-xl relative group bg-black/40">
                <img
                  src="/studio.jpg"
                  alt="Ibn Mobarak Art Gallery Studio & Workspace"
                  className="w-full h-64 sm:h-72 lg:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <div className="flex items-center gap-2 text-gold text-xs font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-gold" />
                    Physical Gallery & Workshop
                  </div>
                  <p className="text-white text-sm font-medium mt-1">
                    ক্যানভাস, কালার ও ক্যালিগ্রাফি আর্টওয়ার্ক কালেকশন
                  </p>
                  <p className="text-white/70 text-xs mt-0.5">
                    ৪৩,০০০+ ফলোয়ার্স · ১০০% রেকমেন্ডেশন
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
