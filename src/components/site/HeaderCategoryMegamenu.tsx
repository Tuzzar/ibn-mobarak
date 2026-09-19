import { useState, useRef } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
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
} from "lucide-react";
import { MASTER_ART_CATEGORIES, type MasterCategory } from "@/data/artCategories";

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

export function HeaderCategoryMegamenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string>(MASTER_ART_CATEGORIES[0]?.slug ?? "paints");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  const activeCategory: MasterCategory =
    MASTER_ART_CATEGORIES.find((c) => c.slug === selectedSlug) || MASTER_ART_CATEGORIES[0];

  const handleSubNavigate = (catSlug: string, subSlug?: string) => {
    setIsOpen(false);
    navigate({
      to: "/products",
      search: subSlug
        ? ({ category: catSlug, subcategory: subSlug } as any)
        : ({ category: catSlug } as any),
    });
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="group relative inline-flex items-center gap-1.5 text-[12px] uppercase tracking-[0.24em] font-medium text-foreground/75 hover:text-primary transition-colors py-1 cursor-pointer select-none"
        aria-expanded={isOpen}
      >
        <span>ক্যাটাগরি</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 text-gold ${
            isOpen ? "rotate-180" : ""
          }`}
        />
        <span
          aria-hidden
          className={`pointer-events-none absolute left-1/2 -bottom-0.5 -translate-x-1/2 h-px bg-gold transition-all duration-300 ${
            isOpen ? "w-6" : "w-0 group-hover:w-6"
          }`}
        />
      </button>

      {/* Megamenu Floating Panel */}
      {isOpen && (
        <div
          className="absolute left-1/2 -translate-x-1/3 top-full pt-2 z-50 animate-in fade-in-50 zoom-in-95 duration-150"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <div className="w-[740px] bg-card border border-border/80 rounded-2xl shadow-2xl ring-1 ring-black/10 overflow-hidden flex divide-x divide-border/60">
            {/* Left: Parent Categories List */}
            <div className="w-[280px] p-3 bg-muted/20 space-y-1 max-h-[460px] overflow-y-auto">
              <div className="px-2 py-1.5 text-[10px] uppercase tracking-[0.24em] font-bold text-accent">
                আর্ট ক্যাটাগরি সমূহ
              </div>
              {MASTER_ART_CATEGORIES.map((cat) => {
                const IconComponent = ICON_MAP[cat.iconName] || Palette;
                const isSelected = selectedSlug === cat.slug;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onMouseEnter={() => setSelectedSlug(cat.slug)}
                    onClick={() => handleSubNavigate(cat.slug)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all text-xs ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-foreground/80 hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? "text-gold" : "text-primary/75"
                        }`}
                      />
                      <span className="truncate">{cat.bengali}</span>
                    </div>
                    <span
                      className={`text-[10px] shrink-0 ${
                        isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                      }`}
                    >
                      {cat.subcategories.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right: Subcategories & Preview Panel */}
            <div className="flex-1 p-5 flex flex-col justify-between bg-card">
              <div>
                {/* Header for active category */}
                <div className="flex items-start justify-between gap-4 pb-3 border-b border-border/60">
                  <div>
                    <h3 className="text-base font-bold text-foreground">
                      {activeCategory.bengali}{" "}
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        ({activeCategory.name})
                      </span>
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeCategory.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSubNavigate(activeCategory.slug)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-accent transition-colors shrink-0 pt-0.5"
                  >
                    <span>সব দেখুন</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Subcategories Grid */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {activeCategory.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => handleSubNavigate(activeCategory.slug, sub.slug)}
                      className="group/sub flex items-center justify-between p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
                    >
                      <div className="truncate pr-1">
                        <div className="text-xs font-medium text-foreground group-hover/sub:text-primary transition-colors truncate">
                          {sub.bengali}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {sub.name}
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 text-muted-foreground opacity-40 group-hover/sub:opacity-100 group-hover/sub:text-primary group-hover/sub:translate-x-0.5 transition-all shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Quick Bar */}
              <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-[11px]">
                  ১০০% অথেনটিক কোয়ালিটি ও দ্রুত ডেলিভারি নিশ্চয়তা
                </span>
                <Link
                  to="/products"
                  onClick={() => setIsOpen(false)}
                  className="font-medium text-primary hover:underline"
                >
                  পুরো ক্যাটালগ ব্রাউজ করুন →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
