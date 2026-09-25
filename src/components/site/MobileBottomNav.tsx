import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Store, ShoppingBag, Search, X, LayoutGrid } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { CartDrawer } from "./CartDrawer";
import { HeaderSearch } from "./HeaderSearch";

export function MobileBottomNav() {
  const { count } = useCart();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const isActive = (to: string) =>
    to === "/" ? path === "/" : path === to || path.startsWith(to + "/");

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate({ to: "/products", search: { category: null, q } });
    setSearchOpen(false);
  };

  const itemBase =
    "group relative flex flex-1 flex-col items-center justify-center gap-1 rounded-xl py-1 transition-all duration-200";

  const Label = ({ children, active }: { children: React.ReactNode; active?: boolean }) => (
    <span
      className={cn(
        "text-[9.5px] uppercase tracking-wider leading-none transition-colors",
        active ? "text-amber-700 dark:text-amber-400 font-bold" : "text-stone-500 dark:text-stone-400 font-medium",
      )}
    >
      {children}
    </span>
  );

  return (
    <>
      <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-primary/30 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="absolute inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] bg-background border border-amber-500/20 rounded-2xl shadow-2xl p-3 animate-in slide-in-from-top-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <HeaderSearch
                  isMobile
                  autoFocus
                  onSelect={() => setSearchOpen(false)}
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="inline-flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-primary transition-colors shrink-0"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        aria-label="Primary mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 px-3 pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] pointer-events-none"
      >
        <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-background/95 backdrop-blur-xl shadow-[0_12px_36px_-10px_rgba(0,0,0,0.18)] px-2 py-1.5">
          <ul className="grid grid-cols-5 items-end">
            {/* Home */}
            <li className="flex">
              <Link to="/" className={cn(itemBase, isActive("/") ? "text-amber-700 dark:text-amber-400" : "text-stone-500 dark:text-stone-400")}>
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                    isActive("/") ? "bg-amber-500/12 text-amber-700 dark:text-amber-400" : "hover:text-foreground",
                  )}
                >
                  <Home className="w-[18px] h-[18px]" strokeWidth={isActive("/") ? 2.2 : 1.7} />
                </span>
                <Label active={isActive("/")}>Home</Label>
              </Link>
            </li>

            {/* Shop */}
            <li className="flex">
              <Link
                to="/products"
                search={{ category: null, q: "" }}
                className={cn(itemBase, isActive("/products") ? "text-amber-700 dark:text-amber-400" : "text-stone-500 dark:text-stone-400")}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                    isActive("/products") ? "bg-amber-500/12 text-amber-700 dark:text-amber-400" : "hover:text-foreground",
                  )}
                >
                  <Store className="w-[18px] h-[18px]" strokeWidth={isActive("/products") ? 2.2 : 1.7} />
                </span>
                <Label active={isActive("/products")}>Shop</Label>
              </Link>
            </li>

            {/* Cart — modern elevated squircle button */}
            <li className="flex justify-center">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label="Open cart"
                className="relative flex flex-col items-center gap-1 -mt-3.5"
              >
                <span className="relative inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-stone-900 text-white dark:bg-amber-500 dark:text-stone-950 border border-amber-500/30 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.35)] transition-transform duration-200 active:scale-95">
                  <ShoppingBag className="w-5 h-5" strokeWidth={1.9} />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-amber-500 text-stone-950 dark:bg-stone-900 dark:text-amber-400 text-[10px] font-bold min-w-[19px] h-[19px] px-1 rounded-full flex items-center justify-center leading-none ring-2 ring-background shadow-xs">
                      {count}
                    </span>
                  )}
                </span>
                <Label active={count > 0}>Cart</Label>
              </button>
            </li>

            {/* Search */}
            <li className="flex">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search"
                className={cn(itemBase, searchOpen ? "text-amber-700 dark:text-amber-400" : "text-stone-500 dark:text-stone-400")}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                    searchOpen ? "bg-amber-500/12 text-amber-700 dark:text-amber-400" : "hover:text-foreground",
                  )}
                >
                  <Search className="w-[18px] h-[18px]" strokeWidth={searchOpen ? 2.2 : 1.7} />
                </span>
                <Label active={searchOpen}>Search</Label>
              </button>
            </li>

            {/* Categories */}
            <li className="flex">
              <Link
                to="/categories"
                className={cn(itemBase, isActive("/categories") ? "text-amber-700 dark:text-amber-400" : "text-stone-500 dark:text-stone-400")}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-200",
                    isActive("/categories") ? "bg-amber-500/12 text-amber-700 dark:text-amber-400" : "hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="w-[18px] h-[18px]" strokeWidth={isActive("/categories") ? 2.2 : 1.7} />
                </span>
                <Label active={isActive("/categories")}>Categories</Label>
              </Link>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
