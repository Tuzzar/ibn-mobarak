import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/external";

export type HomeSectionType =
  | "rich_text"
  | "image_banner"
  | "product_spotlight"
  | "product_grid"
  | "product_showcase"
  | "category_grid"
  | "testimonials_block"
  | "faq_block";

export type HomeSectionRow = {
  id: string;
  type: HomeSectionType;
  title: string;
  config: Record<string, unknown>;
  position: number;
  is_visible: boolean;
};

export type SectionFieldDef =
  | { key: string; label: string; type: "text" | "textarea" | "url" }
  | { key: string; label: string; type: "number"; min?: number; max?: number }
  | { key: string; label: string; type: "product_select" }
  | { key: string; label: string; type: "product_multiselect"; max?: number }
  | { key: string; label: string; type: "category_multiselect"; max?: number }
  | {
      key: string;
      label: string;
      type: "repeater";
      itemLabel: string;
      max?: number;
      fields: { key: string; label: string; type: "text" | "textarea" | "url" }[];
    }
  | { key: string; label: string; type: "select"; options: { value: string; label: string }[] };

export type SectionTypeMeta = {
  type: HomeSectionType;
  label: string;
  description: string;
  defaultConfig: Record<string, unknown>;
  fields: SectionFieldDef[];
};

export const SECTION_TYPES: SectionTypeMeta[] = [
  {
    type: "rich_text",
    label: "Rich Text Block",
    description: "A simple heading + paragraph section.",
    defaultConfig: { heading: "", body: "", align: "center" },
    fields: [
      { key: "heading", label: "Heading", type: "text" },
      { key: "body", label: "Body", type: "textarea" },
      {
        key: "align",
        label: "Alignment",
        type: "select",
        options: [
          { value: "left", label: "Left" },
          { value: "center", label: "Center" },
          { value: "right", label: "Right" },
        ],
      },
    ],
  },
  {
    type: "image_banner",
    label: "Image Banner",
    description: "Full-width image with text overlay and a button.",
    defaultConfig: {
      image_url: "",
      heading: "",
      subheading: "",
      cta_label: "",
      cta_href: "/products",
    },
    fields: [
      { key: "image_url", label: "Image URL", type: "url" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "subheading", label: "Subheading", type: "text" },
      { key: "cta_label", label: "Button Label", type: "text" },
      { key: "cta_href", label: "Button Link", type: "text" },
    ],
  },
  {
    type: "product_spotlight",
    label: "Product Spotlight",
    description: "Highlight a single product with its photos and a CTA.",
    defaultConfig: { kicker: "", heading: "", product_slug: "" },
    fields: [
      { key: "kicker", label: "Kicker / Eyebrow", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "product_slug", label: "Product", type: "product_select" },
    ],
  },
  {
    type: "product_grid",
    label: "Product Grid",
    description:
      "A grid of products. Pick specific products, or filter by one or more categories. If specific products are selected, categories are ignored.",
    defaultConfig: {
      heading: "",
      kicker: "",
      category: "",
      category_slugs: [],
      product_slugs: [],
      limit: 8,
      layout: "grid",
      see_all_href: "/products",
    },
    fields: [
      { key: "kicker", label: "Kicker / Eyebrow", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "layout",
        label: "Layout style",
        type: "select",
        options: [
          { value: "grid", label: "Grid (multi-row)" },
          { value: "slider", label: "Slider (single row, horizontal scroll)" },
        ],
      },
      {
        key: "see_all_href",
        label: "“See all” link (slider only — leave blank to hide)",
        type: "text",
      },
      {
        key: "product_slugs",
        label: "Specific products (optional — overrides categories)",
        type: "product_multiselect",
        max: 24,
      },
      {
        key: "category_slugs",
        label: "Filter by categories (optional)",
        type: "category_multiselect",
        max: 12,
      },
      { key: "limit", label: "Max products (when filtering)", type: "number", min: 2, max: 24 },
    ],
  },
  {
    type: "product_showcase",
    label: "Product Showcase",
    description: "Hand-pick products to feature in a horizontal scroller.",
    defaultConfig: { heading: "", kicker: "", product_slugs: [] },
    fields: [
      { key: "kicker", label: "Kicker / Eyebrow", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "product_slugs", label: "Products", type: "product_multiselect", max: 12 },
    ],
  },
  {
    type: "category_grid",
    label: "Category Grid",
    description: "Show a grid of category cards linking to the shop.",
    defaultConfig: { heading: "", kicker: "", category_slugs: [] },
    fields: [
      { key: "kicker", label: "Kicker / Eyebrow", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      { key: "category_slugs", label: "Categories", type: "category_multiselect", max: 12 },
    ],
  },
  {
    type: "testimonials_block",
    label: "Testimonials",
    description: "Customer photo + name + quote cards.",
    defaultConfig: { heading: "", kicker: "", items: [] },
    fields: [
      { key: "kicker", label: "Kicker / Eyebrow", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "items",
        label: "Testimonials",
        type: "repeater",
        itemLabel: "Testimonial",
        max: 12,
        fields: [
          { key: "name", label: "Name", type: "text" },
          { key: "location", label: "Location", type: "text" },
          { key: "quote", label: "Quote", type: "textarea" },
          { key: "image_url", label: "Photo URL", type: "url" },
        ],
      },
    ],
  },
  {
    type: "faq_block",
    label: "FAQ Block",
    description: "Frequently asked questions in an accordion.",
    defaultConfig: { heading: "", kicker: "", items: [] },
    fields: [
      { key: "kicker", label: "Kicker / Eyebrow", type: "text" },
      { key: "heading", label: "Heading", type: "text" },
      {
        key: "items",
        label: "Questions",
        type: "repeater",
        itemLabel: "Question",
        max: 20,
        fields: [
          { key: "q", label: "Question", type: "text" },
          { key: "a", label: "Answer", type: "textarea" },
        ],
      },
    ],
  },
];

export function getSectionMeta(type: string): SectionTypeMeta | undefined {
  return SECTION_TYPES.find((s) => s.type === type);
}

export const homeSectionsOptions = () =>
  queryOptions({
    queryKey: ["home-sections", "visible"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_sections")
        .select("id, type, title, config, position, is_visible")
        .eq("is_visible", true)
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as HomeSectionRow[];
    },
  });

export const allHomeSectionsOptions = () =>
  queryOptions({
    queryKey: ["home-sections", "all"],
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("home_sections")
        .select("id, type, title, config, position, is_visible")
        .order("position", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as HomeSectionRow[];
    },
  });