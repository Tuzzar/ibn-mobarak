import { Link, useNavigate } from "@tanstack/react-router";
import { ShoppingBag, Menu, X, Search, Home, Store, Info, Mail, MessageCircle, Flame, Gift, Phone, Heart } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/lib/cart";
import { useWishlist } from "@/lib/wishlist";
import { CartDrawer } from "./CartDrawer";
import { WishlistDrawer } from "./WishlistDrawer";
import { Sheet, SheetContent, SheetPortal, SheetOverlay } from "@/components/ui/sheet";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useContactInfo } from "@/lib/contact";
import { useBrandLogo } from "@/lib/brand";
import { MobileCategoryMenu } from "./MobileCategoryMenu";
import { HeaderCategoryMegamenu } from "./HeaderCategoryMegamenu";
import { HeaderSearch } from "./HeaderSearch";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/", label: "Home", icon: Home },
  { to: "/products", label: "Shop", icon: Store },
  { to: "/about", label: "About", icon: Info },
  { to: "/contact", label: "Contact", icon: Mail },
] as const;

// Drawer shows only About + Contact in the "Menu" section — categories live above.
const drawerNav = [
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

const TOP_ANNOUNCEMENTS = [
  "🎨 ১০০% অথেনটিক আর্ট মেটেরিয়ালস ও ক্যালিগ্রাফি সাপ্লাইজ",
  "🚚 সারা বাংলাদেশে ক্যাশ অন ডেলিভারি: ঢাকা ৳৮০ | ঢাকার বাইরে ৳১৩০",
  "📦 ১ কেজি পর্যন্ত ফিক্সড চার্জ, পরবর্তী প্রতি কেজিতে ৳২০ যোগ হবে",
  "💬 সরাসরি অর্ডার ও কাস্টমাইজেশনের জন্য WhatsApp এ নক দিন",
] as const;

export function Header() {
  const brand = useBrandLogo();
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { whatsappHref, phone, phoneHref } = useContactInfo();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((i) => (i + 1) % TOP_ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const openMenu = () => setOpen(true);
    window.addEventListener("almiftah:open-menu", openMenu);
    return () => window.removeEventListener("almiftah:open-menu", openMenu);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const t = setTimeout(() => searchInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [searchOpen]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchValue.trim();
    navigate({ to: "/products", search: { category: null, q } });
    setSearchOpen(false);
  };

  return (
    <>
      {/* Unified Luxury Announcement & Utility Strip (Scrolls with page) */}
      <div className="bg-slate-950 text-slate-100 border-b border-gold/25 text-xs select-none relative z-40">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl flex items-center justify-between h-8 sm:h-8.5 gap-4">
          {/* Animated Announcement Ticker */}
          <div className="flex-1 flex items-center justify-center md:justify-start gap-2 overflow-hidden h-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0 animate-pulse" />
            <span
              key={announcementIdx}
              className="truncate font-medium text-[11px] sm:text-xs tracking-wide text-slate-200 animate-in fade-in duration-300"
              style={{ fontFamily: "'Tiro Bangla', serif" }}
            >
              {TOP_ANNOUNCEMENTS[announcementIdx]}
            </span>
          </div>

          {/* Right contact links (Desktop & Tablet) */}
          <div className="hidden md:flex items-center gap-4 lg:gap-5 text-[11px] tracking-[0.14em] uppercase shrink-0 text-slate-300">
            <Link
              to="/shipping-policy"
              className="hidden lg:inline text-gold/90 text-[10px] tracking-[0.14em] font-medium hover:text-gold transition-colors"
            >
              ডেলিভারি: ঢাকা ৳৮০ · বাইরে ৳১৩০
            </Link>
            <span className="hidden lg:inline text-slate-700">|</span>
            <a
              href={phoneHref}
              className="inline-flex items-center gap-1.5 hover:text-gold transition-colors font-mono tracking-normal text-xs"
            >
              <Phone className="w-3 h-3 text-gold" strokeWidth={2} />
              <span>{phone}</span>
            </a>
            <span className="text-slate-700">|</span>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-semibold tracking-wider text-[10px]"
            >
              <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar — Top Sticky Frozen (Only on PC view: lg:sticky lg:top-0) */}
      <header
        className={cn(
          "relative lg:sticky lg:top-0 z-50 transition-all duration-300 ease-out bg-background/95 backdrop-blur-md",
          scrolled
            ? "border-b border-border/60 shadow-[0_4px_20px_-12px_rgba(15,23,42,0.15)]"
            : "border-b border-border/30",
        )}
      >


      <div className="container mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className={cn(
            "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 transition-[height] duration-300 ease-out lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]",
            scrolled ? "h-14 lg:h-16" : "h-16 lg:h-[4.5rem]",
          )}
        >
          <Link
            to="/"
            className="group flex min-w-0 items-center self-stretch justify-self-start overflow-hidden"
            aria-label="Ibn Mobarak Art Gallery home"
          >
            {brand.hasCustomLogo && brand.url ? (
              <img
                src={brand.url}
                alt="Ibn Mobarak Art Gallery"
                width={217}
                height={107}
                loading="eager"
                decoding="async"
                className={cn(
                  "block w-auto max-w-[9.5rem] object-contain object-left transition-[height] duration-300 ease-out sm:max-w-[11rem] lg:max-w-[12.5rem]",
                  scrolled ? "h-10 sm:h-11" : "h-11 sm:h-12 lg:h-[3.25rem]",
                )}
              />
            ) : (
              <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-primary hover:text-primary/90 transition-colors truncate">
                Ibn Mobarak Art Gallery
              </span>
            )}
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            <Link
              to="/"
              className="group relative inline-flex items-center text-[12px] uppercase tracking-[0.24em] font-medium text-foreground/70 hover:text-primary transition-colors py-0"
              activeProps={{ className: "text-primary" }}
            >
              Home
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 -bottom-1 -translate-x-1/2 h-px w-0 bg-gold transition-all duration-300 group-hover:w-5 group-[&[data-status=active]]:w-5"
              />
            </Link>

            {/* Megamenu Category Dropdown */}
            <HeaderCategoryMegamenu />

            <Link
              to="/products"
              className="group relative inline-flex items-center text-[12px] uppercase tracking-[0.24em] font-medium text-foreground/70 hover:text-primary transition-colors py-0"
              activeProps={{ className: "text-primary" }}
            >
              Shop
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 -bottom-1 -translate-x-1/2 h-px w-0 bg-gold transition-all duration-300 group-hover:w-5 group-[&[data-status=active]]:w-5"
              />
            </Link>

            <Link
              to="/about"
              className="group relative inline-flex items-center text-[12px] uppercase tracking-[0.24em] font-medium text-foreground/70 hover:text-primary transition-colors py-0"
              activeProps={{ className: "text-primary" }}
            >
              About
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 -bottom-1 -translate-x-1/2 h-px w-0 bg-gold transition-all duration-300 group-hover:w-5 group-[&[data-status=active]]:w-5"
              />
            </Link>

            <Link
              to="/contact"
              className="group relative inline-flex items-center text-[12px] uppercase tracking-[0.24em] font-medium text-foreground/70 hover:text-primary transition-colors py-0"
              activeProps={{ className: "text-primary" }}
            >
              Contact
              <span
                aria-hidden
                className="pointer-events-none absolute left-1/2 -bottom-1 -translate-x-1/2 h-px w-0 bg-gold transition-all duration-300 group-hover:w-5 group-[&[data-status=active]]:w-5"
              />
            </Link>
          </nav>


          <div className="flex shrink-0 items-center justify-self-end gap-2 lg:gap-2.5">
            {/* Desktop: separate medallion icon buttons — matches About/Contact style */}
            <div className="hidden lg:flex items-center gap-2.5">
              {/* Search — medallion button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSearchOpen(true)}
                aria-label="Open search"
                className="group relative size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold hover:bg-background"
              >
                <Search className="w-[18px] h-[18px]" strokeWidth={1.75} />
              </Button>

              {/* Wishlist — medallion button with count badge */}
              <WishlistDrawer>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Open wishlist"
                  className="group relative size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold hover:bg-background"
                >
                  <Heart className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full inline-flex items-center justify-center ring-2 ring-background">
                      {wishlistCount}
                    </span>
                  )}
                </Button>
              </WishlistDrawer>

              {/* Cart — medallion button with gold count badge */}
              <CartDrawer>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Open cart"
                  className="group relative size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold hover:bg-background"
                >
                  <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.75} />
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-gold text-gold-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full inline-flex items-center justify-center ring-2 ring-background">
                      {count}
                    </span>
                  )}
                </Button>
              </CartDrawer>
            </div>

            {/* Mobile: Wishlist medallion */}
            <WishlistDrawer>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open wishlist"
                className="relative size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold lg:hidden"
              >
                <Heart className="w-[18px] h-[18px]" strokeWidth={1.75} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full inline-flex items-center justify-center ring-2 ring-background">
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </WishlistDrawer>

            {/* Mobile: cart medallion */}
            <CartDrawer>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open cart"
                className="relative size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold lg:hidden"
              >
                <ShoppingBag className="w-[18px] h-[18px]" strokeWidth={1.75} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-gold-foreground text-[10px] font-bold min-w-[20px] h-5 px-1 rounded-full inline-flex items-center justify-center ring-2 ring-background">
                    {count}
                  </span>
                )}
              </Button>
            </CartDrawer>

            {/* Hamburger - mobile + tablet */}
            <Button
              onClick={() => setOpen(true)}
              variant="ghost"
              size="icon"
              className="size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-[18px] h-[18px]" strokeWidth={1.75} />
            </Button>
          </div>
        </div>
      </div>

      {/* Search overlay — slides down from header on desktop */}
      {searchOpen && (
        <div className="hidden lg:block absolute inset-x-0 top-full bg-background/95 backdrop-blur-md border-b border-gold/20 shadow-[0_20px_40px_-20px_oklch(0.22_0.04_155/0.25)] animate-in slide-in-from-top-2 duration-200">
          <div className="container mx-auto px-6 max-w-4xl py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <HeaderSearch
                  autoFocus
                  onSelect={() => setSearchOpen(false)}
                />
              </div>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                aria-label="Close search"
                className="shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full text-muted-foreground hover:text-primary hover:bg-[var(--section-a)] transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>

      {/* Slide-in drawer from left for mobile + tablet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetPortal>
          <SheetOverlay className="bg-primary/30 backdrop-blur-sm" />
          <SheetPrimitive.Content
            className={cn(
              "fixed inset-y-0 left-0 z-50 h-full w-[85%] sm:w-[60%] md:w-[55%] max-w-md",
              "bg-background border-r border-border shadow-2xl",
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
              "data-[state=closed]:duration-300 data-[state=open]:duration-400",
              "flex flex-col",
            )}
          >
            {/* Header */}
            <div className="grid min-h-20 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6">
              <Link to="/" onClick={() => setOpen(false)} className="flex min-w-0 items-center" aria-label="Ibn Mobarak Art Gallery home">
                {brand.hasCustomLogo && brand.url ? (
                  <img
                    src={brand.url}
                    alt="Ibn Mobarak Art Gallery"
                    width={217}
                    height={107}
                    className="block h-12 w-auto max-w-[12rem] object-contain object-left"
                  />
                ) : (
                  <span className="font-display text-lg font-bold tracking-tight text-primary">
                    Ibn Mobarak Art Gallery
                  </span>
                )}
              </Link>
              <SheetPrimitive.Close
                className="inline-flex items-center justify-center w-9 h-9 text-foreground/60 hover:text-primary transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" strokeWidth={1.5} />
              </SheetPrimitive.Close>
            </div>

            {/* Search */}
            <div className="px-6 py-2">
              <HeaderSearch
                isMobile
                onSelect={() => setOpen(false)}
              />
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto px-7 pt-10 pb-8">
              {/* Categories first (admin-managed hierarchical tree) */}
              <MobileCategoryMenu onNavigate={() => setOpen(false)} />

              <div className="mt-10">
                <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-5">
                  Menu
                </div>
                <div className="flex flex-col">
                  {drawerNav.map((n, i) => (
                    <Link
                      key={n.to}
                      to={n.to}
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between py-4 border-b border-border/50 text-foreground hover:text-primary transition-colors [&[data-status=active]_span[data-dot]]:opacity-100 [&[data-status=active]]:text-primary"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          data-dot
                          aria-hidden
                          className="w-1 h-1 rounded-full bg-gold opacity-0 transition-opacity group-hover:opacity-100"
                        />
                        <span className="font-display text-2xl tracking-tight">{n.label}</span>
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground/60 group-hover:text-primary/80 transition-colors">
                        0{i + 1}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="mt-10">
                <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-4">
                  Quick Access
                </div>
                <div className="flex flex-col gap-2">
                  <Link
                    to="/products"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-2 text-[12px] uppercase tracking-[0.22em] text-foreground/75 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Flame className="w-3.5 h-3.5 text-accent" strokeWidth={1.6} />
                      Featured
                    </span>
                    <span className="text-foreground/40 group-hover:text-primary transition-colors">→</span>
                  </Link>
                  <Link
                    to="/categories"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-2 text-[12px] uppercase tracking-[0.22em] text-foreground/75 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Gift className="w-3.5 h-3.5 text-primary" strokeWidth={1.6} />
                      Categories (ক্যাটাগরি)
                    </span>
                    <span className="text-foreground/40 group-hover:text-primary transition-colors">→</span>
                  </Link>
                  <Link
                    to="/wishlist"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-2 text-[12px] uppercase tracking-[0.22em] text-foreground/75 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <Heart className="w-3.5 h-3.5 text-primary" strokeWidth={1.6} />
                      Wishlist ({wishlistCount})
                    </span>
                    <span className="text-foreground/40 group-hover:text-primary transition-colors">→</span>
                  </Link>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-2 text-[12px] uppercase tracking-[0.22em] text-foreground/75 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="w-3.5 h-3.5 text-primary" strokeWidth={1.6} />
                      WhatsApp
                    </span>
                    <span className="text-foreground/40 group-hover:text-primary transition-colors">→</span>
                  </a>
                </div>
              </div>
            </nav>

            {/* Footer */}
            <div className="px-7 py-6 border-t border-border/60">
              <div className="text-[10px] uppercase tracking-[0.32em] text-muted-foreground mb-2">
                Ibn Mobarak Art Gallery · Dhaka
              </div>
              <p className="text-base leading-snug text-foreground/85" style={{ fontFamily: "'Tiro Bangla', serif" }}>
                ইসলামিক আর্ট ও ক্রাফট গ্যালারি
              </p>
              <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                Premium art & craft supplies — paints, canvas, calligraphy, brushes & frames.
              </p>
            </div>

          </SheetPrimitive.Content>
        </SheetPortal>
      </Sheet>
    </>
  );
}
