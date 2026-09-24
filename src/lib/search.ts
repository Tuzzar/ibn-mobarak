import { supabase } from "@/integrations/supabase/external";
import { expandSearchTokens, type QueryExpansionResult } from "./search-dictionary";
import { searchFuzzyCatalog } from "./fuzzy-search";

export interface DimPair {
  w: string;
  h: string;
  pattern: RegExp;
}

export interface SearchTokens {
  original: string;
  cleanQuery: string;
  normalized: string;
  didYouMean: string | null;
  dimVariants: string[];
  dimPairs: DimPair[];
  keywords: string[];
}

export function parseSearchTokens(raw: string): SearchTokens {
  const expansion = expandSearchTokens(raw);

  return {
    original: expansion.original,
    cleanQuery: expansion.original.toLowerCase(),
    normalized: expansion.normalized,
    didYouMean: expansion.didYouMean,
    dimVariants: expansion.dimVariants,
    dimPairs: expansion.dimPairs,
    keywords: expansion.expandedKeywords,
  };
}

export function scoreProductRelevance(p: any, tokens: SearchTokens): number {
  let score = 0;
  const name = (p.name || "").toLowerCase();
  const cat = (p.category || "").toLowerCase();
  const subcat = (p.subcategory || "").toLowerCase();
  const desc = (p.description || "").toLowerCase();
  const raw = tokens.cleanQuery;
  const norm = tokens.normalized.toLowerCase();

  // 1. Exact full query in title
  if (name.includes(raw) || (norm && name.includes(norm))) {
    score += 400;
  }

  // 2. Strict dimension matching with word boundaries (e.g. 8x8 vs 10x18)
  if (tokens.dimPairs.length > 0) {
    let matchedDim = false;
    for (const pair of tokens.dimPairs) {
      if (pair.pattern.test(name)) {
        score += 500;
        matchedDim = true;
        break;
      }
    }
    if (!matchedDim) {
      // Check if title mentions numbers
      const digits = raw.match(/\d+/g) || [];
      const hasAllDigits = digits.length > 0 && digits.every((d) => name.includes(d));
      if (hasAllDigits) score += 30;
    }
  }

  // 3. Keyword matching (including expanded synonyms/typos)
  let matchedTitleWords = 0;
  for (const w of tokens.keywords) {
    if (name.includes(w)) {
      score += 80;
      matchedTitleWords++;
    } else if (cat.includes(w) || subcat.includes(w)) {
      score += 40;
    } else if (desc.includes(w)) {
      score += 15;
    }
  }

  if (tokens.keywords.length > 0 && matchedTitleWords === tokens.keywords.length) {
    score += 120;
  }

  return score;
}

export async function searchLiveSuggestions(
  rawQuery: string,
  limit = 6
): Promise<Array<any & { _score: number; _didYouMean?: string | null }>> {
  const q = rawQuery.trim();
  if (!q || q.length < 2) return [];

  const tokens = parseSearchTokens(q);
  const selectCols = "id, slug, name, price, discount_amount, image_url, category, stock";

  try {
    let dimResults: any[] = [];
    if (tokens.dimVariants.length > 0) {
      const dimClauses = tokens.dimVariants.slice(0, 4).map((d) => `name.ilike.%${d}%`).join(",");
      const { data } = await supabase
        .from("products")
        .select(selectCols)
        .or(dimClauses)
        .limit(30);
      dimResults = data || [];
    }

    let kwResults: any[] = [];
    if (tokens.keywords.length > 0) {
      const kwClauses = tokens.keywords
        .slice(0, 5) // Use up to top 5 expanded keywords
        .map((k) => `name.ilike.%${k}%,category.ilike.%${k}%`)
        .join(",");
      const { data } = await supabase
        .from("products")
        .select(selectCols)
        .or(kwClauses)
        .limit(30);
      kwResults = data || [];
    } else if (tokens.dimVariants.length === 0) {
      const { data } = await supabase
        .from("products")
        .select(selectCols)
        .ilike("name", `%${q}%`)
        .limit(30);
      kwResults = data || [];
    }

    // Merge deduplicated
    const combinedMap = new Map<string, any>();
    for (const p of [...dimResults, ...kwResults]) {
      if (!combinedMap.has(p.id)) {
        combinedMap.set(p.id, p);
      }
    }

    let merged = Array.from(combinedMap.values());

    // Fallback: If 0 or few results found from direct DB match, run Fuse.js fuzzy engine
    if (merged.length < limit) {
      try {
        const fuzzyMatches = await searchFuzzyCatalog(q, { limit: limit - merged.length });
        for (const fp of fuzzyMatches) {
          if (!combinedMap.has(fp.id)) {
            combinedMap.set(fp.id, fp);
          }
        }
        merged = Array.from(combinedMap.values());
      } catch (fuzzyErr) {
        console.warn("Fuzzy fallback error:", fuzzyErr);
      }
    }

    if (merged.length === 0) return [];

    const scored = merged.map((p) => ({
      ...p,
      _score: scoreProductRelevance(p, tokens),
      _didYouMean: tokens.didYouMean,
    }));

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, limit);
  } catch (err) {
    console.warn("Live search error:", err);
    return [];
  }
}
