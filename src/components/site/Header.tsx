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

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

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
  const { whatsappHref, phone, phoneHref, facebookUrl } = useContactInfo();
  const fbLink = facebookUrl || "https://facebook.com/ibnartgallery";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [announcementIdx, setAnnouncementIdx] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastScrollY = useRef(0);
  const scrollThreshold = 8;
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setAnnouncementIdx((i) => (i + 1) % TOP_ANNOUNCEMENTS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const diff = currentScrollY - lastScrollY.current;

      // 1. If near the top (within the announcement bar height), always reveal header
      if (currentScrollY <= 40) {
        setHeaderVisible(true);
        setScrolled(false);
        lastScrollY.current = currentScrollY;
        return;
      }

      setScrolled(true);

      // 2. Prevent trigger on iOS rubber-band overscroll at page bottom
      const maxScrollY = document.documentElement.scrollHeight - window.innerHeight;
      if (currentScrollY > maxScrollY - 20) {
        return;
      }

      // 3. Directional check with threshold to avoid micro-jitter
      if (Math.abs(diff) > scrollThreshold) {
        if (diff > 0) {
          // Scrolling down -> Hide header
          setHeaderVisible(false);
        } else {
          // Scrolling up -> Reveal header
          setHeaderVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
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

  const isHeaderShown = headerVisible || open || searchOpen;

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

          {/* Right contact links (Desktop, Tablet & Mobile) */}
          <div className="flex items-center gap-2.5 sm:gap-4 lg:gap-5 text-[11px] tracking-[0.14em] uppercase shrink-0 text-slate-300">
            <Link
              to="/shipping-policy"
              className="hidden lg:inline text-gold/90 text-[10px] tracking-[0.14em] font-medium hover:text-gold transition-colors"
            >
              ডেলিভারি: ঢাকা ৳৮০ · বাইরে ৳১৩০
            </Link>
            <span className="hidden lg:inline text-slate-700">|</span>
            <a
              href={phoneHref}
              className="hidden md:inline-flex items-center gap-1.5 hover:text-gold transition-colors font-mono tracking-normal text-xs"
            >
              <Phone className="w-3 h-3 text-gold" strokeWidth={2} />
              <span>{phone}</span>
            </a>
            <span className="hidden md:inline text-slate-700">|</span>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors font-semibold tracking-wider text-[10px]"
            >
              <MessageCircle className="w-3.5 h-3.5" strokeWidth={2.2} />
              <span>WhatsApp</span>
            </a>
            <span className="hidden sm:inline text-slate-700">|</span>
            <a
              href={fbLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-slate-200 hover:text-white transition-colors font-semibold tracking-wider text-[10px]"
              title="Facebook"
            >
              <FacebookIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Facebook</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar — Smart Sticky: Hides on scroll down, reveals on scroll up */}
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300 ease-out bg-background/95 backdrop-blur-md",
          isHeaderShown ? "translate-y-0" : "max-lg:-translate-y-full",
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


          <div className="flex shrink-0 items-center justify-self-end gap-1.5 sm:gap-2 lg:gap-2.5">
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

              {/* Facebook — PC medallion button (Monochrome Black & White) */}
              <a
                href={fbLink}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Page"
                className="group relative size-10 rounded-full border border-gold/30 bg-section-a text-stone-900 dark:text-stone-100 hover:border-gold hover:text-primary inline-flex items-center justify-center transition-all shadow-xs"
                title="Facebook Page"
              >
                <FacebookIcon className="w-[18px] h-[18px]" />
              </a>

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

            {/* Mobile: Facebook medallion (Monochrome Black & White) */}
            <a
              href={fbLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook Page"
              className="relative size-9 sm:size-10 rounded-full border border-gold/30 bg-section-a text-stone-900 dark:text-stone-100 hover:border-gold hover:text-primary inline-flex items-center justify-center transition-all lg:hidden shadow-xs"
              title="Facebook"
            >
              <FacebookIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </a>

            {/* Mobile: Wishlist medallion */}
            <WishlistDrawer>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Open wishlist"
                className="relative size-9 sm:size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold lg:hidden"
              >
                <Heart className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={1.75} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center ring-2 ring-background">
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
                className="relative size-9 sm:size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold lg:hidden"
              >
                <ShoppingBag className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={1.75} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gold text-gold-foreground text-[10px] font-bold min-w-[18px] h-[18px] px-1 rounded-full inline-flex items-center justify-center ring-2 ring-background">
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
              className="size-9 sm:size-10 rounded-full border border-gold/30 bg-section-a text-primary hover:border-gold lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={1.75} />
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
            <div className="flex min-h-20 items-center justify-between gap-4 px-6">
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
              <div className="flex items-center gap-2">
                <a
                  href={fbLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook Page"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-stone-200 dark:border-stone-800 bg-stone-100 dark:bg-stone-900 text-stone-900 dark:text-stone-100 hover:border-gold hover:text-primary transition-all shadow-xs"
                  title="Facebook Page"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
                <SheetPrimitive.Close
                  className="inline-flex items-center justify-center w-9 h-9 text-foreground/60 hover:text-primary transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" strokeWidth={1.5} />
                </SheetPrimitive.Close>
              </div>
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
                    href={fbLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-2 text-[12px] uppercase tracking-[0.22em] text-foreground/80 hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <FacebookIcon className="w-3.5 h-3.5 text-stone-900 dark:text-stone-100" />
                      Facebook Page
                    </span>
                    <span className="text-foreground/40 group-hover:text-primary transition-colors">→</span>
                  </a>
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                    className="group flex items-center justify-between py-2 text-[12px] uppercase tracking-[0.22em] text-foreground/75 hover:text-emerald-500 transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.6} />
                      WhatsApp
                    </span>
                    <span className="text-foreground/40 group-hover:text-emerald-500 transition-colors">→</span>
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

              {/* Social connect buttons (Monochrome Black & White for Facebook) */}
              <div className="mt-4 pt-3.5 border-t border-border/40 flex items-center gap-2">
                <a
                  href={fbLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 transition-all shadow-xs"
                >
                  <FacebookIcon className="w-3.5 h-3.5" />
                  <span>Facebook Page</span>
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/25 transition-all shadow-xs"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>

          </SheetPrimitive.Content>
        </SheetPortal>
      </Sheet>
    </>
  );
}
