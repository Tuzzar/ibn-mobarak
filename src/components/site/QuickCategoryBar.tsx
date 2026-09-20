import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Flame,
  PackagePlus,
  Clock,
  Palette,
  Brush,
  Frame,
  BookOpen,
  Feather,
  Maximize,
  Gem,
  Pencil,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { MASTER_ART_CATEGORIES, getSubcategoryImage } from "@/data/artCategories";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, any> = {
  Flame,
  PackagePlus,
  Clock,
  Palette,
  Brush,
  Frame,
  BookOpen,
  Feather,
  Maximize,
  Gem,
  Pencil,
  Layers,
};

export function QuickCategoryBar() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -260 : 260;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(slug);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 220);
  };

  const toggleDropdown = (slug: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown((prev) => (prev === slug ? null : slug));
  };

  const activeCategory = MASTER_ART_CATEGORIES.find((c) => c.slug === activeDropdown);
  const ActiveIcon = activeCategory ? ICON_MAP[activeCategory.iconName] || Palette : Palette;

  return (
    <div
      className="w-full bg-card/95 backdrop-blur-md border-b border-border/70 sticky top-14 lg:top-16 z-40 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]"
      onMouseLeave={handleMouseLeave}
    >
      <div className="container mx-auto px-3 sm:px-6 max-w-7xl relative">
        {/* Category Pills Row with Horizontal Scroll & Ahbab-style Scroll Arrows */}
        <div className="relative flex items-center">
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => scroll("left")}
              className="hidden sm:flex absolute left-0 z-20 w-7 h-7 -translate-x-2 items-center justify-center rounded-full bg-background/95 border border-border shadow-md text-foreground hover:text-primary hover:border-gold transition-all cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          <div
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-center gap-2 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden w-full scroll-smooth"
          >
            {/* Quick Special Deals */}
            <Link
              to="/products"
              search={{ q: "flash" } as any}
              className="inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-orange-100 shadow-xs"
            >
              <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0 animate-pulse" />
              <span>Flash Deal</span>
            </Link>

            <Link
              to="/products"
              search={{ category: "combos" } as any}
              className="inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100 shadow-xs"
            >
              <PackagePlus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>কম্বো ডিলস</span>
            </Link>

            {/* Master Categories Pills (Ahbab Style with Solid Active State) */}
            {MASTER_ART_CATEGORIES.map((cat) => {
              const IconComponent = ICON_MAP[cat.iconName] || Palette;
              const isOpen = activeDropdown === cat.slug;

              if (cat.subcategories.length === 0) {
                return (
                  <Link
                    key={cat.id}
                    to="/products"
                    search={{ category: cat.slug } as any}
                    className="inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border border-border/80 bg-background hover:border-primary/50 hover:bg-muted/70 text-foreground/85"
                  >
                    <IconComponent className="w-3.5 h-3.5 shrink-0 text-primary/80" />
                    <span>{cat.bengali}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleDropdown(cat.slug)}
                  onMouseEnter={() => handleMouseEnter(cat.slug)}
                  className={cn(
                    "inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border cursor-pointer select-none",
                    isOpen
                      ? "border-primary bg-primary text-primary-foreground shadow-md ring-2 ring-primary/25"
                      : "border-border/80 bg-background hover:border-primary/50 hover:bg-muted/70 text-foreground/85",
                  )}
                >
                  <IconComponent
                    className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-colors",
                      isOpen ? "text-gold" : "text-primary/80",
                    )}
                  />
                  <span className="font-semibold">{cat.bengali}</span>
                  <ChevronDown
                    className={cn(
                      "w-3 h-3 opacity-70 ml-0.5 transition-transform duration-200",
                      isOpen && "rotate-180 text-gold opacity-100",
                    )}
                  />
                </button>
              );
            })}
          </div>

          {canScrollRight && (
            <button
              type="button"
              onClick={() => scroll("right")}
              className="hidden sm:flex absolute right-0 z-20 w-7 h-7 translate-x-2 items-center justify-center rounded-full bg-background/95 border border-border shadow-md text-foreground hover:text-primary hover:border-gold transition-all cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Ahbab-Style Full-Width Mega Subcategories Dropdown Panel */}
        {activeCategory && activeCategory.subcategories.length > 0 && (
          <div
            className="absolute left-3 right-3 sm:left-6 sm:right-6 top-full pt-1.5 z-[70] animate-in fade-in-50 slide-in-from-top-2 duration-150"
            onMouseEnter={() => handleMouseEnter(activeCategory.slug)}
            onMouseLeave={handleMouseLeave}
          >
            <div className="w-full rounded-2xl sm:rounded-3xl bg-card border border-gold/30 shadow-[0_24px_60px_rgba(0,0,0,0.16)] ring-1 ring-black/5 overflow-hidden">
              {/* Category Header Strip with View All Button */}
              <div className="px-4 sm:px-7 py-3.5 border-b border-border/60 bg-section-a/70 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-gold/30">
                    <ActiveIcon className="w-4 h-4 text-gold" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm sm:text-base font-bold text-foreground"
                        style={{ fontFamily: "'Tiro Bangla', serif" }}
                      >
                        {activeCategory.bengali}
                      </span>
                      <span className="text-[10.5px] uppercase tracking-wider font-semibold text-gold">
                        ({activeCategory.name})
                      </span>
                    </div>
                    <p className="hidden md:block text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
                      {activeCategory.description}
                    </p>
                  </div>
                </div>

                <Link
                  to="/products"
                  search={{ category: activeCategory.slug, q: "" } as any}
                  onClick={() => setActiveDropdown(null)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-gold hover:text-gold-foreground transition-all shadow-sm shrink-0"
                >
                  <span>সব {activeCategory.bengali} দেখুন ({activeCategory.count})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Subcategories Grid with Circular Product Images (Ahbab Style) */}
              <div className="p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 max-h-[60vh] overflow-y-auto">
                {activeCategory.subcategories.map((sub) => {
                  const imgUrl = getSubcategoryImage(sub.slug, activeCategory.image);

                  return (
                    <Link
                      key={sub.id}
                      to="/products"
                      search={
                        {
                          category: activeCategory.slug,
                          subcategory: sub.slug,
                          q: "",
                        } as any
                      }
                      onClick={() => setActiveDropdown(null)}
                      className="group flex items-center gap-3 p-2.5 rounded-2xl border border-border/50 bg-background/80 hover:border-gold/60 hover:bg-section-a/90 hover:shadow-sm transition-all cursor-pointer"
                    >
                      {/* Ahbab Circular Image Thumbnail */}
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-muted/80 p-0.5 shrink-0 overflow-hidden ring-1 ring-border/60 group-hover:ring-gold transition-all shadow-xs flex items-center justify-center">
                        <img
                          src={imgUrl}
                          alt={sub.name}
                          loading="lazy"
                          className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-200"
                        />
                      </div>

                      {/* Subcategory English and Bengali Names */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-xs sm:text-[13px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
                          {sub.name}
                        </span>
                        <span
                          className="text-[11px] text-muted-foreground group-hover:text-foreground/80 transition-colors truncate mt-0.5"
                          style={{ fontFamily: "'Tiro Bangla', serif" }}
                        >
                          {sub.bengali}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
