import { queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/external";
import { DEMO_ART_PRODUCTS } from "@/data/artCatalog";

// Only the columns the UI actually reads — smaller payload, faster parse.
const LIST_COLS =
  "id, slug, name, price, image_url, unit, category, subcategory, featured, stock, product_level, sort_order, discount_amount, weight_variants";
const DETAIL_COLS =
  "id, slug, name, price, image_url, images, unit, category, subcategory, featured, stock, description, product_level, sort_order, weight_variants, discount_amount";

export const PAGE_SIZE = 24;

export const allProductsSlugOptions = () =>
  queryOptions({
    queryKey: ["all-products-slugs"],
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, slug, name")
        .order("name", { ascending: true })
        .limit(2000);
      return data ?? [];
    },
  });

export const siteContentOptions = () =>
  queryOptions({
    queryKey: ["site-content"],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("site_content" as any)
        .select("key, value");
      const map: Record<string, string> = {};
      (data ?? []).forEach((r: any) => {
        if (r?.key) map[r.key] = r.value ?? "";
      });
      return map;
    },
  });

export const featuredProductsOptions = () =>
  queryOptions({
    queryKey: ["featured-products"],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select(LIST_COLS)
          .eq("featured", true)
          .order("product_level", { ascending: true })
          .order("sort_order", { ascending: true })
          .limit(8);
        if (data && data.length > 0) return data;
      } catch (err) {
        console.warn("Could not fetch featured products from Supabase:", err);
      }
      return DEMO_ART_PRODUCTS.slice(0, 8);
    },
  });

export const showcaseProductsOptions = () =>
  queryOptions({
    queryKey: ["showcase-products"],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(DETAIL_COLS)
        .eq("featured", true)
        .order("product_level", { ascending: true })
        .order("sort_order", { ascending: true })
        .limit(6);
      return data ?? [];
    },
  });

export const categoryProductsOptions = (category: string) =>
  queryOptions({
    queryKey: ["category-products", category],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select(LIST_COLS)
        .eq("category", category)
        .order("product_level", { ascending: true })
        .order("sort_order", { ascending: true })
        .limit(8);
      return data ?? [];
    },
  });

export const flashDealsProductsOptions = (limit = 10) =>
  queryOptions({
    queryKey: ["flash-deals-products", limit],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select(LIST_COLS)
          .gt("discount_amount", 0)
          .order("discount_amount", { ascending: false })
          .limit(limit);
        if (data && data.length > 0) return data;
      } catch (err) {
        console.warn("Could not fetch flash deals from Supabase:", err);
      }
      return DEMO_ART_PRODUCTS.filter((p) => (p.discount_amount ?? 0) > 0).slice(0, limit);
    },
  });

export const categoryShowcaseProductsOptions = (category: string, limit = 8) =>
  queryOptions({
    queryKey: ["category-showcase-products", category, limit],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      try {
        const { data } = await supabase
          .from("products")
          .select(LIST_COLS)
          .eq("category", category)
          .order("sort_order", { ascending: true })
          .limit(limit);
        if (data && data.length > 0) return data;
      } catch (err) {
        console.warn(`Could not fetch ${category} products:`, err);
      }
      return DEMO_ART_PRODUCTS.filter((p) => p.category === category).slice(0, limit);
    },
  });

export const suggestionsProductsOptions = (type: "popular" | "new" | "budget" = "popular", limit = 8) =>
  queryOptions({
    queryKey: ["suggestions-products", type, limit],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      try {
        let q = supabase.from("products").select(LIST_COLS);
        if (type === "budget") {
          q = q.lte("price", 500).order("price", { ascending: true });
        } else if (type === "new") {
          q = q.order("created_at", { ascending: false });
        } else {
          q = q.order("sort_order", { ascending: false });
        }
        const { data } = await q.limit(limit);
        if (data && data.length > 0) return data;
      } catch (err) {
        console.warn("Could not fetch suggestions products:", err);
      }
      return DEMO_ART_PRODUCTS.slice(0, limit);
    },
  });

export const productsCategoriesOptions = () =>
  queryOptions({
    queryKey: ["products-categories"],
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("category")
        .not("category", "is", null)
        .limit(2000);
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => r.category && set.add(r.category));
      return Array.from(set);
    },
  });

import { parseSearchTokens, scoreProductRelevance } from "./search";
import { searchFuzzyCatalog } from "./fuzzy-search";
import { getSubcategoryBySlug } from "@/data/artCategories";

export interface ProductsFilterParams {
  category?: string | null;
  subcategory?: string | null;
  search?: string | null;
  minPrice?: number | null;
  maxPrice?: number | null;
  inStockOnly?: boolean | null;
  sort?: string | null;
}

