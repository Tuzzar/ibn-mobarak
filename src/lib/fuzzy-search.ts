import Fuse from "fuse.js";
import { supabase } from "@/integrations/supabase/external";
import { expandSearchTokens } from "./search-dictionary";

export interface SearchableProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  discount_amount?: number | null;
  image_url: string | null;
  category: string | null;
  subcategory: string | null;
  stock?: number | null;
}

// In-memory catalog cache for client-side instant fuzzy search
let cachedProducts: SearchableProduct[] | null = null;
let lastFetchTime = 0;
let fuseInstance: Fuse<SearchableProduct> | null = null;
let fetchPromise: Promise<SearchableProduct[]> | null = null;

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Loads lightweight searchable catalog of active products
 */
export async function getSearchableCatalog(): Promise<SearchableProduct[]> {
  const now = Date.now();
  if (cachedProducts && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedProducts;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, slug, name, price, discount_amount, image_url, category, subcategory, stock")
        .order("sort_order", { ascending: true })
        .limit(4000);

      if (error) {
        console.warn("Failed to fetch searchable products catalog:", error);
        return cachedProducts || [];
      }

      cachedProducts = (data || []) as SearchableProduct[];
      lastFetchTime = Date.now();

      // Initialize Fuse.js index
      fuseInstance = new Fuse(cachedProducts, {
        keys: [
          { name: "name", weight: 0.65 },
          { name: "category", weight: 0.2 },
          { name: "subcategory", weight: 0.15 },
        ],
        threshold: 0.38, // 0.0 = perfect match, 1.0 = match anything; 0.38 allows 1-2 typos
        distance: 100,
        includeScore: true,
        ignoreLocation: true,
        minMatchCharLength: 2,
      });

      return cachedProducts;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

/**
 * Searches the catalog using fuzzy logic, dictionary expansion, and dimension checking.
 */
export async function searchFuzzyCatalog(
  rawQuery: string,
  options?: { limit?: number; category?: string }
): Promise<Array<SearchableProduct & { _score: number; _matchedBy?: string }>> {
  const q = rawQuery.trim();
  if (!q || q.length < 2) return [];

  const limit = options?.limit || 10;
  const targetCategory = options?.category;

  const catalog = await getSearchableCatalog();
  if (!catalog || catalog.length === 0 || !fuseInstance) return [];

  const expansion = expandSearchTokens(q);

  // 1. Try search with expanded keywords and normalized query
  const searchCandidates = [
    expansion.normalized,
    expansion.original,
    ...expansion.expandedKeywords,
  ].filter(Boolean);

  const seenIds = new Set<string>();
  const results: Array<SearchableProduct & { _score: number; _matchedBy: string }> = [];

  for (const queryVariant of searchCandidates) {
    const fuseMatches = fuseInstance.search(queryVariant, { limit: limit * 2 });

    for (const match of fuseMatches) {
      const p = match.item;
      if (seenIds.has(p.id)) continue;

      if (targetCategory && targetCategory !== "all" && p.category !== targetCategory) {
        continue;
      }

      // Convert Fuse score (0 = best) to positive score
      const fuseScore = match.score ?? 0.5;
      let relevanceScore = Math.max(10, Math.floor((1 - fuseScore) * 1000));

      // Extra bonus for dimension matches
      if (expansion.dimPairs.length > 0) {
        for (const pair of expansion.dimPairs) {
          if (pair.pattern.test(p.name)) {
            relevanceScore += 500;
            break;
          }
        }
      }

      seenIds.add(p.id);
      results.push({
        ...p,
        _score: relevanceScore,
        _matchedBy: "fuzzy",
      });

      if (results.length >= limit * 2) break;
    }

    if (results.length >= limit) break;
  }

  // Sort highest score first
  results.sort((a, b) => b._score - a._score);
  return results.slice(0, limit);
}
