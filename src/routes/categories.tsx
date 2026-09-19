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
  component: SplitCategoriesPage,
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

// Pastel tinted backgrounds for subcategory cards to give clean boutique visual depth
const PASTEL_TINTS = [
  "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
  "bg-amber-50/70 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
  "bg-sky-50/70 dark:bg-sky-950/20 border-sky-100 dark:border-sky-900/30",
  "bg-rose-50/70 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
  "bg-purple-50/70 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30",
  "bg-teal-50/70 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/30",
];

// Quick promotion pills at top
const QUICK_TAGS = [
  { label: "সকল ক্যাটাগরি", categorySlug: "all", icon: Compass },
  { label: "হট ডিলস", to: "/products", search: { category: null, q: "offer" }, icon: Flame },
  { label: "কম্বো সেট", categorySlug: "combos", icon: PackagePlus },
  { label: "কালার ও পেইন্টস", categorySlug: "paints", icon: Palette },
  { label: "ব্রাশ ও টুলস", categorySlug: "brushes", icon: Brush },
  { label: "ক্যালিগ্রাফি", categorySlug: "calligraphy", icon: Feather },
  { label: "ক্যানভাস ও বোর্ড", categorySlug: "canvas", icon: Frame },
];

function SplitCategoriesPage() {
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
    <div className="flex flex-col h-[calc(100dvh-3.5rem)] md:h-[calc(100vh-4.25rem)] bg-background overflow-hidden">
      {/* Top Bar: Quick Action Strip & Instant Search */}
      <div className="shrink-0 z-20 bg-background/95 backdrop-blur-md border-b border-gold/20 px-3 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex items-center gap-2.5">
          {/* Compact Search Bar */}
          <div className="relative flex-1 max-w-xs sm:max-w-sm">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="আর্ট সামগ্রী খুঁজুন..."
              className="w-full h-8.5 rounded-full border border-gold/30 bg-section-a/70 px-3 pl-8 text-xs placeholder:text-muted-foreground/70 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/30 transition-all"
            />
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Horizontal Scroll Pills */}
          <div className="flex-1 overflow-x-auto no-scrollbar flex items-center gap-1.5 py-0.5">
            {QUICK_TAGS.map((tag, idx) => {
              const IconComp = tag.icon;
              const isActive =
                tag.categorySlug && selectedSlug === tag.categorySlug && !searchQuery;

              if (tag.to) {
                return (
                  <Link
                    key={idx}
                    to={tag.to}
                    search={tag.search}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-border/80 bg-background text-[11px] font-medium text-foreground/80 hover:border-gold hover:text-primary whitespace-nowrap transition-colors shrink-0 shadow-sm"
                  >
                    <IconComp className="w-3 h-3 text-accent" />
                    <span>{tag.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    if (tag.categorySlug) setSelectedSlug(tag.categorySlug);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all shrink-0 shadow-sm",
                    isActive
                      ? "bg-primary text-primary-foreground border border-gold font-semibold shadow-md"
                      : "border border-border/80 bg-background text-foreground/80 hover:border-gold hover:text-primary",
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

      {/* Main Dual-Panel Split View */}
      <div className="flex-1 flex max-w-7xl mx-auto w-full overflow-hidden">
        {/* LEFT RAIL: Primary Category Navigator */}
        <aside
          aria-label="Category Navigation"
          className="w-[82px] sm:w-24 md:w-28 lg:w-48 shrink-0 border-r border-gold/20 bg-section-a/70 overflow-y-auto pb-24 touch-pan-y"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex flex-col py-1.5">
            {/* "ALL" Item */}
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedSlug("all");
              }}
              className={cn(
                "group relative flex flex-col items-center justify-center py-2.5 px-1 transition-all duration-150 cursor-pointer",
                selectedSlug === "all" && !searchQuery
                  ? "bg-background text-primary font-bold shadow-sm"
                  : "text-foreground/70 hover:bg-background/50 hover:text-primary",
              )}
            >
              {/* Gold vertical active pill */}
              {selectedSlug === "all" && !searchQuery && (
                <span className="absolute left-0 inset-y-1.5 w-1 bg-gold rounded-r-full" />
              )}
              <span
                className={cn(
                  "inline-flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-150 mb-1 pointer-events-none",
                  selectedSlug === "all" && !searchQuery
                    ? "bg-primary text-primary-foreground ring-2 ring-gold/40 shadow-sm"
                    : "bg-background border border-gold/25 text-foreground/70 group-hover:border-gold",
                )}
              >
                <LayoutGrid className="w-4.5 h-4.5" strokeWidth={1.8} />
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-center leading-tight pointer-events-none">
                ALL
              </span>
              <span className="hidden lg:inline text-[10px] text-muted-foreground font-normal pointer-events-none">
                সকল পণ্য
              </span>
            </button>

            {/* Category Items */}
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
                    "group relative flex flex-col items-center justify-center py-2 px-1 transition-all duration-150 border-t border-border/40 cursor-pointer",
                    isSelected
                      ? "bg-background text-primary font-bold shadow-sm"
                      : "text-foreground/70 hover:bg-background/50 hover:text-primary",
                  )}
                >
                  {/* Active Indicator Strip */}
                  {isSelected && (
                    <span className="absolute left-0 inset-y-1 w-1 bg-gold rounded-r-full shadow-[0_0_8px_rgba(212,175,55,0.6)]" />
                  )}

                  {/* Thumbnail / Icon Container */}
                  <div
                    className={cn(
                      "relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl overflow-hidden mb-1 flex items-center justify-center transition-all duration-150 pointer-events-none",
                      isSelected
                        ? "ring-2 ring-gold shadow-sm"
                        : "border border-border/60 bg-background/90 group-hover:border-gold/50",
                    )}
                  >
                    {cat.image ? (
                      <img
                        src={cat.image}
                        alt={cat.name}
                        loading="lazy"
                        className={cn(
                          "w-full h-full object-cover transition-transform duration-200",
                          isSelected ? "scale-105" : "group-hover:scale-105",
                        )}
                      />
                    ) : (
                      <IconComp className="w-4.5 h-4.5 text-gold" />
                    )}
                  </div>

                  {/* Labels */}
                  <span
                    className={cn(
                      "text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-center leading-tight max-w-[70px] truncate pointer-events-none",
                      isSelected ? "text-primary" : "text-foreground/80",
                    )}
                  >
                    {cat.slug.toUpperCase()}
                  </span>
                  <span
                    className="text-[8.5px] sm:text-[9.5px] text-muted-foreground text-center line-clamp-1 max-w-[70px] pointer-events-none"
                    style={{ fontFamily: "'Tiro Bangla', serif" }}
                  >
                    {cat.bengali.split(" ")[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* RIGHT PANEL: Subcategories Grid & Content */}
        <div
          ref={rightPanelRef}
          className="flex-1 overflow-y-auto px-2.5 sm:px-5 py-3 pb-28 touch-pan-y bg-background"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {/* MODE 1: SEARCH ACTIVE */}
          {searchResults ? (
            <div>
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-border/60">
                <h2 className="text-xs sm:text-sm font-bold text-foreground">
                  ফলাফল: "{searchQuery}" ({searchResults.length}টি ক্যাটাগরি)
                </h2>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-xs text-primary font-semibold hover:underline"
                >
                  ক্লিয়ার করুন
                </button>
              </div>

              {searchResults.length === 0 ? (
                <div className="text-center py-12 bg-section-a/40 rounded-2xl border border-dashed border-border p-5">
                  <Tag className="w-9 h-9 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-semibold text-foreground">কোনো ক্যাটাগরি মেলেনি</p>
                  <p className="text-xs text-muted-foreground mt-1">অন্য কোনো শব্দ লিখে খুঁজুন</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {searchResults.map(({ parent, sub }, idx) => (
                    <SubCategoryCard
                      key={sub.id}
                      sub={sub}
                      parent={parent}
                      tintClass={PASTEL_TINTS[idx % PASTEL_TINTS.length]}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : selectedSlug === "all" ? (
            /* MODE 2: "ALL" OVERVIEW SELECTED */
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2.5 border-b border-gold/20">
                <div>
                  <h1
                    className="text-base sm:text-lg font-bold text-primary"
                    style={{ fontFamily: "'Tiro Bangla', serif" }}
                  >
                    সকল আর্ট ও ক্যালিগ্রাফি সংগ্রহ
                  </h1>
                  <p className="text-[11px] text-muted-foreground">
                    ১০টি প্রধান বিভাগ এবং ৬০টির বেশি পণ্য ক্যাটাগরি
                  </p>
                </div>
                <Link
                  to="/products"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 border border-gold/30 text-xs font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                >
                  <span>সব পণ্য</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {MASTER_ART_CATEGORIES.map((cat, catIdx) => (
                <div key={cat.id} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1 h-3.5 bg-gold rounded-full" />
                      <h2
                        className="text-xs sm:text-sm font-bold text-foreground"
                        style={{ fontFamily: "'Tiro Bangla', serif" }}
                      >
                        {cat.bengali} ({cat.name})
                      </h2>
                    </div>
                    <Link
                      to="/products"
                      search={{ category: cat.slug, q: "" }}
                      className="text-[11px] font-semibold text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>সব দেখুন</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                    {cat.subcategories.map((sub, sIdx) => (
                      <SubCategoryCard
                        key={sub.id}
                        sub={sub}
                        parent={cat}
                        tintClass={PASTEL_TINTS[(catIdx + sIdx) % PASTEL_TINTS.length]}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : activeCategory ? (
            /* MODE 3: SINGLE PRIMARY CATEGORY SELECTED */
            <div className="space-y-3.5">
              {/* Category Header Banner with Fast View-All Action */}
              <div className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-r from-section-a via-background to-section-a p-3.5 sm:p-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div>
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[9.5px] uppercase tracking-[0.2em] font-bold text-gold">
                        {activeCategory.name}
                      </span>
                      <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-semibold">
                        {activeCategory.count}
                      </span>
                    </div>
                    <h1
                      className="text-lg sm:text-xl font-bold tracking-tight text-foreground"
                      style={{ fontFamily: "'Tiro Bangla', serif" }}
                    >
                      {activeCategory.bengali}
                    </h1>
                    <p className="text-[11px] text-muted-foreground mt-0.5 max-w-md leading-relaxed line-clamp-2 sm:line-clamp-none">
                      {activeCategory.description}
                    </p>
                  </div>

                  <Link
                    to="/products"
                    search={{ category: activeCategory.slug, q: "" }}
                    className="inline-flex items-center justify-center gap-1 px-3.5 py-1.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold tracking-wide transition-colors shadow-sm shrink-0 self-start sm:self-center"
                  >
                    <span>সব {activeCategory.bengali}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Subcategories 2-Column Grid (Ahbab Style Enhanced) */}
              <div>
                <div className="flex items-center justify-between mb-2.5 px-0.5">
                  <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-muted-foreground">
                    সাব-ক্যাটাগরি সমূহ ({activeCategory.subcategories.length}টি)
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {activeCategory.subcategories.map((sub, idx) => (
                    <SubCategoryCard
                      key={sub.id}
                      sub={sub}
                      parent={activeCategory}
                      tintClass={PASTEL_TINTS[idx % PASTEL_TINTS.length]}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// Elegant Subcategory Card Component
function SubCategoryCard({
  sub,
  parent,
  tintClass,
}: {
  sub: SubCategory;
  parent: MasterCategory;
  tintClass: string;
}) {
  const imageUrl = getSubcategoryImage(sub.slug, parent.image);

  return (
    <Link
      to="/products"
      search={{ category: parent.slug, subcategory: sub.slug, q: "" }}
      className={cn(
        "group relative flex flex-col items-center justify-between p-2 rounded-2xl border transition-all duration-150 cursor-pointer",
        "bg-background hover:border-gold hover:shadow-md active:scale-[0.96]",
        tintClass,
      )}
    >
      {/* Product/Illustration Thumbnail Box */}
      <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-background/90 flex items-center justify-center p-1 relative mb-1.5 shadow-inner pointer-events-none">
        <img
          src={imageUrl}
          alt={sub.name}
          loading="lazy"
          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-200 ease-out pointer-events-none"
        />
      </div>

      {/* English Label (Bold Uppercase like Ahbab) */}
      <span className="font-bold text-[10px] sm:text-xs uppercase tracking-tight text-foreground group-hover:text-primary transition-colors text-center line-clamp-1 pointer-events-none">
        {sub.name}
      </span>

      {/* Bengali Subtitle */}
      <span
        className="text-[9.5px] sm:text-[10.5px] text-muted-foreground font-medium text-center line-clamp-1 mt-0.5 pointer-events-none"
        style={{ fontFamily: "'Tiro Bangla', serif" }}
      >
        {sub.bengali}
      </span>
    </Link>
  );
}
