/**
 * Bilingual Art & Craft Terminology & Typo Dictionary
 * Designed specifically for Ibn Mobarak Art Gallery
 * Handles:
 * - English typos (e.g. acralic, canvus, brash, montmarte)
 * - Bengali Unicode to English & vice-versa (e.g. তুলি -> brush, ক্যানভাস -> canvas, অ্যাক্রিলিক -> acrylic)
 * - Banglish / Phonetic transliteration (e.g. kenvas, ezel, rong, tuli)
 * - Dimension patterns (e.g. 8/8, 8*8, 8x8)
 */

export interface QueryExpansionResult {
  original: string;
  normalized: string;
  didYouMean: string | null;
  expandedKeywords: string[];
  dimVariants: string[];
  dimPairs: Array<{ w: string; h: string; pattern: RegExp }>;
}

export function getProductLevelRank(level?: string | null): number {
  if (!level) return 99;
  const upper = String(level).trim().toUpperCase();
  const index = ["A", "B", "C", "D", "E", "F"].indexOf(upper);
  return index >= 0 ? index : 99;
}

// High-frequency typos and phonetic variants -> Canonical English term
export const COMMON_TYPOS: Record<string, string> = {
  // Acrylic
  "acralic": "acrylic",
  "acrilic": "acrylic",
  "acrylik": "acrylic",
  "akrilik": "acrylic",
  "acryilic": "acrylic",
  "akrylic": "acrylic",
  "একরেলিক": "acrylic",
  "অ্যাক্রিলিক": "acrylic",
  "এক্ৰিলিক": "acrylic",
  "এক্রেলিক": "acrylic",
  "অ্যাকরেলিক": "acrylic",

  // Canvas
  "canvus": "canvas",
  "canvis": "canvas",
  "canvs": "canvas",
  "kenvas": "canvas",
  "kanvas": "canvas",
  "canvass": "canvas",
  "ক্যানভাস": "canvas",
  "কেনভাস": "canvas",
  "কেনবাস": "canvas",

  // Brush / তুলি
  "brash": "brush",
  "bursh": "brush",
  "brsuh": "brush",
  "brsh": "brush",
  "bruh": "brush",
  "ব্রাশ": "brush",
  "ব্রাস": "brush",
  "তুলি": "brush",
  "টুলি": "brush",

  // Easel / ইজেল
  "eajel": "easel",
  "ezel": "easel",
  "easle": "easel",
  "esel": "easel",
  "ইজেল": "easel",
  "িজেল": "easel",

  // Water colour
  "watercoler": "water colour",
  "watercolor": "water colour",
  "watercolour": "water colour",
  "water-color": "water colour",
  "water clr": "water colour",
  "ওয়াটারকালার": "water colour",
  "ওয়াটারকালারস": "water colour",
  "জলরং": "water colour",
  "জলরঙ": "water colour",

  // Oil colour
  "oilcoler": "oil colour",
  "oilcolor": "oil colour",
  "oilcolour": "oil colour",
  "oil-color": "oil colour",
  "oil clr": "oil colour",
  "অয়েলকালার": "oil colour",
  "তেলরং": "oil colour",
  "তেলরঙ": "oil colour",

  // Gouache
  "guash": "gouache",
  "gauche": "gouache",
  "gouash": "gouache",
  "guache": "gouache",
  "গোয়াশ": "gouache",
  "গোয়াশ": "gouache",

  // Calligraphy
  "caligraphy": "calligraphy",
  "caligrapi": "calligraphy",
  "calligrapi": "calligraphy",
  "kaligrafi": "calligraphy",
  "kaligraphy": "calligraphy",
  "ক্যালিগ্রাফি": "calligraphy",
  "ক্যালিগ্রাফী": "calligraphy",
  "কেলিগ্রাফি": "calligraphy",
  "দাওয়াত": "calligraphy dawat ink",
  "দাওয়াত": "calligraphy dawat ink",
  "লিকা": "calligraphy lika",
  "হেন্দাম": "calligraphy qalam",

  // Palette
  "pallete": "palette",
  "pallette": "palette",
  "palet": "palette",
  "প্লেট": "palette",
  "প্যালেট": "palette",

  // Sketchbook / Paper
  "sketchbok": "sketchbook",
  "sktechbook": "sketchbook",
  "skecthbook": "sketchbook",
  "স্কেচবুক": "sketchbook",
  "স্কেচ": "sketch",
  "ড্রয়িং": "drawing",
  "ড্রইং": "drawing",

  // Marker
  "marcar": "marker",
  "markar": "marker",
  "মার্কার": "marker",

  // Gesso / Varnish / Mediums
  "geso": "gesso",
  "jesso": "gesso",
  "জেসো": "gesso",
  "varnis": "varnish",
  "barnish": "varnish",
  "বার্নিশ": "varnish",
  "ভার্নিশ": "varnish",
  "মডেলিং": "modeling paste",
  "টেক্সচার": "texture paste",
  "রেজিন": "resin",
  "রেসিন": "resin",
  "লিনসিড": "linseed oil",

  // Craft & Clay
  "lipan": "lippan",
  "লি্পান": "lippan",
  "লিপ্পান": "lippan",
  "ক্লে": "clay",
  "টেরাকোটা": "terracotta clay",
  "মিরর": "mirror",
  "মডপজ": "mod podge",
  "মডপজস": "mod podge",

  // Brands
  "montmarte": "mont marte",
  "mount marte": "mont marte",
  "montmart": "mont marte",
  "মন্টমার্ট": "mont marte",
  "মন্ট মার্টে": "mont marte",
  "keepsmiling": "keep smiling",
  "keep-smiling": "keep smiling",
  "মারাবু": "marabu",
  "মেরাবু": "marabu",
  "পেবিও": "pebeo",
  "মেরিস": "maries",
  "faber castell": "faber-castell",
  "fabercastell": "faber-castell",
  "giorgione": "giorgione",
  "জরজিওন": "giorgione",

  // General Art terms
  "কালার": "colour",
  "পেইন্ট": "paint",
  "রং": "colour",
  "রঙ": "colour",
  "ফ্রেম": "frame",
  "পেন্সিল": "pencil",
  "ইরেজার": "eraser",
};

