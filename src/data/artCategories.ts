export type SubCategory = {
  id: string;
  name: string;
  bengali: string;
  slug: string;
  description?: string;
};

export type MasterCategory = {
  id: string;
  name: string;
  bengali: string;
  slug: string;
  iconName: string;
  image: string;
  count: string;
  description: string;
  featured?: boolean;
  subcategories: SubCategory[];
};

export const MASTER_ART_CATEGORIES: MasterCategory[] = [
  {
    id: "paints",
    name: "Paints & Colours",
    bengali: "কালার ও পেইন্টস",
    slug: "paints",
    iconName: "Palette",
    image: "https://artlabbd.com/wp-content/uploads/2024/08/Mont-Marte-Acrylic-Colour-Pastel-Colours-48pc-x-36ml-MSCP4836_V01-L3_c57a7353-cd68-4bef-b13f-f4b931e964d3-600x600.jpg",
    count: "45+ আইটেম",
    description: "অ্যাক্রিলিক, অয়েল, ওয়াটার কালার, গোয়াশ ও আর্ট মার্কারের সেরা কালেকশন",
    featured: true,
    subcategories: [
      { id: "acrylic-colour", name: "Acrylic Colour", bengali: "অ্যাক্রিলিক কালার", slug: "acrylic-colour" },
      { id: "oil-colour", name: "Oil Colour", bengali: "অয়েল কালার", slug: "oil-colour" },
      { id: "water-colour", name: "Water Colour", bengali: "ওয়াটার কালার / জলরং", slug: "water-colour" },
      { id: "gouache-colour", name: "Gouache Colour", bengali: "গোয়াশ কালার", slug: "gouache-colour" },
      { id: "poster-fabric-colour", name: "Poster & Fabric Colour", bengali: "পোস্টার ও ফেব্রিক কালার", slug: "poster-fabric-colour" },
      { id: "glass-ceramic-colour", name: "Glass & Ceramic Paint", bengali: "গ্লাস ও সিরামিক পেইন্ট", slug: "glass-ceramic-colour" },
      { id: "metallic-neon-paints", name: "Metallic & Neon Paints", bengali: "মেটালিক ও নিয়ন কালার", slug: "metallic-neon-paints" },
      { id: "acrylic-markers", name: "Acrylic & Art Markers", bengali: "অ্যাক্রিলিক ও আর্ট মার্কার", slug: "acrylic-markers" },
    ],
  },
  {
    id: "brushes",
    name: "Brushes & Tools",
    bengali: "ব্রাশ ও আর্ট টুলস",
    slug: "brushes",
    iconName: "Brush",
    image: "https://cdn.ahbab.art/public/hero-banners/brushes-tools-category-1783332996730.webp",
    count: "30+ আইটেম",
    description: "পেশাদার শিল্পীদের জন্য রাউন্ড, ফ্ল্যাট, ফিলবার্ট ব্রাশ সেট ও প্যালেট নাইফ",
    featured: true,
    subcategories: [
      { id: "round-brushes", name: "Round Brushes", bengali: "রাউন্ড ব্রাশ", slug: "round-brushes" },
      { id: "flat-brushes", name: "Flat & Bright Brushes", bengali: "ফ্ল্যাট ব্রাশ", slug: "flat-brushes" },
      { id: "filbert-fan-brushes", name: "Filbert & Fan Brushes", bengali: "ফিলবার্ট ও ফ্যান ব্রাশ", slug: "filbert-fan-brushes" },
      { id: "detail-liner-brushes", name: "Detail & Liner Brushes", bengali: "ডিটেইলিং ও লাইনার ব্রাশ", slug: "detail-liner-brushes" },
      { id: "wash-mop-brushes", name: "Wash & Mop Brushes", bengali: "ওয়াশ ও মপ ব্রাশ", slug: "wash-mop-brushes" },
      { id: "brush-sets", name: "Mixed Brush Sets", bengali: "কমপ্লিট ব্রাশ সেট", slug: "brush-sets" },
      { id: "palette-knives", name: "Palette Knives", bengali: "প্যালেট নাইফ ও স্ক্র্যাপার", slug: "palette-knives" },
      { id: "palettes-washers", name: "Palettes & Washers", bengali: "কালার প্যালেট ও ব্রাশ ওয়াশার", slug: "palettes-washers" },
    ],
  },
  {
    id: "canvas",
    name: "Canvas & Boards",
    bengali: "ক্যানভাস ও বোর্ড",
    slug: "canvas",
    iconName: "Frame",
    image: "https://cdn.ahbab.art/public/category/ZYRFvjVPIyIcN_W1ZlU.webp",
    count: "25+ আইটেম",
    description: "১০০% প্রি-প্রাইমড কটন স্ট্রেচড ক্যানভাস, ক্যানভাস বোর্ড ও রাউন্ড ক্যানভাস",
    featured: true,
    subcategories: [
      { id: "stretched-canvas", name: "Stretched Canvas", bengali: "স্ট্রেচড ক্যানভাস", slug: "stretched-canvas" },
      { id: "canvas-panels", name: "Canvas Panels & Boards", bengali: "ক্যানভাস প্যানেল ও বোর্ড", slug: "canvas-panels" },
      { id: "round-oval-canvas", name: "Round & Oval Canvas", bengali: "রাউন্ড ও ওভাল ক্যানভাস", slug: "round-oval-canvas" },
      { id: "canvas-pads-rolls", name: "Canvas Pads & Rolls", bengali: "ক্যানভাস প্যাড ও রোল", slug: "canvas-pads-rolls" },
      { id: "mini-canvas-easel", name: "Mini Canvas with Easel", bengali: "মিনি ক্যানভাস উইথ ইজেল", slug: "mini-canvas-easel" },
    ],
  },
  {
    id: "paper-sketch",
    name: "Paper & Sketchbooks",
    bengali: "কাগজ ও স্কেচবুক",
    slug: "paper-sketch",
    iconName: "BookOpen",
    image: "https://cdn.ahbab.art/public/category/x3jbS6CLrEZ9VKVlhZS.webp",
    count: "22+ আইটেম",
    description: "৩০০ জিএসএম ওয়াটার কালার পেপার, স্কেচবুক, অ্যাক্রিলিক ও মিক্সড মিডিয়া প্যাড",
    featured: true,
    subcategories: [
      { id: "sketchbooks", name: "Sketchbooks & Journals", bengali: "স্কেচবুক ও হার্ডবাউন্ড জার্নাল", slug: "sketchbooks" },
      { id: "watercolor-paper", name: "Watercolor Paper 300gsm", bengali: "ওয়াটার কালার পেপার (৩০০gsm)", slug: "watercolor-paper" },
      { id: "acrylic-paper", name: "Acrylic Paper Pads", bengali: "অ্যাক্রিলিক পেপার প্যাড", slug: "acrylic-paper" },
      { id: "mixed-media-paper", name: "Mixed Media Paper", bengali: "মিক্সড মিডিয়া পেপার", slug: "mixed-media-paper" },
      { id: "black-paper", name: "Black Paper Sheets", bengali: "ব্ল্যাক পেপার প্যাড", slug: "black-paper" },
      { id: "tracing-grid-paper", name: "Tracing & Drafting Paper", bengali: "ট্রেসিং ও গ্রিড পেপার", slug: "tracing-grid-paper" },
    ],
  },
  {
    id: "drawing",
    name: "Drawing & Sketching",
    bengali: "ড্রয়িং ও স্কেচিং",
    slug: "drawing",
    iconName: "Pencil",
    image: "https://cdn.ahbab.art/public/product/Rt7p8Fj-ME9IC5HWmPt.webp",
    count: "28+ আইটেম",
    description: "গ্রাফাইট ও চারকোল পেন্সিল, অ্যালকোহল মার্কার ও ড্রয়িং এক্সেসরিজ",
    featured: true,
    subcategories: [
      { id: "graphite-charcoal", name: "Graphite & Charcoal Pencils", bengali: "গ্রাফাইট ও চারকোল পেন্সিল", slug: "graphite-charcoal" },
      { id: "colored-pencils", name: "Colored Pencil Sets", bengali: "কালার পেন্সিল সেট", slug: "colored-pencils" },
      { id: "art-markers", name: "Dual-Tip Alcohol Markers", bengali: "ডুয়াল-টিপ আর্ট মার্কার", slug: "art-markers" },
      { id: "fineliners-pens", name: "Fineliners & Micron Pens", bengali: "মাইক্রন ও ফাইনলাইনার পেন", slug: "fineliners-pens" },
      { id: "erasers-blenders", name: "Erasers, Blenders & Sharpeners", bengali: "আর্ট ইরেজার ও ব্লেন্ডার", slug: "erasers-blenders" },
    ],
  },
  {
    id: "calligraphy",
    name: "Calligraphy Supplies",
    bengali: "ক্যালিগ্রাফি সামগ্রী",
    slug: "calligraphy",
    iconName: "Feather",
    image: "https://cdn.ahbab.art/public/category/5Kbqgyn0yUk16ISWgcq.webp",
    count: "35+ আইটেম",
    description: "ঐতিহ্যবাহী আরবি ও ইংরেজি ক্যালিগ্রাফি কলম, নিব, কালার ইঙ্ক ও স্পেশাল পেপার",
    featured: true,
    subcategories: [
      { id: "calligraphy-qalam", name: "Traditional Qalam & Pens", bengali: "হেন্দাম, জাভা ও ব্যাম্বু কলম", slug: "calligraphy-qalam" },
      { id: "calligraphy-nibs", name: "Calligraphy Nibs & Holders", bengali: "ক্যালিগ্রাফি নিব ও পেনহোল্ডার", slug: "calligraphy-nibs" },
      { id: "calligraphy-inks", name: "Calligraphy Inks & Gold Inks", bengali: "ক্যালিগ্রাফি কালি ও গোল্ডেন ইঙ্ক", slug: "calligraphy-inks" },
      { id: "calligraphy-paper", name: "Ruled & Practice Sheets", bengali: "মুকাশশা ও রুল্ড ক্যালিগ্রাফি পেপার", slug: "calligraphy-paper" },
      { id: "lika-dawat-accessories", name: "Lika, Dawat & Accessories", bengali: "লিকা, দাওয়াত ও ক্যালিগ্রাফি সামগ্রী", slug: "lika-dawat-accessories" },
    ],
  },
  {
    id: "mediums",
    name: "Mediums & Varnishes",
    bengali: "মিডিয়াম ও বার্নিশ",
    slug: "mediums",
    iconName: "Layers",
    image: "https://cdn.ahbab.art/public/product/BmY4NDTJyh9GNilYN9S.jpg",
    count: "18+ আইটেম",
    description: "জেসো প্রাইমার, গ্লস ও ম্যাট বার্নিশ স্প্রে, টেক্সচার পেস্ট ও রেজিন",
    featured: true,
    subcategories: [
      { id: "gesso-primers", name: "Gesso & Primers", bengali: "জেসো ও সারফেস প্রাইমার", slug: "gesso-primers" },
      { id: "gloss-matte-varnish", name: "Gloss & Matte Varnish", bengali: "গ্লস ও ম্যাট বার্নিশ স্প্রে", slug: "gloss-matte-varnish" },
      { id: "pouring-medium", name: "Pouring & Glazing Medium", bengali: "পোরিং ও গ্লেজিং মিডিয়াম", slug: "pouring-medium" },
      { id: "texture-modeling-paste", name: "Texture & Modeling Paste", bengali: "টেক্সচার ও মডেলিং পেস্ট", slug: "texture-modeling-paste" },
      { id: "linseed-turpentine", name: "Linseed Oil & Solvents", bengali: "লিনসিড অয়েল ও টারপেনটাইন", slug: "linseed-turpentine" },
      { id: "resin-hardener", name: "Epoxy Resin & Hardener", bengali: "ইপোক্সি রেজিন ও হার্ডেনার", slug: "resin-hardener" },
    ],
  },
  {
    id: "easels",
    name: "Easels & Stands",
    bengali: "ইজেল ও ডিসপ্লে স্ট্যান্ড",
    slug: "easels",
    iconName: "Maximize",
    image: "https://cdn.ahbab.art/public/product/x9aZ8Ha45_5S0EHock3.jpg",
    count: "15+ আইটেম",
    description: "টেবিলটপ ইজেল, স্টুডিও উডেন স্ট্যান্ড ও অ্যালুমিনিয়াম ফিল্ড ট্রিপড",
    featured: true,
    subcategories: [
      { id: "tabletop-easels", name: "Tabletop Mini Easels", bengali: "টেবিলটপ মিনি ইজেল", slug: "tabletop-easels" },
      { id: "studio-easels", name: "Studio & A-Frame Easels", bengali: "স্টুডিও ও এ-ফ্রেম ইজেল", slug: "studio-easels" },
      { id: "tripod-field-easels", name: "Tripod & Field Easels", bengali: "ফিল্ড ও ট্রিপড ইজেল", slug: "tripod-field-easels" },
      { id: "display-stands", name: "Display & Plate Stands", bengali: "আর্ট ও ফ্রেম ডিসপ্লে স্ট্যান্ড", slug: "display-stands" },
    ],
  },
  {
    id: "craft-clay",
    name: "Lippan, Craft & Clay",
    bengali: "লিপ্পান ও ক্লে ক্রাফট",
    slug: "craft-clay",
    iconName: "Gem",
    image: "https://cdn.ahbab.art/public/category/BxenbkqACm0PgzV8ZMf.webp",
    count: "24+ আইটেম",
    description: "লিপ্পান মিরর, এয়ার ড্রাই ক্লে, ক্লে টুলস, ডিকুপাজ পেপার ও ক্রাফট রেজিন",
    featured: true,
    subcategories: [
      { id: "lippan-mirrors", name: "Lippan Art Mirrors", bengali: "লিপ্পান আর্ট মিরর / কাঁচ", slug: "lippan-mirrors" },
      { id: "air-dry-clay", name: "Air Dry Clay & Terracotta", bengali: "এয়ার ড্রাই ক্লে ও মাটির ক্লে", slug: "air-dry-clay" },
      { id: "clay-tools-molds", name: "Clay Modeling Tools & Molds", bengali: "ক্লে টুলস ও সিলিকন মোল্ড", slug: "clay-tools-molds" },
      { id: "decoupage-craft", name: "Decoupage Paper & Sheets", bengali: "ডিকুপাজ পেপার ও ন্যাপকিন", slug: "decoupage-craft" },
      { id: "mod-podge-glue", name: "Mod Podge & Craft Glues", bengali: "মড পজ ও ক্রাফট গ্লু", slug: "mod-podge-glue" },
    ],
  },
  {
    id: "combos",
    name: "Artist Combo Packs",
    bengali: "কম্বো ও গিফট সেট",
    slug: "combos",
    iconName: "PackagePlus",
    image: "https://artlabbd.com/wp-content/uploads/2024/08/428672548_708861584788268_7215090560402851456_n-600x600.jpg",
    count: "16+ কম্বো",
    description: "বিগিনার স্টার্টার কিট, ক্যালিগ্রাফি মাস্টার সেট ও অল-ইন-ওয়ান আর্ট ডিলস",
    featured: true,
    subcategories: [
      { id: "beginner-art-kits", name: "Beginner Painting Kits", bengali: "বিগিনার পেইন্টিং স্টার্টার কিট", slug: "beginner-art-kits" },
      { id: "calligraphy-master-sets", name: "Calligraphy Master Sets", bengali: "ক্যালিগ্রাফি মাস্টার কম্বো", slug: "calligraphy-master-sets" },
      { id: "sketching-kits", name: "Professional Sketching Kits", bengali: "প্রফেশনাল স্কেচিং কিট", slug: "sketching-kits" },
      { id: "student-combo-packs", name: "Student Budget Combo Packs", bengali: "স্টুডেন্ট বাজেট কম্বো প্যাক", slug: "student-combo-packs" },
    ],
  },
];

// Helper functions
export function getCategoryBySlug(slug: string): MasterCategory | undefined {
  return MASTER_ART_CATEGORIES.find((c) => c.slug === slug);
}

export function getSubcategoryBySlug(subSlug: string): { parent: MasterCategory; sub: SubCategory } | undefined {
  for (const cat of MASTER_ART_CATEGORIES) {
    const found = cat.subcategories.find((s) => s.slug === subSlug);
    if (found) return { parent: cat, sub: found };
  }
  return undefined;
}

export function getAllCategorySlugs(): string[] {
  return MASTER_ART_CATEGORIES.map((c) => c.slug);
}
