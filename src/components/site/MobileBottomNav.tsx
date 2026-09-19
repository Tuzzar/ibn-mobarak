import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { Home, Store, ShoppingBag, Search, X, Menu } from "lucide-react";
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
    "group relative flex flex-1 flex-col items-center justify-center gap-[3px] rounded-2xl py-1.5 transition-colors duration-200";

  const Label = ({ children, active }: { children: React.ReactNode; active?: boolean }) => (
    <span
      className={cn(
        "text-[9px] uppercase tracking-[0.14em] leading-none transition-colors",
        active ? "text-primary font-semibold" : "text-foreground/50",
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
            className="absolute inset-x-3 top-[max(0.75rem,env(safe-area-inset-top))] bg-background border border-gold/25 rounded-2xl shadow-2xl p-3 animate-in slide-in-from-top-4 duration-300"
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
        <div className="pointer-events-auto mx-auto max-w-md rounded-[26px] border border-gold/25 bg-background/90 backdrop-blur-xl shadow-[0_16px_40px_-16px_oklch(0.22_0.04_155/0.45)] px-1.5 py-1.5">
          <ul className="grid grid-cols-5 items-end">
            {/* Home */}
            <li className="flex">
              <Link to="/" className={cn(itemBase, isActive("/") ? "text-primary" : "text-foreground/55")}>
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200",
                    isActive("/") ? "bg-primary/10 ring-1 ring-gold/40" : "",
                  )}
                >
                  <Home className="w-[19px] h-[19px]" strokeWidth={isActive("/") ? 2.1 : 1.6} />
                </span>
                <Label active={isActive("/")}>Home</Label>
              </Link>
            </li>

            {/* Shop */}
            <li className="flex">
              <Link
                to="/products"
                search={{ category: null, q: "" }}
                className={cn(itemBase, isActive("/products") ? "text-primary" : "text-foreground/55")}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-9 h-9 rounded-full transition-all duration-200",
                    isActive("/products") ? "bg-primary/10 ring-1 ring-gold/40" : "",
                  )}
                >
                  <Store className="w-[19px] h-[19px]" strokeWidth={isActive("/products") ? 2.1 : 1.6} />
                </span>
                <Label active={isActive("/products")}>Shop</Label>
              </Link>
            </li>

            {/* Cart — elevated center medallion */}
            <li className="flex justify-center">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label="Open cart"
                className="relative flex flex-col items-center gap-[3px] -mt-6"
              >
                <span className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground ring-4 ring-background shadow-[0_10px_24px_-8px_oklch(0.22_0.04_155/0.6)] transition-transform duration-200 active:scale-95">
                  <span aria-hidden className="absolute inset-1 rounded-full border border-gold/40" />
                  <ShoppingBag className="w-[21px] h-[21px]" strokeWidth={1.8} />
                  {count > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gold text-gold-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full flex items-center justify-center leading-none ring-2 ring-background">
                      {count}
                    </span>
                  )}
                </span>
                <Label>Cart</Label>
              </button>
            </li>

            {/* Search */}
            <li className="flex">
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Search" className={itemBase}>
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-foreground/60">
                  <Search className="w-[19px] h-[19px]" strokeWidth={1.6} />
                </span>
                <Label>Search</Label>
              </button>
            </li>

            {/* Menu */}
            <li className="flex">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("almiftah:open-menu"))}
                aria-label="Open menu"
                className={itemBase}
              >
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-full text-foreground/60">
                  <Menu className="w-[19px] h-[19px]" strokeWidth={1.6} />
                </span>
                <Label>Menu</Label>
              </button>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
