import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useRef, useEffect } from "react";
import {
  Search,
  LayoutGrid,
  ChevronRight,
  ArrowRight,
  Flame,
  PackagePlus,
  Palette,
  Brush,
  Frame,
  BookOpen,
  Pencil,
  Feather,
  Layers,
  Maximize,
  Gem,
  Tag,
  X,
  Compass,
} from "lucide-react";
import {
  MASTER_ART_CATEGORIES,
  getSubcategoryImage,
  type MasterCategory,
  type SubCategory,
} from "@/data/artCategories";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
  head: () => ({
    meta: [
      { title: "ক্যাটাগরি সমূহ (Categories) — Ibn Mobarak Art Gallery" },
      {
        name: "description",
        content:
          "Ibn Mobarak Art Gallery-এর সম্পূর্ণ ক্যাটাগরি তালিকা — অ্যাক্রিলিক, ব্রাশ, ক্যানভাস, ক্যালিগ্রাফি সামগ্রী ও আর্ট টুলস কালেকশন।",
      },
      { property: "og:title", content: "ক্যাটাগরি সমূহ — Ibn Mobarak Art Gallery" },
      {
        property: "og:description",
        content: "আপনার সৃজনশীল কাজের জন্য প্রয়োজনীয় সব আর্ট ও ক্যালিগ্রাফি সামগ্রী।",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://ibnmobarakartgallery.com/categories" }],
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

// Quick promotion pills at top
const QUICK_TAGS = [
  { label: "সকল বিভাগ", categorySlug: "all", icon: Compass },
  { label: "কালার ও পেইন্টস", categorySlug: "paints", icon: Palette },
  { label: "ব্রাশ ও টুলস", categorySlug: "brushes", icon: Brush },
  { label: "ক্যানভাস ও বোর্ড", categorySlug: "canvas", icon: Frame },
  { label: "কাগজ ও স্কেচবুক", categorySlug: "paper-sketch", icon: BookOpen },
  { label: "ড্রয়িং ও স্কেচিং", categorySlug: "drawing", icon: Pencil },
  { label: "ক্যালিগ্রাফি", categorySlug: "calligraphy", icon: Feather },
  { label: "কম্বো সেট", categorySlug: "combos", icon: PackagePlus },
];

function CategoriesPage() {
  const [selectedSlug, setSelectedSlug] = useState<string>("paints");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const rightPanelRef = useRef<HTMLDivElement>(null);

  // Instant scroll to top when category changes
  useEffect(() => {
    if (rightPanelRef.current) {
      rightPanelRef.current.scrollTop = 0;
    }
  }, [selectedSlug]);

  const activeCategory = useMemo(() => {
    if (selectedSlug === "all") return null;
    return (
      MASTER_ART_CATEGORIES.find((c) => c.slug === selectedSlug) ??
      MASTER_ART_CATEGORIES[0]
    );
  }, [selectedSlug]);

  // Live filter if searching
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    const matchedSubs: Array<{ parent: MasterCategory; sub: SubCategory }> = [];
    MASTER_ART_CATEGORIES.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        if (
          sub.name.toLowerCase().includes(q) ||
          sub.bengali.toLowerCase().includes(q) ||
          cat.name.toLowerCase().includes(q) ||
          cat.bengali.toLowerCase().includes(q)
        ) {
          matchedSubs.push({ parent: cat, sub });
        }
      });
    });
    return matchedSubs;
  }, [searchQuery]);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-background">
      {/* Top Search & Filter Bar */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-gold/20 px-3 sm:px-6 py-2.5 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Page Title & Breadcrumb */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="text-xs text-muted-foreground hover:text-primary transition-colors"
            >
              হোম
            </Link>
            <span className="text-xs text-muted-foreground/50">/</span>
            <span className="text-xs font-semibold text-primary">ক্যাটাগরি সমূহ</span>
          </div>

          {/* Instant Search Bar */}
          <div className="flex items-center gap-2.5 flex-1 max-w-md self-stretch sm:self-auto">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="আর্ট ও ক্যালিগ্রাফি সামগ্রী খুঁজুন..."
                className="w-full h-9 rounded-full border border-gold/30 bg-section-a/70 px-3 pl-9 text-xs placeholder:text-muted-foreground/70 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40 transition-all"
              />
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filter Horizontal Scroll Pills on Tablet/Desktop */}
          <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {QUICK_TAGS.slice(0, 6).map((tag, idx) => {
              const IconComp = tag.icon;
              const isActive =
                tag.categorySlug && selectedSlug === tag.categorySlug && !searchQuery;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    if (tag.categorySlug) setSelectedSlug(tag.categorySlug);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer",
                    isActive
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "border border-border/70 bg-background text-foreground/80 hover:border-gold/60 hover:text-primary",
                  )}
                >
                  <IconComp className={cn("w-3 h-3", isActive ? "text-gold" : "text-muted-foreground")} />
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Dual-Panel Content Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-6 py-3 lg:py-6">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-8 items-start">
          {/* LEFT SIDEBAR: Primary Category Navigator */}
          <aside
            aria-label="Category Navigation"
            className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-16 rounded-2xl lg:rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden"
          >
            {/* Sidebar Header on Desktop */}
            <div className="hidden lg:flex items-center justify-between px-5 py-3.5 border-b border-border/60 bg-section-a/60">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-gold" />
                <span
                  className="font-bold text-sm text-foreground"
                  style={{ fontFamily: "'Tiro Bangla', serif" }}
                >
                  সকল বিভাগ
                </span>
              </div>
              <span className="text-[11px] font-semibold text-muted-foreground px-2 py-0.5 rounded-full bg-background border border-border/60">
                {MASTER_ART_CATEGORIES.length}টি ক্যাটাগরি
              </span>
            </div>

            {/* Category Navigation Items */}
            <div className="flex lg:flex-col overflow-x-auto lg:overflow-x-visible no-scrollbar p-1.5 lg:p-2.5 gap-1 lg:gap-1.5 lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto">
              {/* "ALL" Overview Item */}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedSlug("all");
                }}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2 sm:py-2.5 rounded-xl lg:rounded-2xl transition-all duration-150 cursor-pointer shrink-0 lg:shrink text-left w-auto lg:w-full",
                  selectedSlug === "all" && !searchQuery
                    ? "bg-primary text-primary-foreground font-bold shadow-sm"
                    : "text-foreground/75 hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 lg:w-9 lg:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    selectedSlug === "all" && !searchQuery
                      ? "bg-primary-foreground/15 text-gold"
                      : "bg-muted/60 text-foreground/70 group-hover:text-primary",
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </div>

                <div className="hidden lg:flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-bold truncate">সকল বিভাগ ওভারভিউ</span>
                  <span
                    className={cn(
                      "text-[10.5px] truncate",
                      selectedSlug === "all" && !searchQuery
                        ? "text-primary-foreground/70"
                        : "text-muted-foreground",
                    )}
                  >
                    সব ক্যাটাগরি একসাথে দেখুন
                  </span>
                </div>

                <span className="lg:hidden text-xs font-bold whitespace-nowrap">
                  ALL
                </span>

                <ChevronRight
                  className={cn(
                    "hidden lg:block w-3.5 h-3.5 shrink-0 transition-transform",
                    selectedSlug === "all" && !searchQuery
                      ? "text-gold translate-x-0.5"
                      : "text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5",
                  )}
                />
              </button>

              {/* Master Category Items */}
              {MASTER_ART_CATEGORIES.map((cat) => {
                const isSelected = selectedSlug === cat.slug && !searchQuery;
                const IconComp = ICON_MAP[cat.iconName] || Palette;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSlug(cat.slug);
                    }}
                    className={cn(
                      "group relative flex items-center gap-2.5 lg:gap-3 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl lg:rounded-2xl transition-all duration-150 cursor-pointer shrink-0 lg:shrink text-left w-auto lg:w-full",
                      isSelected
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-foreground/80 hover:bg-muted/70 hover:text-foreground",
                    )}
                  >
                    {/* Category Thumbnail / Icon */}
                    <div
                      className={cn(
                        "w-8 h-8 lg:w-9 lg:h-9 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-0.5 transition-all",
                        isSelected
                          ? "ring-1 ring-gold bg-primary-foreground/10"
                          : "bg-muted/70 group-hover:bg-muted border border-border/50",
                      )}
                    >
                      {cat.image ? (
                        <img
                          src={cat.image}
                          alt={cat.name}
                          loading="lazy"
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <IconComp
                          className={cn(
                            "w-4 h-4",
                            isSelected ? "text-gold" : "text-primary/80",
                          )}
                        />
                      )}
                    </div>

                    {/* Category Title & Count (Full text on Desktop) */}
                    <div className="hidden lg:flex flex-col min-w-0 flex-1">
                      <span
                        className="text-xs font-bold truncate"
                        style={{ fontFamily: "'Tiro Bangla', serif" }}
                      >
                        {cat.bengali}
                      </span>
                      <span
                        className={cn(
                          "text-[10.5px] truncate",
                          isSelected
                            ? "text-primary-foreground/75"
                            : "text-muted-foreground",
                        )}
                      >
                        {cat.name}
                      </span>
                    </div>

                    {/* Mobile Compact Label */}
                    <span
                      className="lg:hidden text-xs font-semibold whitespace-nowrap truncate max-w-[90px]"
                      style={{ fontFamily: "'Tiro Bangla', serif" }}
                    >
                      {cat.bengali.split(" ")[0]}
                    </span>

                    {/* Item count badge on desktop */}
                    <span
                      className={cn(
                        "hidden lg:inline text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0",
                        isSelected
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground group-hover:bg-background",
                      )}
                    >
                      {cat.subcategories.length}টি
                    </span>

                    <ChevronRight
                      className={cn(
                        "hidden lg:block w-3.5 h-3.5 shrink-0 transition-transform",
                        isSelected
                          ? "text-gold translate-x-0.5"
                          : "text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </aside>

          {/* RIGHT PANEL: Organized Subcategories Showcase */}
          <main
            ref={rightPanelRef}
            className="flex-1 min-w-0 w-full space-y-5"
          >
            {/* MODE 1: LIVE SEARCH ACTIVE */}
            {searchResults ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-border/70">
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-foreground">
                      অনুসন্ধান ফলাফল: "{searchQuery}"
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {searchResults.length}টি সাব-ক্যাটাগরি পাওয়া গেছে
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    ফিল্টার মুছুন
                  </button>
                </div>

                {searchResults.length === 0 ? (
                  <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border p-6">
                    <Tag className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
                    <p className="text-sm font-semibold text-foreground">কোনো ক্যাটাগরি মেলেনি</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      অন্য কোনো শব্দ লিখে অনুসন্ধান করুন
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    {searchResults.map(({ parent, sub }) => (
                      <LuxurySubCategoryCard
                        key={sub.id}
                        sub={sub}
                        parent={parent}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : selectedSlug === "all" ? (
              /* MODE 2: "ALL" OVERVIEW MODE */
              <div className="space-y-8">
                {/* Header Banner for All Overview */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gold/30 bg-gradient-to-r from-section-a via-background to-section-a p-5 sm:p-7 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-2 h-2 rounded-full bg-gold animate-pulse" />
                        <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-gold">
                          ALL ART CATEGORIES
                        </span>
                      </div>
                      <h1
                        className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground"
                        style={{ fontFamily: "'Tiro Bangla', serif" }}
                      >
                        সকল আর্ট ও ক্যালিগ্রাফি সংগ্রহ
                      </h1>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
                        ক্যানভাস, অ্যাক্রিলিক কালার, ইসলামিক ক্যালিগ্রাফি পেন ও আর্ট সামগ্রীর সম্পূর্ণ ব্রাউজিং ডিরেক্টরি।
                      </p>
                    </div>

                    <Link
                      to="/products"
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground text-xs font-bold transition-all shadow-sm shrink-0 self-start sm:self-center cursor-pointer"
                    >
                      <span>সকল পণ্য দেখুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Iterate through each category and show its subcategories grid */}
                {MASTER_ART_CATEGORIES.map((cat) => {
                  const IconComp = ICON_MAP[cat.iconName] || Palette;

                  return (
                    <section key={cat.id} className="space-y-3.5">
                      <div className="flex items-center justify-between pb-2 border-b border-border/70">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center border border-gold/30">
                            <IconComp className="w-3.5 h-3.5 text-gold" />
                          </div>
                          <div>
                            <h2
                              className="text-sm sm:text-base font-bold text-foreground"
                              style={{ fontFamily: "'Tiro Bangla', serif" }}
                            >
                              {cat.bengali} ({cat.name})
                            </h2>
                          </div>
                          <span className="text-[11px] text-muted-foreground hidden sm:inline">
                            ({cat.subcategories.length}টি সাব-ক্যাটাগরি)
                          </span>
                        </div>

                        <Link
                          to="/products"
                          search={{ category: cat.slug, q: "" }}
                          className="text-xs font-semibold text-primary hover:text-gold transition-colors inline-flex items-center gap-1"
                        >
                          <span>সব দেখুন</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {cat.subcategories.map((sub) => (
                          <LuxurySubCategoryCard
                            key={sub.id}
                            sub={sub}
                            parent={cat}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : activeCategory ? (
              /* MODE 3: SINGLE PRIMARY CATEGORY SELECTED */
              <div className="space-y-5">
                {/* Editorial Category Showcase Banner */}
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-gold/30 bg-gradient-to-br from-section-a via-background to-section-a/90 p-5 sm:p-7 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] font-bold text-gold">
                          {activeCategory.name}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold border border-primary/20">
                          {activeCategory.count}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          {activeCategory.subcategories.length}টি সাব-ক্যাটাগরি
                        </span>
                      </div>

                      <h1
                        className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground"
                        style={{ fontFamily: "'Tiro Bangla', serif" }}
                      >
                        {activeCategory.bengali}
                      </h1>

                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        {activeCategory.description}
                      </p>
                    </div>

                    <Link
                      to="/products"
                      search={{ category: activeCategory.slug, q: "" }}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground text-xs sm:text-sm font-bold tracking-wide transition-all shadow-md shrink-0 self-start sm:self-center cursor-pointer"
                    >
                      <span>সব {activeCategory.bengali} দেখুন</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Subcategories Section Title */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs uppercase tracking-[0.16em] font-bold text-muted-foreground">
                    উপলব্ধ সাব-ক্যাটাগরি সমূহ ({activeCategory.subcategories.length}টি)
                  </span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">
                    সরাসরি ফিল্টার করতে যেকোনো কার্ডে ক্লিক করুন
                  </span>
                </div>

                {/* Subcategories Luxury Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4.5">
                  {activeCategory.subcategories.map((sub) => (
                    <LuxurySubCategoryCard
                      key={sub.id}
                      sub={sub}
                      parent={activeCategory}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

// Refined Luxury Subcategory Card Component for Desktop & Mobile
function LuxurySubCategoryCard({
  sub,
  parent,
}: {
  sub: SubCategory;
  parent: MasterCategory;
}) {
  const imageUrl = getSubcategoryImage(sub.slug, parent.image);

  return (
    <Link
      to="/products"
      search={{ category: parent.slug, subcategory: sub.slug, q: "" }}
      className="group relative flex flex-col rounded-2xl sm:rounded-3xl border border-border/80 bg-card hover:border-gold/60 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      {/* Product Illustration Showcase Container */}
      <div className="w-full aspect-[4/3] rounded-t-2xl sm:rounded-t-3xl overflow-hidden bg-gradient-to-b from-section-a to-background p-3 sm:p-4 flex items-center justify-center relative border-b border-border/40">
        <img
          src={imageUrl}
          alt={sub.name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-300 ease-out"
        />

        {/* Subtle hover badge */}
        <span className="absolute bottom-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-semibold px-2 py-0.5 rounded-full bg-background/90 text-primary border border-gold/40 shadow-xs">
          পণ্য দেখুন
        </span>
      </div>

      {/* Card Typography Content */}
      <div className="p-3 sm:p-4 flex flex-col justify-between flex-1 bg-card">
        <div>
          {/* English Title (Bold & prominent) */}
          <h3 className="font-bold text-xs sm:text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {sub.name}
          </h3>

          {/* Bengali Subtitle (Elegant serif) */}
          <p
            className="text-[11px] sm:text-xs text-muted-foreground group-hover:text-foreground/90 transition-colors line-clamp-1 mt-0.5"
            style={{ fontFamily: "'Tiro Bangla', serif" }}
          >
            {sub.bengali}
          </p>
        </div>

        {/* Bottom indicator row */}
        <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] font-semibold text-primary/80 group-hover:text-gold transition-colors">
          <span>কালেকশন এক্সপ্লোর</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  );
}
