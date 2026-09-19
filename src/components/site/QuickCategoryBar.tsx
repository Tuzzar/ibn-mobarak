import { useState, useRef } from "react";
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
} from "lucide-react";
import { MASTER_ART_CATEGORIES } from "@/data/artCategories";

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

  const handleMouseEnter = (slug: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveDropdown(slug);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 200);
  };

  return (
    <div className="w-full bg-card/95 backdrop-blur-md border-b border-border/70 sticky top-14 lg:top-16 z-30 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.06)]">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Quick Special Deals */}
          <Link
            to="/products"
            search={{ q: "flash" } as any}
            className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border border-orange-200 bg-orange-50 text-orange-700 hover:border-orange-400 hover:bg-orange-100 shadow-xs"
          >
            <Flame className="w-3.5 h-3.5 text-orange-600 shrink-0 animate-pulse" />
            <span>Flash Deal</span>
          </Link>

          <Link
            to="/products"
            search={{ category: "combos" } as any}
            className="inline-flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border border-indigo-200 bg-indigo-50 text-indigo-700 hover:border-indigo-400 hover:bg-indigo-100 shadow-xs"
          >
            <PackagePlus className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span>কম্বো ডিলস</span>
          </Link>

          {/* Master Categories Pills with Subcategory Dropdowns */}
          {MASTER_ART_CATEGORIES.map((cat) => {
            const IconComponent = ICON_MAP[cat.iconName] || Palette;
            const isOpen = activeDropdown === cat.slug;

            return (
              <div
                key={cat.id}
                className="relative shrink-0"
                onMouseEnter={() => handleMouseEnter(cat.slug)}
                onMouseLeave={handleMouseLeave}
              >
                <Link
                  to="/products"
                  search={{ category: cat.slug } as any}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border ${
                    isOpen
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-border/80 bg-background hover:border-primary/50 hover:bg-muted/70 text-foreground/85"
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5 shrink-0 text-primary/80" />
                  <span>{cat.bengali}</span>
                  {cat.subcategories.length > 0 && (
                    <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 hidden sm:inline" />
                  )}
                </Link>

                {/* Subcategories Flyout Dropdown on Desktop */}
                {isOpen && cat.subcategories.length > 0 && (
                  <div
                    className="hidden lg:block absolute left-0 top-full pt-1 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
                    onMouseEnter={() => handleMouseEnter(cat.slug)}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="w-64 p-2 rounded-xl bg-card border border-border shadow-xl ring-1 ring-black/5">
                      <div className="px-2.5 py-1.5 border-b border-border/50 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">
                          {cat.bengali}
                        </span>
                        <Link
                          to="/products"
                          search={{ category: cat.slug } as any}
                          className="text-[10px] text-primary hover:underline font-semibold"
                        >
                          সব দেখুন
                        </Link>
                      </div>
                      <div className="py-1 space-y-0.5 max-h-72 overflow-y-auto">
                        {cat.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            to="/products"
                            search={{ category: cat.slug, subcategory: sub.slug } as any}
                            className="group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground/80 hover:text-primary hover:bg-primary/5 transition-colors"
                          >
                            <span className="truncate">{sub.bengali}</span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                              →
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
