import { useState, useEffect, useRef } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, X, ChevronRight, Loader2, Package } from "lucide-react";
import { searchLiveSuggestions } from "@/lib/search";
import { formatBDT } from "@/lib/cart";

interface HeaderSearchProps {
  initialValue?: string;
  placeholder?: string;
  isMobile?: boolean;
  onSelect?: () => void;
  autoFocus?: boolean;
}

export function HeaderSearch({
  initialValue = "",
  placeholder = "সার্চ করুন: ক্যানভাস, অ্যাক্রিলিক কালার, 8/8 canvas, ব্রাশ...",
  isMobile = false,
  onSelect,
  autoFocus = false,
}: HeaderSearchProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search for live suggestions
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchLiveSuggestions(trimmed, 6);
        setSuggestions(results);
        setIsOpen(true);
      } catch (err) {
        console.warn("Live suggestions error:", err);
      } finally {
        setIsLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = query.trim();
    if (!clean) return;
    setIsOpen(false);
    onSelect?.();
    navigate({
      to: "/products",
      search: {
        category: null,
        subcategory: null,
        q: clean,
      },
    });
  };

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    onSelect?.();
    navigate({
      to: "/products/$slug",
      params: { slug },
    });
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gold shrink-0 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen && e.target.value.trim().length >= 2) setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          aria-label="পণ্য সার্চ করুন"
          className={`w-full bg-card/90 border border-gold/40 pl-10 pr-16 text-foreground placeholder:text-muted-foreground outline-none transition-all shadow-inner focus:border-gold focus:ring-2 focus:ring-gold/30 rounded-full ${
            isMobile ? "py-2.5 text-sm" : "py-2.5 text-sm md:text-base"
          }`}
        />

        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading && (
            <Loader2 className="w-4 h-4 text-gold animate-spin mr-1" />
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSuggestions([]);
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              aria-label="মুছে ফেলুন"
              className="w-6 h-6 rounded-full inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="submit"
            aria-label="সার্চ করুন"
            className="w-7 h-7 rounded-full bg-primary text-primary-foreground inline-flex items-center justify-center hover:bg-primary/90 transition-colors text-xs font-semibold shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Auto-suggest dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div
          className={`absolute left-0 right-0 z-50 mt-2 bg-popover/95 backdrop-blur-md border border-gold/30 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 slide-in-from-top-2 duration-150 ${
            isMobile ? "max-h-[70vh]" : "max-h-[480px]"
          }`}
        >
          <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground bg-muted/30">
            <span>তাৎক্ষণিক ফলাফল ({suggestions.length})</span>
            <span className="text-gold font-medium">Ibn Mobarak Art Gallery</span>
          </div>

          <div className="divide-y divide-border/40 overflow-y-auto max-h-[380px]">
            {suggestions.map((p) => {
              const discount = Math.max(0, Math.floor(Number(p.discount_amount) || 0));
              const effectivePrice = discount > 0 ? p.price - discount : p.price;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(p.slug)}
                  className="w-full text-left px-3.5 py-2.5 flex items-center gap-3 hover:bg-gold/10 transition-colors group cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-lg bg-card border border-border/80 overflow-hidden shrink-0 grid place-items-center relative">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                      {p.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-primary">
                        {formatBDT(effectivePrice)}
                      </span>
                      {discount > 0 && (
                        <span className="text-[10px] text-muted-foreground line-through">
                          {formatBDT(p.price)}
                        </span>
                      )}
                      {p.category && (
                        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-mono">
                          {p.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold group-hover:translate-x-0.5 transition-all shrink-0" />
                </button>
              );
            })}
          </div>

          {/* Bottom row: View all results */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            className="w-full py-2.5 px-4 bg-muted/50 hover:bg-gold/15 border-t border-border/50 text-xs font-semibold text-primary flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>"{query}" এর সকল পণ্য দেখুন</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
