import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useMemo, useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Filter,
  RotateCcw,
  Check,
} from "lucide-react";
import { ProductCard } from "@/components/site/ProductCard";
import { ProductCardSkeletonGrid } from "@/components/site/ProductCardSkeleton";
import { Spinner } from "@/components/site/Spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  productsCategoriesOptions,
  productsInfiniteOptions,
  productsSearchCountOptions,
} from "@/lib/queries";
import { MASTER_ART_CATEGORIES } from "@/data/artCategories";
import { formatBDT } from "@/lib/cart";

const sortOptions = ["featured", "newest", "name-asc", "price-asc", "price-desc"] as const;
type SortKey = (typeof sortOptions)[number];

const searchSchema = z.object({
  category: z.string().nullable().catch(null).optional(),
  subcategory: z.string().nullable().catch(null).optional(),
  q: z.string().catch("").optional(),
  minPrice: z.coerce.number().nullable().catch(null).optional(),
  maxPrice: z.coerce.number().nullable().catch(null).optional(),
  inStock: z.coerce.boolean().catch(false).optional(),
  sort: z.enum(sortOptions).catch("featured").optional(),
});

type ProductsSearch = z.infer<typeof searchSchema>;

export const Route = createFileRoute("/products/")({
  validateSearch: (search?: Record<string, unknown>) => searchSchema.parse(search ?? {}),
  loaderDeps: ({ search }) => ({
    category: search.category ?? null,
    subcategory: search.subcategory ?? null,
    q: search.q ?? "",
    minPrice: search.minPrice ?? null,
    maxPrice: search.maxPrice ?? null,
    inStock: search.inStock ?? false,
    sort: (search.sort ?? "featured") as SortKey,
  }),
  loader: ({ context, deps }) => {
    context.queryClient.prefetchInfiniteQuery(
      productsInfiniteOptions({
        category: deps.category,
        subcategory: deps.subcategory,
        search: deps.q,
        minPrice: deps.minPrice,
        maxPrice: deps.maxPrice,
        inStockOnly: deps.inStock,
        sort: deps.sort,
      }),
    );
    context.queryClient.prefetchQuery(productsCategoriesOptions());
    if (deps.q) {
      context.queryClient.prefetchQuery(
        productsSearchCountOptions({
          category: deps.category,
          subcategory: deps.subcategory,
          search: deps.q,
          minPrice: deps.minPrice,
          maxPrice: deps.maxPrice,
          inStockOnly: deps.inStock,
        }),
      );
    }
  },
  component: Products,
  head: () => ({
    meta: [
      { title: "Shop Premium Art & Craft Supplies | Ibn Mobarak Art Gallery" },
      {
        name: "description",
        content:
          "Ibn Mobarak Art Gallery — ক্যানভাস, অ্যাক্রিলিক কালার, ইসলামিক ক্যালিগ্রাফি পেন ও আর্ট সামগ্রীর সেরা সংগ্রহ।",
      },
      { property: "og:title", content: "Shop Premium Art & Craft Supplies | Ibn Mobarak Art Gallery" },
      {
        property: "og:description",
        content: "Premium art supplies, canvas, calligraphy and craft kits delivered across Bangladesh.",
      },
      { property: "og:url", content: "/products" },
    ],
    links: [{ rel: "canonical", href: "/products" }],
  }),
});

