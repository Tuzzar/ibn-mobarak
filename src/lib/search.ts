import { supabase } from "@/integrations/supabase/external";

export interface DimPair {
  w: string;
  h: string;
  pattern: RegExp;
}

export interface SearchTokens {
  original: string;
  cleanQuery: string;
  dimVariants: string[];
  dimPairs: DimPair[];
  keywords: string[];
}

export function parseSearchTokens(raw: string): SearchTokens {
  const original = (raw || "").trim();
  const lower = original.toLowerCase();

  // Detect dimension patterns like 8/8, 8x8, 8*8, 10/12, 14x28, 30x40
  const dimRegex = /(\d+(?:\.\d+)?)\s*[\/xX*]\s*(\d+(?:\.\d+)?)/g;
  const dimVariants: string[] = [];
  const dimPairs: DimPair[] = [];
  let match: RegExpExecArray | null;

  while ((match = dimRegex.exec(lower)) !== null) {
    const w = match[1];
    const h = match[2];

    dimVariants.push(
      `${w}x${h}`,
      `${w}/${h}`,
      `${w}*${h}`,
      `${w} x ${h}`,
      `${w}X${h}`,
    );

    // Escape for regex
    const escW = w.replace(".", "\\.");
    const escH = h.replace(".", "\\.");
    dimPairs.push({
      w,
      h,
      pattern: new RegExp(`(?:^|[^\\d])${escW}\\s*[xX/*]\\s*${escH}(?:[^\\d]|$)`, "i"),
    });
  }

  // Extract other keywords
  const cleanWords = lower
    .replace(/(\d+(?:\.\d+)?)\s*[\/xX*]\s*(\d+(?:\.\d+)?)/g, " ")
    .replace(/[^\w\u0980-\u09FF\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  return {
    original,
    cleanQuery: lower,
    dimVariants: Array.from(new Set(dimVariants)),
    dimPairs,
    keywords: Array.from(new Set(cleanWords)),
  };
}

export function scoreProductRelevance(p: any, tokens: SearchTokens): number {
  let score = 0;
  const name = (p.name || "").toLowerCase();
  const cat = (p.category || "").toLowerCase();
  const subcat = (p.subcategory || "").toLowerCase();
  const desc = (p.description || "").toLowerCase();
  const raw = tokens.cleanQuery;

  // 1. Exact full query in title
  if (name.includes(raw)) {
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

  // 3. Keyword matching
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

export async function searchLiveSuggestions(rawQuery: string, limit = 6) {
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
        .slice(0, 3)
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

    const merged = Array.from(combinedMap.values());
    if (merged.length === 0) return [];

    const scored = merged.map((p) => ({
      ...p,
      _score: scoreProductRelevance(p, tokens),
    }));

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, limit);
  } catch (err) {
    console.warn("Live search error:", err);
    return [];
  }
}