export const productsInfiniteOptions = (
  params?: ProductsFilterParams | string | null,
  legacySubcategory?: string | null
) => {
  const filter: ProductsFilterParams =
    typeof params === "object" && params !== null
      ? params
      : { category: params as string | null, subcategory: legacySubcategory };

  let {
    category,
    subcategory,
    search,
    minPrice,
    maxPrice,
    inStockOnly,
    sort = "featured",
  } = filter;

  // Auto-resolve if subcategory slug was passed as category (e.g. category="acrylic-colour")
  if (category && category !== "all" && (!subcategory || subcategory === "all")) {
    const subMatch = getSubcategoryBySlug(category);
    if (subMatch) {
      category = subMatch.parent.slug;
      subcategory = subMatch.sub.slug;
    }
  } else if ((!category || category === "all") && subcategory && subcategory !== "all") {
    const subMatch = getSubcategoryBySlug(subcategory);
    if (subMatch) {
      category = subMatch.parent.slug;
    }
  }

  const cleanSearch = (search || "").trim();

  return infiniteQueryOptions({
    queryKey: [
      "products",
      "infinite",
      category ?? "all",
      subcategory ?? "all",
      cleanSearch,
      minPrice ?? "all",
      maxPrice ?? "all",
      inStockOnly ? "instock" : "all",
      sort ?? "featured",
    ],
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const from = (pageParam as number) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      try {
        let q = supabase
          .from("products")
          .select(LIST_COLS);

        if (category && category !== "all") {
          q = q.eq("category", category);
        }
        if (subcategory && subcategory !== "all") {
          q = q.eq("subcategory", subcategory);
        }
        if (minPrice != null && minPrice > 0) {
          q = q.gte("price", minPrice);
        }
        if (maxPrice != null && maxPrice > 0) {
          q = q.lte("price", maxPrice);
        }
        if (inStockOnly) {
          q = q.gt("stock", 0);
        }

        if (cleanSearch) {
          const tokens = parseSearchTokens(cleanSearch);

          // If dimension is detected and sort is default/featured, prioritize dimension matches + keyword matches
          if (tokens.dimVariants.length > 0 && (sort === "featured" || !sort)) {
            const dimClauses = tokens.dimVariants.slice(0, 4).map((d) => `name.ilike.%${d}%`).join(",");
            let dimQ = supabase.from("products").select(LIST_COLS).or(dimClauses);
            if (category && category !== "all") dimQ = dimQ.eq("category", category);
            if (subcategory && subcategory !== "all") dimQ = dimQ.eq("subcategory", subcategory);
            if (minPrice != null && minPrice > 0) dimQ = dimQ.gte("price", minPrice);
            if (maxPrice != null && maxPrice > 0) dimQ = dimQ.lte("price", maxPrice);
            if (inStockOnly) dimQ = dimQ.gt("stock", 0);

            const { data: dimItems } = await dimQ.limit(80);

            let kwItems: any[] = [];
            if (tokens.keywords.length > 0) {
              const kwClauses = tokens.keywords
                .map((k) => `name.ilike.%${k}%,category.ilike.%${k}%,subcategory.ilike.%${k}%`)
                .join(",");
              let kwQ = supabase.from("products").select(LIST_COLS).or(kwClauses);
              if (category && category !== "all") kwQ = kwQ.eq("category", category);
              if (subcategory && subcategory !== "all") kwQ = kwQ.eq("subcategory", subcategory);
              if (minPrice != null && minPrice > 0) kwQ = kwQ.gte("price", minPrice);
              if (maxPrice != null && maxPrice > 0) kwQ = kwQ.lte("price", maxPrice);
              if (inStockOnly) kwQ = kwQ.gt("stock", 0);

              const { data } = await kwQ.limit(80);
              kwItems = data || [];
            }

            const map = new Map<string, any>();
            for (const p of [...(dimItems || []), ...kwItems]) {
              if (!map.has(p.id)) map.set(p.id, p);
            }

            const allScored = Array.from(map.values()).sort(
              (a, b) => scoreProductRelevance(b, tokens) - scoreProductRelevance(a, tokens)
            );

            const pageSlice = allScored.slice(from, to + 1);
            if (pageSlice.length > 0) {
              return pageSlice;
            }
          }

          // Fallback or non-dimension query
          const orClauses: string[] = [];
          for (const w of tokens.keywords) {
            orClauses.push(
              `name.ilike.%${w}%`,
              `category.ilike.%${w}%`,
              `subcategory.ilike.%${w}%`,
              `description.ilike.%${w}%`
            );
          }
          for (const d of tokens.dimVariants.slice(0, 4)) {
            orClauses.push(`name.ilike.%${d}%`);
          }
          if (orClauses.length === 0) {
            orClauses.push(`name.ilike.%${cleanSearch}%`, `description.ilike.%${cleanSearch}%`);
          }
          q = q.or(orClauses.join(","));
        }

        // Apply sorting
        if (sort === "price-asc") {
          q = q.order("price", { ascending: true });
        } else if (sort === "price-desc") {
          q = q.order("price", { ascending: false });
        } else if (sort === "name-asc") {
          q = q.order("name", { ascending: true });
        } else if (sort === "newest") {
          q = q.order("created_at", { ascending: false });
        } else {
          q = q.order("product_level", { ascending: true }).order("sort_order", { ascending: true });
        }

        const { data } = await q.range(from, to);

        if (data && data.length > 0) {
          if (cleanSearch && (sort === "featured" || !sort)) {
            const tokens = parseSearchTokens(cleanSearch);
            const scored = [...data].sort((a, b) => {
              const scoreA = scoreProductRelevance(a, tokens);
              const scoreB = scoreProductRelevance(b, tokens);
              return scoreB - scoreA;
            });
            return scored;
          }
          return data;
        }

        // If no direct DB results found, fall back to Fuse.js fuzzy search
        if ((!data || data.length === 0) && from === 0 && cleanSearch) {
          const fuzzy = await searchFuzzyCatalog(cleanSearch, {
            limit: PAGE_SIZE,
            category: category && category !== "all" ? category : undefined,
          });
          if (fuzzy.length > 0) {
            return fuzzy;
          }
        }
      } catch (err) {
        console.warn("Could not fetch infinite products from Supabase:", err);
      }
      if (pageParam === 0 && !cleanSearch) {
        let prods = DEMO_ART_PRODUCTS;
        if (category && category !== "all") {
          prods = prods.filter((p) => p.category === category);
        }
        if (subcategory && subcategory !== "all") {
          prods = prods.filter((p) => p.subcategory === subcategory);
        }
        return prods;
      }
      return [];
    },
    getNextPageParam: (last, all) =>
      last.length < PAGE_SIZE ? undefined : all.length,
  });
};