function Products() {
  const search = Route.useSearch();
  const category = search.category ?? null;
  const subcategory = search.subcategory ?? null;
  const q = search.q ?? "";
  const minPrice = search.minPrice ?? null;
  const maxPrice = search.maxPrice ?? null;
  const inStock = search.inStock ?? false;
  const sort = (search.sort ?? "featured") as SortKey;
  const navigate = useNavigate({ from: "/products/" });

  const { data: categories = [] } = useQuery(productsCategoriesOptions());

  const filterParams = useMemo(
    () => ({
      category,
      subcategory,
      search: q,
      minPrice,
      maxPrice,
      inStockOnly: inStock,
      sort,
    }),
    [category, subcategory, q, minPrice, maxPrice, inStock, sort],
  );

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery(productsInfiniteOptions(filterParams));

  const { data: serverCount } = useQuery(productsSearchCountOptions(filterParams));

  const allProducts = useMemo(
    () => (data ? data.pages.flat() : []),
    [data],
  );

  // Local inputs for search and price range
  const [queryInput, setQueryInput] = useState(q);
  const [localMin, setLocalMin] = useState(minPrice ? String(minPrice) : "");
  const [localMax, setLocalMax] = useState(maxPrice ? String(maxPrice) : "");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setQueryInput(q), [q]);
  useEffect(() => setLocalMin(minPrice ? String(minPrice) : ""), [minPrice]);
  useEffect(() => setLocalMax(maxPrice ? String(maxPrice) : ""), [maxPrice]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const totalCount = serverCount ?? allProducts.length;

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    navigate({
      search: (prev: ProductsSearch) => ({
        ...prev,
        q: queryInput.trim() || undefined,
      }),
      replace: true,
    });
  };

  const handleApplyPriceFilter = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const minVal = localMin ? Number(localMin) : undefined;
    const maxVal = localMax ? Number(localMax) : undefined;
    navigate({
      search: (prev: ProductsSearch) => ({
        ...prev,
        minPrice: minVal && minVal > 0 ? minVal : undefined,
        maxPrice: maxVal && maxVal > 0 ? maxVal : undefined,
      }),
    });
    setMobileFilterOpen(false);
  };

  const handleResetFilters = () => {
    setQueryInput("");
    setLocalMin("");
    setLocalMax("");
    navigate({
      search: () => ({
        category: null,
        subcategory: null,
        q: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        inStock: undefined,
        sort: "featured",
      }),
    });
    setMobileFilterOpen(false);
  };

  const toggleInStock = () => {
    navigate({
      search: (prev: ProductsSearch) => ({
        ...prev,
        inStock: !inStock ? true : undefined,
      }),
    });
  };

  const setCategory = (c: string | null) =>
    navigate({
      search: (prev: ProductsSearch) => ({
        ...prev,
        category: c,
        subcategory: null,
      }),
    });

  const setSubcategory = (s: string | null) =>
    navigate({
      search: (prev: ProductsSearch) => ({
        ...prev,
        subcategory: s,
      }),
    });

  const handleSortChange = (newSort: SortKey) => {
    navigate({
      search: (prev: ProductsSearch) => ({
        ...prev,
        sort: newSort,
      }),
    });
  };

  const activeCategoryObj = MASTER_ART_CATEGORIES.find(
    (c) => c.slug === category || c.id === category,
  );
  const activeSubcategoryObj = activeCategoryObj?.subcategories.find(
    (s) => s.slug === subcategory || s.id === subcategory,
  );

  const gridRef = useRef<HTMLDivElement>(null);
  const scrollToGrid = () => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 1024) {
      gridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const isSearchActive = !!q.trim();
  const hasActiveFilters =
    !!category ||
    !!subcategory ||
    !!q.trim() ||
    minPrice != null ||
    maxPrice != null ||
    inStock;

  const activeFilterCount =
    (category ? 1 : 0) +
    (subcategory ? 1 : 0) +
    (q.trim() ? 1 : 0) +
    (minPrice != null ? 1 : 0) +
    (maxPrice != null ? 1 : 0) +
    (inStock ? 1 : 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Editorial Header / Ahbab-Style Search Results Banner */}
      <section className="relative overflow-hidden border-b border-border/60 bg-[color-mix(in_oklab,var(--primary)_6%,var(--background))]">
        <div className="absolute inset-x-0 top-0 h-px bg-gold/40" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gold/40" />
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gold/10 blur-2xl" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-6 md:py-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              {/* Breadcrumb */}
              <nav className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 flex-wrap mb-2">
                <Link to="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
                <span className="text-gold/60">/</span>
                <button
                  type="button"
                  onClick={() => setCategory(null)}
                  className={`hover:text-primary transition-colors ${
                    !category && !isSearchActive ? "text-primary font-semibold" : ""
                  }`}
                >
                  Shop
                </button>

                {isSearchActive ? (
                  <>
                    <span className="text-gold/60">/</span>
                    <span className="text-primary font-semibold">
                      Search results for "{q}"
                    </span>
                  </>
                ) : (
                  <>
                    {activeCategoryObj && (
                      <>
                        <span className="text-gold/60">/</span>
                        <button
                          type="button"
                          onClick={() => setSubcategory(null)}
                          className={`hover:text-primary transition-colors ${
                            !subcategory ? "text-primary font-semibold" : ""
                          }`}
                        >
                          {activeCategoryObj.bengali}
                        </button>
                      </>
                    )}
                    {activeSubcategoryObj && (
                      <>
                        <span className="text-gold/60">/</span>
                        <span className="text-primary font-semibold">
                          {activeSubcategoryObj.bengali}
                        </span>
                      </>
                    )}
                  </>
                )}
              </nav>

              {/* Title & matching count */}
              {isSearchActive ? (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground">
                    Search Results for "{q}"
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 flex items-center gap-2">
                    <span>
                      Found{" "}
                      <strong className="text-primary font-semibold">
                        {totalCount}
                      </strong>{" "}
                      products matching "{q}"
                    </span>
                    {totalCount > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                        সরাসরি ক্যাটালগ
                      </span>
                    )}
                  </p>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-display text-foreground">
                    {activeSubcategoryObj
                      ? `${activeSubcategoryObj.bengali} (${activeSubcategoryObj.name})`
                      : activeCategoryObj
                      ? `${activeCategoryObj.bengali} (${activeCategoryObj.name})`
                      : "The Art & Craft Collection"}
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1.5">
                    {activeCategoryObj
                      ? `${activeCategoryObj.description}`
                      : "ক্যানভাস, অ্যাক্রিলিক কালার, ইসলামিক ক্যালিগ্রাফি ও পেইন্টিং সামগ্রীর বিশাল সম্ভার"}
                  </p>
                </div>
              )}
            </div>

            {/* Quick stats badge */}
            <div className="hidden md:flex items-center gap-3">
              <span className="h-px w-8 bg-gold/60" />
              <div className="text-right">
                <span className="block text-[10px] uppercase tracking-[0.3em] text-gold font-medium">
                  Verified Catalog
                </span>
                <span className="text-xs text-muted-foreground">
                  ৩,৯০০+ আইটেম রেডি স্টক
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sticky Toolbar */}
      <div
        role="toolbar"
        aria-label="Product filters"
        className={`relative lg:sticky lg:top-16 z-30 bg-background/90 backdrop-blur-md border-b transition-shadow duration-300 ${
          scrolled
            ? "border-gold/40 shadow-[0_6px_20px_-16px_rgba(6,78,59,0.35)]"
            : "border-border/60"
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Category Chips Scroll */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden py-1">
                <ChipButton
                  active={!category && !isSearchActive}
                  onClick={() => {
                    setCategory(null);
                    setQueryInput("");
                    navigate({
                      search: (prev: ProductsSearch) => ({
                        ...prev,
                        category: null,
                        subcategory: null,
                        q: undefined,
                      }),
                    });
                    scrollToGrid();
                  }}
                >
                  All (সব)
                </ChipButton>
                {MASTER_ART_CATEGORIES.map((cat) => (
                  <ChipButton
                    key={cat.id}
                    active={category === cat.slug}
                    onClick={() => {
                      setCategory(cat.slug);
                      scrollToGrid();
                    }}
                  >
                    {cat.bengali}
                  </ChipButton>
                ))}
              </div>
            </div>

            {/* Right Controls: Search bar, Mobile Filter button, Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0 justify-between lg:justify-end">
              {/* Desktop quick search in toolbar */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 sm:w-64 md:w-72 lg:w-60"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold" />
                <input
                  type="search"
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="পণ্য বা সাইজ খুঁজুন (যেমন: 8/8)..."
                  aria-label="Search products"
                  className="w-full bg-card border border-border/80 pl-8 pr-8 py-1.5 text-xs rounded-full text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-gold focus:border-gold transition-all"
                />
                {queryInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setQueryInput("");
                      navigate({
                        search: (prev: ProductsSearch) => ({ ...prev, q: undefined }),
                      });
                    }}
                    aria-label="Clear search"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full inline-flex items-center justify-center text-muted-foreground hover:bg-secondary transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </form>

              {/* Mobile Filter Drawer Trigger */}
              <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="lg:hidden relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gold/50 bg-card text-xs text-primary hover:bg-gold/10 transition"
                  >
                    <Filter className="w-3.5 h-3.5 text-gold" />
                    <span>ফিল্টার</span>
                    {activeFilterCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold inline-flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[85%] sm:w-[380px] p-6 overflow-y-auto">
                  <SheetHeader className="pb-4 border-b border-border text-left">
                    <SheetTitle className="font-display text-lg flex items-center justify-between">
                      <span>ফিল্টার করুন (Filters)</span>
                      {hasActiveFilters && (
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="text-xs text-gold hover:underline flex items-center gap-1 font-normal"
                        >
                          <RotateCcw className="w-3 h-3" /> সব মুছুন
                        </button>
                      )}
                    </SheetTitle>
                  </SheetHeader>

                  <div className="py-4 space-y-6">
                    {/* Price Range Filter */}
                    <div>
                      <h4 className="text-xs uppercase font-bold tracking-wider text-gold mb-3">
                        Price Range (মূল্যসীমা)
                      </h4>
                      <form onSubmit={handleApplyPriceFilter} className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min ৳"
                            value={localMin}
                            onChange={(e) => setLocalMin(e.target.value)}
                            className="w-1/2 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground outline-none focus:border-gold"
                          />
                          <span className="text-muted-foreground">-</span>
                          <input
                            type="number"
                            placeholder="Max ৳"
                            value={localMax}
                            onChange={(e) => setLocalMax(e.target.value)}
                            className="w-1/2 px-3 py-2 text-xs rounded-lg border border-border bg-card text-foreground outline-none focus:border-gold"
                          />
                        </div>
                        <button
                          type="submit"
                          className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                        >
                          Apply Price Filter
                        </button>
                      </form>
                    </div>

                    {/* Stock Availability */}
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-gold mb-3">
                        Availability (প্রাপ্যতা)
                      </h4>
                      <button
                        type="button"
                        onClick={toggleInStock}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition ${
                          inStock
                            ? "bg-primary/10 border-primary text-primary font-semibold"
                            : "bg-card border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className={`w-4 h-4 rounded border flex items-center justify-center ${
                              inStock ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                            }`}
                          >
                            {inStock && <Check className="w-3 h-3 stroke-[3]" />}
                          </span>
                          <span>In Stock Only (ইন-স্টক পণ্য)</span>
                        </span>
                      </button>
                    </div>

                    {/* Categories Tree */}
                    <div className="pt-4 border-t border-border">
                      <h4 className="text-xs uppercase font-bold tracking-wider text-gold mb-3">
                        Categories (ক্যাটাগরি)
                      </h4>
                      <ul className="space-y-1.5 text-xs">
                        <li>
                          <button
                            type="button"
                            onClick={() => {
                              setCategory(null);
                              setMobileFilterOpen(false);
                            }}
                            className={`w-full text-left py-1 px-2 rounded ${
                              !category ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            All Categories (সকল ক্যাটাগরি)
                          </button>
                        </li>
                        {MASTER_ART_CATEGORIES.map((cat) => (
                          <li key={cat.id}>
                            <button
                              type="button"
                              onClick={() => {
                                setCategory(cat.slug);
                                setMobileFilterOpen(false);
                              }}
                              className={`w-full text-left py-1 px-2 rounded flex items-center justify-between ${
                                category === cat.slug ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <span>{cat.bengali}</span>
                              <span className="text-[10px] text-muted-foreground">({cat.subcategories.length})</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Sort Selector */}
              <Select value={sort} onValueChange={(v) => handleSortChange(v as SortKey)}>
                <SelectTrigger
                  aria-label="Sort products"
                  className="h-8 w-[135px] sm:w-[155px] rounded-full border-gold/50 bg-card text-xs text-primary hover:bg-gold/10"
                >
                  <SlidersHorizontal className="w-3 h-3 text-gold mr-1 shrink-0" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Best Match (প্রাসঙ্গিক)</SelectItem>
                  <SelectItem value="newest">Newest (নতুন)</SelectItem>
                  <SelectItem value="price-asc">Price ↑ (কম থেকে বেশি)</SelectItem>
                  <SelectItem value="price-desc">Price ↓ (বেশি থেকে কম)</SelectItem>
                  <SelectItem value="name-asc">Name A–Z</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subcategories Secondary Row (if a category is active) */}
          {activeCategoryObj && activeCategoryObj.subcategories.length > 0 && (
            <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="text-[11px] font-bold text-accent shrink-0 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                সাব-ক্যাটাগরি:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSubcategory(null);
                  scrollToGrid();
                }}
                className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-all ${
                  !subcategory
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-foreground/75 bg-muted/50 hover:bg-muted border border-border/60 hover:border-primary/40"
                }`}
              >
                সব {activeCategoryObj.bengali}
              </button>
              {activeCategoryObj.subcategories.map((sub) => {
                const isSubActive = subcategory === sub.slug;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => {
                      setSubcategory(sub.slug);
                      scrollToGrid();
                    }}
                    className={`shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-all ${
                      isSubActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-foreground/75 bg-muted/50 hover:bg-muted border border-border/60 hover:border-primary/40"
                    }`}
                  >
                    <span>{sub.bengali}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Active Filter Pills Bar */}
          {hasActiveFilters && (
            <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider font-semibold mr-1 flex items-center gap-1">
                <span>ফিল্টারসমূহ:</span>
              </span>

              {q.trim() && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                  <span>অনুসন্ধান: "{q}"</span>
                  <button
                    type="button"
                    onClick={() => {
                      setQueryInput("");
                      navigate({
                        search: (prev: ProductsSearch) => ({ ...prev, q: undefined }),
                      });
                    }}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove search filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {category && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                  <span>ক্যাটাগরি: {activeCategoryObj?.bengali || category}</span>
                  <button
                    type="button"
                    onClick={() => setCategory(null)}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove category filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {subcategory && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                  <span>সাব-ক্যাটাগরি: {activeSubcategoryObj?.bengali || subcategory}</span>
                  <button
                    type="button"
                    onClick={() => setSubcategory(null)}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove subcategory filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {minPrice != null && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                  <span>সর্বনিম্ন: {formatBDT(minPrice)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalMin("");
                      navigate({
                        search: (prev: ProductsSearch) => ({ ...prev, minPrice: undefined }),
                      });
                    }}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove min price filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {maxPrice != null && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-medium">
                  <span>সর্বোচ্চ: {formatBDT(maxPrice)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalMax("");
                      navigate({
                        search: (prev: ProductsSearch) => ({ ...prev, maxPrice: undefined }),
                      });
                    }}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove max price filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {inStock && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-xs font-medium">
                  <span>শুধু ইন-স্টক পণ্য</span>
                  <button
                    type="button"
                    onClick={toggleInStock}
                    className="hover:opacity-75 cursor-pointer"
                    aria-label="Remove in-stock filter"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1 text-gold hover:text-primary transition-colors ml-auto text-xs font-semibold"
              >
                <RotateCcw className="w-3 h-3" /> সব ফিল্টার মুছুন
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area: Left Sidebar (Desktop) + Product Grid */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl py-8 md:py-12">
        <div className="grid lg:grid-cols-[260px_1fr] gap-8 lg:gap-10 items-start">
          {/* Left Sidebar Filter (Desktop) — Matches Ahbab layout */}
          <aside className="hidden lg:block space-y-6 sticky top-36">
            <div className="bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-border/60 mb-4">
                <span className="text-xs uppercase tracking-[0.2em] font-bold text-gold flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-gold" /> Filter By
                </span>
                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="text-[11px] text-muted-foreground hover:text-gold transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Price Range Filter Box */}
              <div className="space-y-3 mb-6">
                <span className="block text-xs font-semibold text-foreground">
                  Price Range (মূল্যসীমা)
                </span>
                <form onSubmit={handleApplyPriceFilter} className="space-y-2.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] uppercase text-muted-foreground mb-1 block">
                        Min Price
                      </label>
                      <input
                        type="number"
                        placeholder="৳ 0"
                        value={localMin}
                        onChange={(e) => setLocalMin(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground outline-none focus:border-gold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase text-muted-foreground mb-1 block">
                        Max Price
                      </label>
                      <input
                        type="number"
                        placeholder="৳ 5000"
                        value={localMax}
                        onChange={(e) => setLocalMax(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-border bg-background text-foreground outline-none focus:border-gold"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="submit"
                      className="flex-1 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition shadow-xs"
                    >
                      Apply
                    </button>
                    {(localMin || localMax) && (
                      <button
                        type="button"
                        onClick={() => {
                          setLocalMin("");
                          setLocalMax("");
                          navigate({
                            search: (prev: ProductsSearch) => ({
                              ...prev,
                              minPrice: undefined,
                              maxPrice: undefined,
                            }),
                          });
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground transition"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </form>

                {/* Quick price chips */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalMin("");
                      setLocalMax("500");
                      navigate({
                        search: (prev: ProductsSearch) => ({ ...prev, minPrice: undefined, maxPrice: 500 }),
                      });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-gold/15 text-muted-foreground hover:text-primary transition"
                  >
                    &lt; ৳500
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalMin("500");
                      setLocalMax("1500");
                      navigate({
                        search: (prev: ProductsSearch) => ({ ...prev, minPrice: 500, maxPrice: 1500 }),
                      });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-gold/15 text-muted-foreground hover:text-primary transition"
                  >
                    ৳500 - ৳1500
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLocalMin("1500");
                      setLocalMax("");
                      navigate({
                        search: (prev: ProductsSearch) => ({ ...prev, minPrice: 1500, maxPrice: undefined }),
                      });
                    }}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-muted hover:bg-gold/15 text-muted-foreground hover:text-primary transition"
                  >
                    &gt; ৳1500
                  </button>
                </div>
              </div>

              {/* Stock Availability */}
              <div className="pt-4 border-t border-border/60 mb-6">
                <span className="block text-xs font-semibold text-foreground mb-2">
                  Availability (প্রাপ্যতা)
                </span>
                <button
                  type="button"
                  onClick={toggleInStock}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition ${
                    inStock
                      ? "bg-primary/10 border-primary text-primary font-semibold"
                      : "bg-background border-border text-foreground hover:bg-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        inStock ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground"
                      }`}
                    >
                      {inStock && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>In Stock Only</span>
                  </span>
                </button>
              </div>

              {/* Category Tree */}
              <div className="pt-4 border-t border-border/60">
                <span className="block text-xs font-semibold text-foreground mb-2">
                  Categories (ক্যাটাগরি)
                </span>
                <ul className="space-y-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => setCategory(null)}
                      className={`w-full text-left py-1 px-2 rounded text-xs flex items-center justify-between ${
                        !category ? "bg-primary/10 text-primary font-bold" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>All Products</span>
                      <span className="text-[10px] font-mono">৩,৯০০+</span>
                    </button>
                  </li>
                  {MASTER_ART_CATEGORIES.map((cat) => {
                    const active = category === cat.slug;
                    return (
                      <li key={cat.id} className="space-y-1">
                        <button
                          type="button"
                          onClick={() => setCategory(cat.slug)}
                          className={`w-full text-left py-1 px-2 rounded text-xs flex items-center justify-between transition ${
                            active
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span className="truncate">{cat.bengali}</span>
                          <span className="text-[10px] font-mono opacity-70">
                            {cat.subcategories.length}
                          </span>
                        </button>

                        {/* Nested Subcategories */}
                        {active && cat.subcategories.length > 0 && (
                          <ul className="pl-3 py-1 space-y-0.5 border-l border-gold/30 ml-2">
                            <li>
                              <button
                                type="button"
                                onClick={() => setSubcategory(null)}
                                className={`text-[11px] block w-full text-left py-0.5 transition ${
                                  !subcategory
                                    ? "text-primary font-semibold"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                              >
                                • সব {cat.bengali}
                              </button>
                            </li>
                            {cat.subcategories.map((sub) => (
                              <li key={sub.id}>
                                <button
                                  type="button"
                                  onClick={() => setSubcategory(sub.slug)}
                                  className={`text-[11px] block w-full text-left py-0.5 transition truncate ${
                                    subcategory === sub.slug
                                      ? "text-primary font-semibold"
                                      : "text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  • {sub.bengali}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>

            {/* Support guarantee banner in sidebar */}
            <div className="p-4 rounded-xl bg-gold/5 border border-gold/20 text-xs text-muted-foreground space-y-1.5">
              <p className="font-semibold text-primary">🎨 ১০০% অথেনটিক পণ্য</p>
              <p className="text-[11px] leading-relaxed">
                প্রতিটি ক্যানভাস ও আর্ট সাপ্লাই আমাদের নিজস্ব ওয়ারহাউস থেকে সরাসরি প্রেরিত হয়।
              </p>
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <div ref={gridRef} className="min-w-0">
            {isLoading ? (
              <ProductCardSkeletonGrid count={9} />
            ) : allProducts.length === 0 ? (
              <div className="relative text-center py-16 px-6 bg-card rounded-2xl border border-gold/40 max-w-xl mx-auto shadow-sm">
                <span
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{ boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.15)" }}
                />
                {isSearchActive ? (
                  <>
                    <span className="block text-[11px] uppercase tracking-[0.3em] text-gold font-semibold">
                      No matching items
                    </span>
                    <h2 className="mt-3 font-display text-2xl md:text-3xl text-foreground font-bold">
                      কোনো পণ্য খুঁজে পাওয়া যায়নি
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                      "{q}" এর সাথে মিলে এমন কোনো আর্ট সামগ্রী বা সাইজ পাওয়া যায়নি।
                    </p>
                    <div className="mt-4 p-3 bg-muted/40 rounded-xl text-xs text-muted-foreground inline-block text-left">
                      <p className="font-semibold text-foreground mb-1">পরামর্শ:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>বানান ঠিক আছে কিনা পরীক্ষা করুন</li>
                        <li>সাইজ খোঁজার সময় যেমন: 8/8, 8x8, 10x12 লিখে চেষ্টা করুন</li>
                        <li>সাধারণ কীওয়ার্ড যেমন: canvas, acrylic, brush, easel ব্যবহার করুন</li>
                      </ul>
                    </div>
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <button
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-semibold uppercase tracking-wider"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        সব ফিল্টার মুছুন
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <h2 className="font-display text-2xl text-foreground font-bold">
                      এই ক্যাটাগরিতে পণ্য ফিল্টার করা হয়নি
                    </h2>
                    <p className="text-muted-foreground mt-2 text-sm">
                      নির্বাচিত ফিল্টার বা মূল্যের সাথে কোনো পণ্য মেলেনি।
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-5 inline-flex items-center gap-1.5 px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition text-xs font-semibold"
                    >
                      ফিল্টার রিসেট করুন
                    </button>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Products Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-3.5 sm:gap-5 lg:gap-6">
                  {allProducts.map((p, i) => (
                    <div
                      key={p.id}
                      className="animate-fade-in"
                      style={{
                        animationDelay: i < 8 ? `${i * 35}ms` : "0ms",
                        animationFillMode: "backwards",
                      }}
                    >
                      <ProductCard product={p} priority={i < 4} />
                    </div>
                  ))}
                </div>

                {/* Load More Pagination Banner */}
                <div className="mt-12 md:mt-16 flex flex-col items-center gap-3 pb-8">
                  <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    Showing <strong className="text-primary">{allProducts.length}</strong> of{" "}
                    <strong className="text-primary">{totalCount}</strong> products
                  </span>

                  {hasNextPage ? (
                    <button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      className="inline-flex items-center gap-2 px-10 md:px-14 py-3 md:py-3.5 rounded-full border border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-200 font-medium uppercase tracking-[0.18em] text-xs disabled:opacity-60 shadow-sm"
                    >
                      {isFetchingNextPage && <Spinner className="w-4 h-4" />}
                      {isFetchingNextPage ? "Loading More…" : "Load More Products"}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground/80 italic">
                      সবগুলো পণ্য দেখানো সম্পন্ন হয়েছে
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.14em] font-medium transition-all border whitespace-nowrap ${
        active
          ? "bg-primary text-primary-foreground border-primary ring-2 ring-gold/50 ring-offset-2 ring-offset-background font-semibold"
          : "bg-card text-foreground border-border/80 hover:border-gold hover:text-primary"
      }`}
    >
      <span>{children}</span>
    </button>
  );
}