// Synonym / Expansion clusters:
export const SYNONYM_CLUSTERS: Array<string[]> = [
  ["acrylic", "colour", "paint", "অ্যাক্রিলিক"],
  ["canvas", "board", "stretched", "panel", "ক্যানভাস"],
  ["brush", "round", "flat", "filbert", "ব্রাশ", "তুলি"],
  ["easel", "stand", "tripod", "ইজেল"],
  ["water colour", "watercolor", "জলরং", "watercolour"],
  ["oil colour", "oil color", "তেলরং"],
  ["gouache", "গোয়াশ"],
  ["calligraphy", "qalam", "nib", "ink", "ক্যালিগ্রাফি"],
  ["sketchbook", "paper", "pad", "স্কেচবুক"],
  ["marker", "alcohol marker", "acrylic marker", "মার্কার"],
  ["gesso", "primer", "জেসো"],
  ["varnish", "gloss", "matte", "বার্নিশ"],
  ["lippan", "mirror", "লিপ্পান"],
  ["clay", "air dry", "ক্লে"],
  ["mont marte", "montmarte"],
  ["keep smiling", "keepsmiling"],
];

/**
 * Parses dimensions such as 8/8, 8*8, 8x8, 10/12, 14*28, 30x40.
 */
export function extractDimensionVariants(raw: string): {
  dimVariants: string[];
  dimPairs: Array<{ w: string; h: string; pattern: RegExp }>;
} {
  const lower = raw.toLowerCase();
  const dimRegex = /(\d+(?:\.\d+)?)\s*[\/xX*]\s*(\d+(?:\.\d+)?)/g;
  const dimVariants: string[] = [];
  const dimPairs: Array<{ w: string; h: string; pattern: RegExp }> = [];
  let match: RegExpExecArray | null;

  while ((match = dimRegex.exec(lower)) !== null) {
    const w = match[1];
    const h = match[2];

    dimVariants.push(
      `${w}x${h}`,
      `${w}/${h}`,
      `${w}*${h}`,
      `${w} x ${h}`,
      `${w}X${h}`
    );

    const escW = w.replace(".", "\\.");
    const escH = h.replace(".", "\\.");
    dimPairs.push({
      w,
      h,
      pattern: new RegExp(`(?:^|[^\\d])${escW}\\s*[xX/*]\\s*${escH}(?:[^\\d]|$)`, "i"),
    });
  }

  return {
    dimVariants: Array.from(new Set(dimVariants)),
    dimPairs,
  };
}

/**
 * Normalizes query and expands with typos, Bengali phonetics, and synonyms.
 */
export function expandSearchTokens(raw: string): QueryExpansionResult {
  const original = (raw || "").trim();
  const lower = original.toLowerCase();

  const { dimVariants, dimPairs } = extractDimensionVariants(lower);

  // Split words by space and punctuation
  const words = lower
    .replace(/(\d+(?:\.\d+)?)\s*[\/xX*]\s*(\d+(?:\.\d+)?)/g, " ")
    .replace(/[^\w\u0980-\u09FF\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  const expanded = new Set<string>();
  let didYouMean: string | null = null;
  const correctedWords: string[] = [];

  for (const word of words) {
    expanded.add(word);

    // 1. Check exact typo dictionary
    if (COMMON_TYPOS[word]) {
      const canonical = COMMON_TYPOS[word];
      canonical.split(/\s+/).forEach((c) => expanded.add(c.toLowerCase()));
      correctedWords.push(canonical);
      if (!didYouMean) {
        didYouMean = canonical;
      }
    } else {
      correctedWords.push(word);
    }

    // 2. Check compound without spaces (e.g. montmarte -> mont marte)
    if (COMMON_TYPOS[lower]) {
      const canonical = COMMON_TYPOS[lower];
      canonical.split(/\s+/).forEach((c) => expanded.add(c.toLowerCase()));
      if (!didYouMean) {
        didYouMean = canonical;
      }
    }

    // 3. Synonym expansion
    for (const cluster of SYNONYM_CLUSTERS) {
      if (cluster.some((term) => term.toLowerCase() === word || word.includes(term.toLowerCase()))) {
        // Add primary English equivalent from cluster
        cluster.slice(0, 3).forEach((item) => expanded.add(item.toLowerCase()));
      }
    }
  }

  // If didYouMean is identical to original, clear it
  if (didYouMean && didYouMean.toLowerCase() === lower) {
    didYouMean = null;
  }

  return {
    original,
    normalized: correctedWords.join(" "),
    didYouMean,
    expandedKeywords: Array.from(expanded),
    dimVariants,
    dimPairs,
  };
}