export const productsSearchCountOptions = (params: ProductsFilterParams) =>
  queryOptions({
    queryKey: ["products-search-count", params],
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    queryFn: async () => {
      let { category, subcategory, search, minPrice, maxPrice, inStockOnly } = params;

      if (category && category !== "all" && (!subcategory || subcategory === "all")) {
        const subMatch = getSubcategoryBySlug(category);
        if (subMatch) {
          category = subMatch.parent.slug;
          subcategory = subMatch.sub.slug;
        }
      } else if ((!category || category === "all") && subcategory && subcategory !== "all") {
        const subMatch = getSubcategoryBySlug(subcategory);
        if (subMatch) {
          category = subMatch.parent.slug;
        }
      }

      const cleanSearch = (search || "").trim();
      let q = supabase.from("products").select("id", { count: "exact", head: true });

      if (category && category !== "all") q = q.eq("category", category);
      if (subcategory && subcategory !== "all") q = q.eq("subcategory", subcategory);
      if (minPrice != null && minPrice > 0) q = q.gte("price", minPrice);
      if (maxPrice != null && maxPrice > 0) q = q.lte("price", maxPrice);
      if (inStockOnly) q = q.gt("stock", 0);

      if (cleanSearch) {
        const tokens = parseSearchTokens(cleanSearch);
        const orClauses: string[] = [];
        for (const w of tokens.keywords) {
          orClauses.push(
            `name.ilike.%${w}%`,
            `category.ilike.%${w}%`,
            `subcategory.ilike.%${w}%`,
            `description.ilike.%${w}%`
          );
        }
        for (const d of tokens.dimVariants.slice(0, 4)) {
          orClauses.push(`name.ilike.%${d}%`);
        }
        if (orClauses.length === 0) {
          orClauses.push(`name.ilike.%${cleanSearch}%`);
        }
        q = q.or(orClauses.join(","));
      }

      const { count } = await q;
      if ((!count || count === 0) && cleanSearch) {
        const fuzzy = await searchFuzzyCatalog(cleanSearch, {
          limit: 50,
          category: category && category !== "all" ? category : undefined,
        });
        if (fuzzy.length > 0) {
          return fuzzy.length;
        }
      }
      return count ?? 0;
    },
  });

export const relatedProductsOptions = (
  category: string | null,
  excludeId: string,
) =>
  queryOptions({
    queryKey: ["related-products", category ?? "all", excludeId],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      try {
        let q = supabase
          .from("products")
          .select(LIST_COLS)
          .neq("id", excludeId)
          .order("product_level", { ascending: true })
          .order("sort_order", { ascending: true })
          .limit(8);
        if (category) q = q.eq("category", category);
        const { data } = await q;
        if (data && data.length > 0) return data;
      } catch (err) {
        console.warn("Could not fetch related products from Supabase:", err);
      }
      return DEMO_ART_PRODUCTS.filter((p) => p.id !== excludeId).slice(0, 8);
    },
  });

export const productBySlugOptions = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("products")
          .select(DETAIL_COLS)
          .eq("slug", slug)
          .maybeSingle();
        if (!error && data) return data;
      } catch (err) {
        console.warn("Could not fetch product from Supabase:", err);
      }
      const demo = DEMO_ART_PRODUCTS.find((p) => p.slug === slug);
      if (demo) {
        return {
          id: demo.id,
          slug: demo.slug,
          name: demo.name,
          price: demo.price,
          image_url: demo.image_url,
          images: [demo.image_url],
          unit: demo.unit,
          category: demo.category,
          featured: demo.featured,
          stock: demo.inStock ? 50 : 0,
          description: demo.description,
          product_level: 1,
          sort_order: 1,
          weight_variants: [],
          discount_amount: demo.discount_amount,
        };
      }
      return null;
    },
  });
