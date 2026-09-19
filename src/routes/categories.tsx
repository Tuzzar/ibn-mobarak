import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  ChevronRight,
  Palette,
  Brush,
  Frame,
  BookOpen,
  Pencil,
  Feather,
  Layers,
  Maximize,
  Gem,
  PackagePlus,
  ArrowRight,
  Tag,
} from "lucide-react";
import { MASTER_ART_CATEGORIES } from "@/data/artCategories";
import { activeMenuTreeOptions, type MenuCategoryNode } from "@/lib/menu-categories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
  head: () => ({
    meta: [
      { title: "সকল ক্যাটাগরি — Ibn Mobarak Art Gallery" },
      {
        name: "description",
        content:
          "Ibn Mobarak Art Gallery-এর সম্পূর্ণ ক্যাটাগরি তালিকা — কালার, ব্রাশ, ক্যানভাস, ক্যালিগ্রাফি সাপ্লাইজ, ইজেল ও ফ্রেমের বিশাল সংগ্রহ।",
      },
      { property: "og:title", content: "সকল ক্যাটাগরি — Ibn Mobarak Art Gallery" },
      {
        property: "og:description",
        content: "আপনার সৃজনশীল কাজের জন্য প্রয়োজনীয় সব আর্ট ও ক্যালিগ্রাফি সামগ্রী।",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/categories" }],
  }),
});

const ICON_MAP: Record<string, any> = {
  Palette,
  Brush,
  Frame,
  BookOpen,
  Pencil,
  Feather,
  Layers,
  Maximize,
  Gem,
  PackagePlus,
};

function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: dbTree } = useQuery(activeMenuTreeOptions());

  // Merge MASTER_ART_CATEGORIES with any database tree
  const categories = useMemo(() => {
    return MASTER_ART_CATEGORIES;
  }, []);

  const filteredCategories = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return categories;

    return categories.filter((cat) => {
      const matchMain =
        cat.name.toLowerCase().includes(q) ||
        cat.bengali.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q);
      const matchSub = cat.subcategories.some(
        (sub) =>
          sub.name.toLowerCase().includes(q) ||
          sub.bengali.toLowerCase().includes(q),
      );
      return matchMain || matchSub;
    });
  }, [categories, searchTerm]);

  return (
    <div className="min-h-screen bg-background pb-28 lg:pb-20">
      {/* Header Banner */}
      <section className="relative overflow-hidden bg-section-a border-b border-gold/20 py-8 md:py-12">
        <div className="container mx-auto max-w-7xl px-4 sm:px-6">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-primary transition-colors">হোম</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-foreground font-medium">ক্যাটাগরি সমূহ</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="inline-block text-[11px] uppercase tracking-[0.24em] font-semibold text-gold mb-2">
                Curated Collections
              </span>
              <h1
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-primary"
                style={{ fontFamily: "'Tiro Bangla', serif" }}
              >
                আর্ট ও ক্যালিগ্রাফি ক্যাটাগরি
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
                পেশাদার শিল্পী, ক্যালিগ্রাফার এবং শিক্ষার্থীদের জন্য ১০০% অথেনটিক মেটেরিয়ালস ও বিশেষায়িত আর্ট সামগ্রী।
              </p>
            </div>

            {/* Quick Search */}
            <div className="w-full md:w-80 relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ক্যাটাগরি খুঁজুন (যেমন: ক্যানভাস, কালার)..."
                className="w-full rounded-full border border-gold/30 bg-background/90 px-4 py-2.5 pl-10 text-xs sm:text-sm placeholder:text-muted-foreground/70 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 transition-all"
              />
              <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground hover:text-foreground"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto max-w-7xl px-4 sm:px-6 pt-8 md:pt-12">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-20 bg-section-a/50 rounded-2xl border border-dashed border-border/80 p-8">
            <Tag className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              কোনো ক্যাটাগরি পাওয়া যায়নি
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              "{searchTerm}" দিয়ে কোনো ক্যাটাগরি মেলেনি। অন্য শব্দ লিখে খুঁজুন।
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              className="mt-4 inline-flex items-center text-xs font-semibold text-primary underline underline-offset-4"
            >
              সকল ক্যাটাগরি দেখুন
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {filteredCategories.map((cat) => {
              const IconComp = ICON_MAP[cat.iconName] || Palette;

              return (
                <div
                  key={cat.id}
                  className="group relative flex flex-col rounded-2xl border border-gold/25 bg-background shadow-[0_4px_24px_-10px_oklch(0.22_0.04_155/0.12)] hover:border-gold/60 hover:shadow-[0_12px_32px_-12px_oklch(0.22_0.04_155/0.22)] transition-all duration-300 overflow-hidden"
                >
                  {/* Category Image Header */}
                  <Link
                    to="/products"
                    search={{ category: cat.slug, q: "" }}
                    className="relative block aspect-[16/9] w-full overflow-hidden bg-section-a"
                  >
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-md border border-gold/30 text-[11px] font-semibold text-primary shadow-sm">
                        <IconComp className="w-3.5 h-3.5 text-gold" />
                        <span>{cat.count}</span>
                      </span>
                    </div>

                    {/* Bottom Title on Image */}
                    <div className="absolute bottom-3 inset-x-4">
                      <h2
                        className="text-lg sm:text-xl font-bold text-white drop-shadow-md tracking-tight"
                        style={{ fontFamily: "'Tiro Bangla', serif" }}
                      >
                        {cat.bengali}
                      </h2>
                      <p className="text-[11px] text-white/80 font-medium tracking-wide uppercase">
                        {cat.name}
                      </p>
                    </div>
                  </Link>

                  {/* Body Content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {cat.description}
                      </p>

                      {/* Subcategories Chips */}
                      {cat.subcategories && cat.subcategories.length > 0 && (
                        <div className="mt-3.5 pt-3 border-t border-border/50">
                          <span className="block text-[10px] uppercase tracking-[0.2em] font-semibold text-gold/90 mb-2">
                            সাব-ক্যাটাগরি
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {cat.subcategories.slice(0, 6).map((sub) => (
                              <Link
                                key={sub.id}
                                to="/products"
                                search={{ category: sub.slug, q: "" }}
                                className="inline-flex items-center text-[11px] px-2.5 py-1 rounded-full bg-section-a text-foreground/80 hover:bg-primary/10 hover:text-primary hover:border-gold/40 border border-border/60 transition-colors"
                              >
                                {sub.bengali}
                              </Link>
                            ))}
                            {cat.subcategories.length > 6 && (
                              <Link
                                to="/products"
                                search={{ category: cat.slug, q: "" }}
                                className="inline-flex items-center text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground hover:text-foreground transition-colors font-medium"
                              >
                                +{cat.subcategories.length - 6} আরও
                              </Link>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer CTA */}
                    <Link
                      to="/products"
                      search={{ category: cat.slug, q: "" }}
                      className="inline-flex items-center justify-between w-full pt-3 mt-1 border-t border-border/60 text-xs font-semibold text-primary hover:text-primary/80 transition-colors group-hover:translate-x-0.5"
                    >
                      <span>সকল {cat.bengali} দেখুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
