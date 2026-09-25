import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Upload,
  Save,
  Image as ImageIcon,
  User as UserIcon,
  Phone as PhoneIcon,
  BarChart3,
  LayoutGrid,
  Megaphone,
  Clock,
  Award,
  ShieldCheck,
  Banknote,
  Truck,
  Gift,
  MessageCircle,
  ShoppingBag,
  CheckCircle2,
  Scale,
  Building2,
  MapPin,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/external";
import { uploadFileToR2 } from "@/lib/r2-storage";
import { siteContentOptions, productsCategoriesOptions, allProductsSlugOptions } from "@/lib/queries";
import { Spinner } from "@/components/site/Spinner";
import { useAuth } from "@/lib/auth";
import { AccordionList, SectionRow } from "@/components/admin/SectionAccordion";
import { LogoUploader } from "@/components/admin/LogoUploader";
import { CourierSettingsPanel } from "@/components/admin/CourierSettingsPanel";
import { TelegramSettingsPanel } from "@/components/admin/TelegramSettingsPanel";
import {
  AddCustomSectionButton,
  CustomSectionRow,
} from "@/components/admin/CustomSectionsPanel";
import { allHomeSectionsOptions } from "@/lib/home-sections";
import { Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/admin/site-content")({
  component: AdminSiteContent,
});

const FIELDS = [
  "hero_image",
  "hero_title_line1",
  "hero_title_line2",
  "hero_description",
  "hero_featured_title",
  "hero_featured_description",
  "hero_category",
  "hero_cta_label",
  "hero_cta_href",
  "hero_cta_hidden",
  ...([2, 3, 4].flatMap((n) => [
    `hero_slide_${n}_image`,
    `hero_slide_${n}_title_line1`,
    `hero_slide_${n}_title_line2`,
    `hero_slide_${n}_description`,
    `hero_slide_${n}_featured_title`,
    `hero_slide_${n}_featured_description`,
    `hero_slide_${n}_category`,
  ]) as string[]),
  "about_brand_intro_1",
  "about_brand_intro_2",
  "about_founder_photo",
  "about_founder_name",
  "about_founder_role",
  "about_founder_tagline",
  "about_founder_fb",
  "about_founder_bio",
  "about_founder_quote",
  "about_article_heading",
  "about_article_body",
  "about_pull_quote",
  "about_pillar_1_title",
  "about_pillar_1_desc",
  "about_pillar_2_title",
  "about_pillar_2_desc",
  "about_pillar_3_title",
  "about_pillar_3_desc",
  "about_pillar_4_title",
  "about_pillar_4_desc",
  "about_stat_1_value",
  "about_stat_1_label",
  "about_stat_2_value",
  "about_stat_2_label",
  "about_stat_3_value",
  "about_stat_3_label",
  "contact_email",
  "contact_phone",
  "contact_whatsapp",
  "contact_whatsapp_display",
  "contact_whatsapp_message",
  "contact_address",
  "contact_address_full",
  "contact_facebook_url",
  "contact_instagram_url",
  "contact_messenger_url",
  "contact_website_domain",
  "contact_website_url",
  "meta_pixel_id",
  ...([1, 2, 3, 4, 5, 6].flatMap((n) => [
    `category_${n}_image`,
    `category_${n}_label`,
    `category_${n}_tag`,
    `category_${n}_target`,
  ]) as string[]),
  // Home — featured products section
  "featured_kicker",
  "featured_title",
  // Home — popular category section
  "popcat_kicker",
  "popcat_title",
  "popcat_category",
  // Home — "What are you celebrating?" heading
  "celebrate_heading",
  // Home — Our Promise timeline
  "promise_kicker",
  "promise_title",
  "promise_description",
  // Home — Testimonials
  "testimonials_kicker",
  "testimonials_title",
  "testimonials_description",
  // Home — Final CTA banner
  "cta_kicker",
  "cta_title_line1",
  "cta_title_line2",
  "cta_description",
  "cta_image",
  "cta_badge",
  // Home — Promise ribbon marquee items
  "ribbon_1_title",
  "ribbon_1_description",
  "ribbon_2_title",
  "ribbon_2_description",
  "ribbon_3_title",
  "ribbon_3_description",
  "ribbon_4_title",
  "ribbon_4_description",
  // Home — Product Spotlight headings
  "spotlight_kicker",
  "spotlight_title",
  // Home — Product Showcase headings
  "showcase_kicker",
  "showcase_title",
  // Home — Testimonial photo cards (1-6)
  ...([1, 2, 3, 4, 5, 6].flatMap((n) => [
    `testimonial_${n}_image`,
    `testimonial_${n}_name`,
    `testimonial_${n}_location`,
  ]) as string[]),
  // Home — FAQ section
  "faq_kicker",
  "faq_title_line1",
  "faq_title_line2",
  "faq_description",
  "faq_link_label",
  ...([1, 2, 3, 4, 5].flatMap((n) => [
    `faq_${n}_q`,
    `faq_${n}_a`,
  ]) as string[]),
  // Home — Our Promise / Journey 4 steps
  ...([1, 2, 3, 4].flatMap((n) => [
    `journey_${n}_title`,
    `journey_${n}_desc`,
  ]) as string[]),
  // Home — Final CTA banner button labels
  "cta_button_1_label",
  "cta_button_2_label",
  // Home — Product Spotlight: which product to feature
  "spotlight_product_slug",
  // Home — built-in section visibility flags ("1" = hidden, "" = visible)
  "section_hidden_hero",
  "section_hidden_categories",
  "section_hidden_home_featured",
  "section_hidden_home_popcat",
  "section_hidden_home_celebrate",
  "section_hidden_home_ribbon",
  "section_hidden_home_spotlight",
  "section_hidden_home_showcase",
  "section_hidden_home_promise",
  "section_hidden_home_testimonials",
  "section_hidden_home_cta",
  "section_hidden_home_faq",
  "brand_logo_url",
  "brand_logo_scale",
  // Top Announcement Bar
  "announcement_bar_enabled",
  "announcement_message_1",
  "announcement_message_2",
  "announcement_message_3",
  "announcement_message_4",
  "announcement_speed_sec",
  // Footer
  "footer_tagline",
  "footer_description",
  "footer_opening_hours",
  "footer_copyright_text",
  // Product Page Perks & Delivery
  "product_delivery_notice",
  "product_delivery_fee_summary",
  "product_whatsapp_cta_text",
  "product_badge_1",
  "product_badge_2",
  "product_badge_3",
  "product_badge_4",
  "product_badge_5",
  // Cart Drawer & Free Shipping
  "cart_delivery_strip_text",
  "cart_delivery_weight_note",
  "cart_free_shipping_threshold",
  "cart_free_shipping_note",
  "cart_standard_shipping_note",
  // Shop / Catalog Page Header
  "shop_hero_title",
  "shop_hero_description",
  "shop_badge_top",
  "shop_badge_sub",
  // Checkout Trust Badges & Guarantee
  "checkout_badge_cod_text",
  "checkout_perk_1_title",
  "checkout_perk_1_desc",
  "checkout_perk_2_title",
  "checkout_perk_2_desc",
  // Contact Page Extras
  "contact_phone_secondary",
  "contact_hero_subtitle",
  "contact_hours_badge",
  "contact_studio_desc",
  "contact_studio_image",
  "contact_bulk_title",
  "contact_bulk_desc",
  "contact_bulk_point_1",
  "contact_bulk_point_2",
  "contact_bulk_point_3",
  "contact_bulk_cta",
  // Shipping Policy & Rates
  "shipping_dhaka_fee",
  "shipping_dhaka_timeline",
  "shipping_outside_fee",
  "shipping_outside_timeline",
  "shipping_extra_kg_fee",
  "shipping_policy_intro",
] as const;
type FieldKey = (typeof FIELDS)[number];

const MAX_IMAGE_BYTES = 500 * 1024;
const HARD_MAX_BYTES = 5 * 1024 * 1024;

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const maxW = 1600;
    const scale = Math.min(1, maxW / bitmap.width);
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/webp", 0.82),
    );
    if (!blob) return file;
    if (blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".webp"), {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

// Extract YouTube video ID from any common URL form
export function extractYouTubeId(input: string): string | null {
  if (!input) return null;
  const s = input.trim();
  // Already an ID (11 chars typical)
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s;
  try {
    const url = new URL(s);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const v = url.searchParams.get("v");
      if (v) return v;
      const parts = url.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex((p) => p === "embed" || p === "shorts" || p === "v");
      if (idx >= 0 && parts[idx + 1]) return parts[idx + 1];
    }
  } catch {
    // not a URL
  }
  return null;
}

/** Eye toggle for built-in home sections. Hides/shows on the public home page.
 *  Persists immediately to `site_content` (no need to click Save). */
function HideEye({
  flagKey,
  values,
  setValues,
}: {
  flagKey: FieldKey;
  values: Record<FieldKey, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<FieldKey, string>>>;
}) {
  const qc = useQueryClient();
  const hidden = (values[flagKey] ?? "") === "1";
  const toggle = async () => {
    const next = hidden ? "" : "1";
    setValues((v) => ({ ...v, [flagKey]: next }));
    const { error } = await supabase
      .from("site_content" as any)
      .upsert({ key: flagKey, value: next }, { onConflict: "key" });
    if (error) {
      // revert on failure
      setValues((v) => ({ ...v, [flagKey]: hidden ? "1" : "" }));
      toast.error(error.message);
      return;
    }
    qc.invalidateQueries({ queryKey: ["site-content"] });
    toast.success(hidden ? "Section shown on home" : "Section hidden from home");
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="p-1.5 text-foreground/60 hover:text-foreground"
      title={hidden ? "Show on home page" : "Hide from home page"}
    >
      {hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

function AnnouncementPreviewCard({
  enabled,
  messages,
  speed,
}: {
  enabled: boolean;
  messages: string[];
  speed: number;
}) {
  const activeMsgs = messages.filter((m) => m && m.trim().length > 0);
  const displayMsgs =
    activeMsgs.length > 0
      ? activeMsgs
      : [
          "কালি ও ক্যানভাসে আধ্যাত্মিক প্রশান্তি — প্রিমিয়াম ইসলামিক ক্যালিগ্রাফি আর্ট",
          "সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা",
          "অরিজিনাল আর্ট ব্র্যান্ডস ও কোয়ালিটি পণ্য",
        ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (displayMsgs.length <= 1) return;
    const intervalSec = Math.max(2, speed || 5) * 1000;
    const timer = setInterval(() => {
      setIdx((prev) => (prev + 1) % displayMsgs.length);
    }, intervalSec);
    return () => clearInterval(timer);
  }, [displayMsgs.length, speed]);

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            লাইভ প্রিভিউ (Live Preview)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>গতি: {speed || 5}s</span>
          <span>•</span>
          <span>{displayMsgs.length}টি বার্তা সক্রিয়</span>
        </div>
      </div>

      <div
        className={`w-full overflow-hidden transition-all duration-300 rounded-lg border ${
          enabled
            ? "bg-[#161616] text-[#E8DCC4] border-[#2A241C] shadow-inner"
            : "bg-muted/60 text-muted-foreground/60 border-dashed border-border"
        }`}
      >
        <div className="py-2.5 px-4 flex items-center justify-center text-center min-h-[42px]">
          {enabled ? (
            <p className="text-xs tracking-wide font-serif transition-all duration-300">
              {displayMsgs[idx % displayMsgs.length]}
            </p>
          ) : (
            <p className="text-xs italic text-amber-500/80">⚠️ অ্যানাউন্সমেন্ট বার বর্তমানে বন্ধ রাখা হয়েছে (Hidden on site)</p>
          )}
        </div>
      </div>

      {displayMsgs.length > 1 && enabled && (
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {displayMsgs.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === idx % displayMsgs.length
                  ? "w-5 bg-amber-500"
                  : "w-2 bg-foreground/20 hover:bg-foreground/40"
              }`}
              title={`বার্তা ${i + 1} প্রদর্শন করুন`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FooterPreviewCard({
  tagline,
  description,
  openingHours,
  copyright,
  logoUrl,
}: {
  tagline: string;
  description: string;
  openingHours: string;
  copyright: string;
  logoUrl?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            লাইভ ফুটার প্রিভিউ (Live Footer Preview)
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">ইউজার সাইটে ফুটার যেমন দেখাবে</span>
      </div>

      <div className="rounded-xl bg-[#111111] text-[#E0D8C8] p-5 border border-[#262118] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-sm">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-7 w-auto object-contain brightness-110" />
            ) : (
              <h3 className="font-serif text-base tracking-wider text-amber-500 font-bold">
                IBN MOBARAK ART GALLERY
              </h3>
            )}
            <p className="text-xs text-amber-400/90 font-medium italic">
              {tagline || "বিশুদ্ধ রঙের স্পর্শে সৃজনশীলতার বিকাশ"}
            </p>
            <p className="text-xs text-[#A89F91] leading-relaxed">
              {description || "প্রিমিয়াম কোয়ালিটি আর্ট সাপ্লাই ও ক্যালিগ্রাফি ফ্রেমের বিশ্বস্ত গ্যালারি।"}
            </p>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <span className="text-[11px] uppercase tracking-wider text-[#A89F91] font-semibold block">
              কাজের সময়সূচি
            </span>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#D8CFBF] bg-[#1C1813] px-2.5 py-1 rounded-md border border-[#2A241C]">
              <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>{openingHours || "শনি - বৃহস্পতি: সকাল ১০টা - রাত ৮টা (শুক্রবার বন্ধ)"}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-[#262118] pt-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-[#8C8375]">
          <p>
            © {new Date().getFullYear()} Ibn Mobarak Art Gallery. {copyright || "সর্বস্বত্ব সংরক্ষিত।"}
          </p>
          <p className="text-[10px] text-[#8C8375] inline-flex items-center gap-1">
            Designed and developed by{" "}
            <span className="text-[#C8BFB0] font-medium underline underline-offset-2 decoration-dotted">
              Ibrahim Kholilullah
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function ProductPerksPreviewCard({
  whatsappCta,
  deliveryNotice,
  deliveryFee,
  badges,
}: {
  whatsappCta: string;
  deliveryNotice: string;
  deliveryFee: string;
  badges: string[];
}) {
  const badgeIcons = [Award, ShieldCheck, Banknote, Truck, Gift];

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            প্রোডাক্ট পেজ প্রিভিউ (Live Product Page Preview)
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">বাই-বক্সের নিচের অংশ</span>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 max-w-lg mx-auto shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground text-sm">৳ ১,৪৫০</span>
          <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-[11px] font-medium">
            ইন স্টক
          </span>
        </div>

        <div className="w-full py-2.5 px-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-semibold text-xs tracking-wide flex items-center justify-center gap-2">
          <MessageCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{whatsappCta || "WhatsApp এ এই পণ্য সম্পর্কে প্রশ্ন করুন"}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 px-3.5 py-2.5 rounded-xl border border-border/60">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="leading-snug">
            {deliveryNotice || "আজ অর্ডার করলে সম্ভাব্য ডেলিভারি: ১-৩ কার্যদিবসের মধ্যে (ঢাকা ১-২ দিন, ঢাকার বাইরে ২-৪ দিন)"}
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-2 text-xs text-foreground/80">
          <div className="flex items-start gap-2.5">
            <Truck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong>সারা দেশে হোম ডেলিভারি:</strong>{" "}
              {deliveryFee || "ঢাকা ৳৮০, ঢাকার বাইরে ৳১৩০ (১ কেজি পর্যন্ত ফিক্সড, এরপর প্রতি অতিরিক্ত কেজিতে ৳২০)।"}
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>১০০% অরিজিনাল পণ্য:</strong> যাচাইকৃত আর্ট ব্র্যান্ড ও নিরাপদ ট্রানজিট প্যাকেজিং
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <Banknote className="w-4 h-4 text-amber-500 shrink-0" />
            <span>পণ্য হাতে পেয়ে চেক করে মূল্য পরিশোধের নিশ্চয়তা</span>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1.5 pt-1">
          {badges.map((label, i) => {
            const Icon = badgeIcons[i] || Award;
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-1 p-2 border border-border/70 rounded-lg bg-card text-center hover:border-amber-500/60 transition-colors"
              >
                <Icon className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] leading-tight text-foreground/75 font-medium">
                  {label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function CartDeliveryPreviewCard({
  stripText,
  weightNote,
  threshold,
  freeNote,
  standardNote,
}: {
  stripText: string;
  weightNote: string;
  threshold: number;
  freeNote: string;
  standardNote: string;
}) {
  const [mockSubtotal, setMockSubtotal] = useState<number>(1450);
  const targetThreshold = threshold || 2000;
  const isFree = mockSubtotal >= targetThreshold;
  const percent = Math.min(100, Math.round((mockSubtotal / targetThreshold) * 100));

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            কার্ট ড্রয়ার লাইভ প্রিভিউ (Live Cart Preview)
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <span>টেস্ট সাবটোটাল: ৳{mockSubtotal}</span>
          <button
            type="button"
            onClick={() => setMockSubtotal(mockSubtotal >= targetThreshold ? 1200 : targetThreshold + 250)}
            className="text-[10px] text-primary underline ml-1 cursor-pointer font-medium"
          >
            {isFree ? "কমিয়ে ৳১,২০০ দেখুন" : `বাড়িয়ে ৳${targetThreshold + 250} দেখুন`}
          </button>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border max-w-md mx-auto shadow-sm overflow-hidden text-xs">
        <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
            <ShoppingBag className="w-4 h-4 text-amber-500" />
            <span>আপনার কার্ট (২)</span>
          </div>
          <span className="text-[10px] text-muted-foreground">Drawer Mode</span>
        </div>

        <div className="px-4 py-2 bg-muted/40 border-b border-border/80">
          <div className="flex items-center justify-between text-[11px] font-medium">
            <span className="text-foreground/90 font-serif">
              {stripText || "🚚 ডেলিভারি: ঢাকা ৳৮০ · বাইরে ৳১৩০"}
            </span>
            <span className="text-[10px] text-primary font-semibold">পলিসি দেখুন</span>
          </div>
          <p className="text-[9px] text-muted-foreground mt-0.5">
            {weightNote || "১ কেজি পর্যন্ত ফিক্সড, এরপর প্রতি অতিরিক্ত কেজিতে ৳২০ যোগ হবে"}
          </p>
        </div>

        <div className="px-4 py-2.5 bg-amber-500/5 border-b border-border/40">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="font-semibold text-foreground">ফ্রি ডেলিভারি প্রগ্রেস বার</span>
            <span className="text-muted-foreground font-medium">{percent}% সম্পন্ন</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${isFree ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        <div className="p-3 flex items-center gap-3 border-b border-border/50 bg-background/50">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <ShoppingBag className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate text-foreground">প্রিমিয়াম অ্যাক্রিলিক কালার সেট</p>
            <p className="text-[10px] text-muted-foreground">৳ {mockSubtotal} × ১</p>
          </div>
        </div>

        <div className="p-4 bg-card border-t border-amber-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-amber-500 font-bold">সাবটোটাল</span>
            <span className="font-display text-sm font-bold text-primary">৳ {mockSubtotal}</span>
          </div>
          <div className={`p-2 rounded-lg text-[11px] leading-snug border ${
            isFree
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
              : "bg-muted/40 text-muted-foreground border-border/60"
          }`}>
            {isFree
              ? (freeNote || "✓ এই অর্ডারে কোনো ডেলিভারি চার্জ প্রযোজ্য হবে না।")
              : (standardNote || "ডেলিভারি চার্জ চেকআউটে হিসাব করা হবে (ঢাকা ৳৮০, বাইরে ৳১৩০)।")}
          </div>
        </div>
      </div>
    </div>
  );
}

function ShopAndCheckoutPreviewCard({
  shopTitle,
  shopDesc,
  badgeTop,
  badgeSub,
  checkoutCod,
  perk1Title,
  perk1Desc,
  perk2Title,
  perk2Desc,
}: {
  shopTitle: string;
  shopDesc: string;
  badgeTop: string;
  badgeSub: string;
  checkoutCod: string;
  perk1Title: string;
  perk1Desc: string;
  perk2Title: string;
  perk2Desc: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            শপ ব্যানার ও চেকআউট প্রিভিউ (Live Banner Preview)
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">ক্যাটালগ পেজ হেডার ও চেকআউট</span>
      </div>

      <div className="rounded-xl border border-border/80 bg-[color-mix(in_oklab,var(--primary)_6%,var(--background))] p-5 relative overflow-hidden shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-lg">
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
              <span>Home</span>
              <span className="text-amber-500">/</span>
              <span className="text-primary font-bold">Shop</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold font-display text-foreground">
              {shopTitle || "The Art & Craft Collection"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {shopDesc || "ক্যানভাস, অ্যাক্রিলিক কালার, ইসলামিক ক্যালিগ্রাফি ও পেইন্টিং সামগ্রীর বিশাল সম্ভার"}
            </p>
          </div>

          <div className="text-left sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-border/60 pt-2 sm:pt-0 sm:pl-4">
            <span className="block text-[10px] uppercase tracking-[0.25em] text-amber-500 font-semibold">
              {badgeTop || "Verified Catalog"}
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              {badgeSub || "৩,৯০০+ আইটেম রেডি স্টক"}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-foreground uppercase tracking-wider">
            চেকআউট পেজ ট্রাস্ট প্রিভিউ
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            {checkoutCod || "ক্যাশ অন ডেলিভারি (হোম ডেলিভারি)"}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/70 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-[11px] leading-tight min-w-0">
              <p className="font-bold truncate text-foreground">{perk1Title || "১০০% আসল পণ্য"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{perk1Desc || "যাচাইকৃত কোয়ালিটি"}</p>
            </div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/70 flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="text-[11px] leading-tight min-w-0">
              <p className="font-bold truncate text-foreground">{perk2Title || "নিরাপদ ডেলিভারি"}</p>
              <p className="text-[10px] text-muted-foreground truncate">{perk2Desc || "বাবল-র‍্যাপ প্রোটেকশন"}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactPreviewCard({
  phone,
  phoneSecondary,
  email,
  address,
  hoursBadge,
  studioDesc,
  studioImage,
  bulkTitle,
  bulkDesc,
  bulkPoint1,
  bulkPoint2,
  bulkPoint3,
  bulkCta,
}: {
  phone?: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  hoursBadge?: string;
  studioDesc?: string;
  studioImage?: string;
  bulkTitle?: string;
  bulkDesc?: string;
  bulkPoint1?: string;
  bulkPoint2?: string;
  bulkPoint3?: string;
  bulkCta?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            যোগাযোগ ও স্টুডিও প্রিভিউ (Live Contact & Studio Preview)
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">কন্টাক্ট পেজ ও বাল্ক অর্ডার কার্ড</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Studio Card Preview */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm flex flex-col">
          <div className="relative aspect-video w-full bg-muted overflow-hidden">
            {studioImage ? (
              <img
                src={studioImage}
                alt="Studio Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1.5 p-4 bg-muted/60">
                <Building2 className="w-6 h-6 opacity-40" />
                <span className="text-[11px]">কোনো ছবি নেই (ডিফল্ট আর্টওয়ার্ক ব্যবহৃত হবে)</span>
              </div>
            )}
            <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-background/90 backdrop-blur-sm border border-border/80 text-[10px] font-semibold text-foreground">
              <Clock className="w-3 h-3 text-amber-500" />
              {hoursBadge || "প্রতিদিন সকাল ১০টা - রাত ১০টা"}
            </span>
          </div>
          <div className="p-3.5 space-y-1.5 flex-1">
            <h4 className="text-sm font-bold text-foreground">ফিজিক্যাল স্টুডিও ও শোরুম</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {studioDesc || "সরাসরি দেখে অরিজিনাল ক্যানভাস পেইন্টিং, ব্রাশ ও আর্ট সাপ্লাই সংগ্রহ করতে আমাদের স্টুডিওতে আপনাকে স্বাগতম।"}
            </p>
            <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{address || "Dhaka, Bangladesh"}</span>
              </div>
              <div className="flex items-center gap-1.5 truncate">
                <PhoneIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{phone || "+880 1930-277557"}</span>
                {phoneSecondary && (
                  <span className="text-muted-foreground/80">/ {phoneSecondary}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Order Card Preview */}
        <div className="rounded-xl border border-amber-500/30 bg-primary/5 p-4 flex flex-col justify-between shadow-sm">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-semibold">
              <Award className="w-3 h-3" />
              কর্পোরেট ও বাল্ক অর্ডার
            </span>
            <h4 className="text-sm font-bold text-foreground">
              {bulkTitle || "বাল্ক বা কাস্টম সাইজ ফ্রেম প্রয়োজন?"}
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {bulkDesc || "স্কুল, কলেজ, আর্ট একাডেমি বা কর্পোরেট গিফটিংয়ের জন্য বিশেষ হোলসেল রেটে অর্ডার করতে সরাসরি আমাদের সাথে আলোচনা করুন।"}
            </p>
            <ul className="space-y-1 text-[11px] text-foreground/80 pt-1">
              <li className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{bulkPoint1 || "কাস্টম সাইজ ক্যানভাস ও স্ট্রেচার বার তৈরি"}</span>
              </li>
              <li className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{bulkPoint2 || "হোলসেল ও একাডেমি স্পেশাল ডিসকাউন্ট"}</span>
              </li>
              <li className="flex items-center gap-1.5 truncate">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{bulkPoint3 || "নিরাপদ কাঠের বক্সে জেলা পর্যায়ে ডেলিভারি"}</span>
              </li>
            </ul>
          </div>

          <div className="pt-3 mt-3 border-t border-border/60 flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">CTA বাটন:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[11px] font-semibold shadow-sm">
              <MessageCircle className="w-3 h-3" />
              {bulkCta || "হোয়াটসঅ্যাপে আলোচনা করুন"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ShippingRatesPreviewCard({
  dhakaFee,
  dhakaTimeline,
  outsideFee,
  outsideTimeline,
  extraKgFee,
  policyIntro,
}: {
  dhakaFee?: string;
  dhakaTimeline?: string;
  outsideFee?: string;
  outsideTimeline?: string;
  extraKgFee?: string;
  policyIntro?: string;
}) {
  const dFee = dhakaFee || "80";
  const oFee = outsideFee || "130";
  const extra = extraKgFee || "20";
  const dTime = dhakaTimeline || "২ থেকে ৩ কর্মদিবস";
  const oTime = outsideTimeline || "৩ থেকে ৫ কর্মদিবস";

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            ডেলিভারি চার্জ ও পলিসি প্রিভিউ (Live Shipping Rates Preview)
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">শিপিং পলিসি ও চেকআউট রেট</span>
      </div>

      {policyIntro && (
        <p className="text-xs text-muted-foreground bg-card p-2.5 rounded-lg border border-border/60 line-clamp-2">
          {policyIntro}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Inside Dhaka */}
        <div className="rounded-xl border-2 border-amber-500/40 bg-card p-3.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500">ঢাকা সিটি</span>
            <span className="text-lg font-extrabold text-primary">৳{dFee}</span>
          </div>
          <p className="text-xs font-semibold text-foreground">ঢাকার ভেতরে ডেলিভারি</p>
          <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border/60 pt-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
              <span>সময়সীমা: {dTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="w-3 h-3 text-amber-500 shrink-0" />
              <span>অতিরিক্ত কেজি চার্জ: +৳{extra}</span>
            </div>
          </div>
        </div>

        {/* Outside Dhaka */}
        <div className="rounded-xl border-2 border-border/80 bg-card p-3.5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary">সারাদেশ (৬৪ জেলা)</span>
            <span className="text-lg font-extrabold text-primary">৳{oFee}</span>
          </div>
          <p className="text-xs font-semibold text-foreground">ঢাকার বাইরে ডেলিভারি</p>
          <div className="text-[11px] text-muted-foreground space-y-1 border-t border-border/60 pt-2">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
              <span>সময়সীমা: {oTime}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Scale className="w-3 h-3 text-amber-500 shrink-0" />
              <span>অতিরিক্ত কেজি চার্জ: +৳{extra}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutPreviewCard({
  founderName,
  tagline,
  bio,
  photo,
  pullQuote,
  stat1Val,
  stat1Lbl,
  stat2Val,
  stat2Lbl,
  stat3Val,
  stat3Lbl,
}: {
  founderName?: string;
  tagline?: string;
  bio?: string;
  photo?: string;
  pullQuote?: string;
  stat1Val?: string;
  stat1Lbl?: string;
  stat2Val?: string;
  stat2Lbl?: string;
  stat3Val?: string;
  stat3Lbl?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
            আমাদের গল্প প্রিভিউ (Live About Story Preview)
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground">About পেজ পরিচিতি কার্ড</span>
      </div>

      <div className="rounded-xl border border-border/80 bg-card p-4 space-y-3 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted border border-border shrink-0">
            {photo ? (
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center">
                ছবি নেই
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-display text-base font-bold text-foreground">
              {founderName || "Ibn Mobarak Art Gallery"}
            </h4>
            <p className="text-xs text-primary font-medium">{tagline || "আর্টিস্ট · কিউরেটর · আর্ট হাব"}</p>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {bio || "যাত্রাবাড়ী, ঢাকায় অবস্থিত একটি সমৃদ্ধ আর্ট স্টুডিও ও গ্যালারি..."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/60 text-center">
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="font-display text-base font-bold text-primary">{stat1Val || "৪৩K+"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{stat1Lbl || "ফেসবুক ফলোয়ার্স"}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="font-display text-base font-bold text-primary">{stat2Val || "১০০%"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{stat2Lbl || "পজিটিভ রেকমেন্ডেশন"}</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/30">
            <div className="font-display text-base font-bold text-primary">{stat3Val || "৬৪"}</div>
            <div className="text-[10px] text-muted-foreground truncate">{stat3Lbl || "জেলায় ডেলিভারি"}</div>
          </div>
        </div>

        {pullQuote && (
          <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-xs italic text-center text-foreground/90">
            “{pullQuote}”
          </div>
        )}
      </div>
    </div>
  );
}

function AdminSiteContent() {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const { data: content, isLoading, error } = useQuery(siteContentOptions());
  const { data: categories = [] } = useQuery(productsCategoriesOptions());
  const { data: allProducts = [] } = useQuery(allProductsSlugOptions());
  const { data: customSections = [] } = useQuery(allHomeSectionsOptions());
  const emptyValues = () =>
    FIELDS.reduce(
      (acc, k) => {
        acc[k] = "";
        return acc;
      },
      {} as Record<FieldKey, string>,
    );
  const [values, setValues] = useState<Record<FieldKey, string>>(emptyValues);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingFounder, setUploadingFounder] = useState(false);
  const [uploadingSlide, setUploadingSlide] = useState<Record<number, boolean>>({});
  const [uploadingTestimonial, setUploadingTestimonial] = useState<Record<number, boolean>>({});
  const [uploadingCta, setUploadingCta] = useState(false);
  const [uploadingStudio, setUploadingStudio] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const founderFileRef = useRef<HTMLInputElement>(null);
  const slideFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const testimonialFileRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const ctaFileRef = useRef<HTMLInputElement>(null);
  const studioFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!content) return;
    setValues(() => {
      const next = emptyValues();
      FIELDS.forEach((k) => {
        next[k] = content[k] ?? "";
      });
      return next;
    });
  }, [content]);

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        You don't have access to manage site content.
      </div>
    );
  }

  const uploadTo = async (
    file: File,
    field: FieldKey,
    prefix: string,
    setBusy: (b: boolean) => void,
    ref: React.RefObject<HTMLInputElement | null>,
  ) => {
    if (file.size > HARD_MAX_BYTES) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    setBusy(true);
    try {
      const compressed = await compressImage(file);
      if (compressed.size > MAX_IMAGE_BYTES) {
        toast.warning(
          `Image is ${Math.round(compressed.size / 1024)}KB — consider a smaller image for faster page load.`,
        );
      }
      const ext = compressed.name.split(".").pop() || "webp";
      const filename = `${prefix}-${Date.now()}.${ext}`;
      const publicUrl = await uploadFileToR2(compressed, "site-content", filename);
      setValues((v) => ({ ...v, [field]: publicUrl }));
      toast.success("Image uploaded to Cloudflare R2");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setBusy(false);
      if (ref.current) ref.current.value = "";
    }
  };

  const onUpload = (file: File) =>
    uploadTo(file, "hero_image", "hero", setUploading, fileRef);
  const onUploadFounder = (file: File) =>
    uploadTo(file, "about_founder_photo", "founder", setUploadingFounder, founderFileRef);
  const onUploadCta = (file: File) =>
    uploadTo(file, "cta_image", "cta", setUploadingCta, ctaFileRef);
  const onUploadStudio = (file: File) =>
    uploadTo(file, "contact_studio_image", "studio", setUploadingStudio, studioFileRef);
  const onUploadSlide = (file: File, n: 2 | 3 | 4) => {
    const setBusy = (b: boolean) =>
      setUploadingSlide((s) => ({ ...s, [n]: b }));
    const refObj = {
      get current() {
        return slideFileRefs.current[n];
      },
      set current(_v: HTMLInputElement | null) {
        /* no-op */
      },
    } as React.RefObject<HTMLInputElement | null>;
    return uploadTo(
      file,
      `hero_slide_${n}_image` as FieldKey,
      `hero-slide-${n}`,
      setBusy,
      refObj,
    );
  };
  const onUploadTestimonial = (file: File, n: 1 | 2 | 3 | 4 | 5 | 6) => {
    const setBusy = (b: boolean) =>
      setUploadingTestimonial((s) => ({ ...s, [n]: b }));
    const refObj = {
      get current() {
        return testimonialFileRefs.current[n];
      },
      set current(_v: HTMLInputElement | null) {
        /* no-op */
      },
    } as React.RefObject<HTMLInputElement | null>;
    return uploadTo(
      file,
      `testimonial_${n}_image` as FieldKey,
      `testimonial-${n}`,
      setBusy,
      refObj,
    );
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const rows = FIELDS.map((key) => ({ key, value: values[key] ?? "" }));
      const { error: upErr } = await supabase
        .from("site_content" as any)
        .upsert(rows, { onConflict: "key" });
      if (upErr) {
        toast.error(upErr.message);
        return;
      }
      toast.success("Site content updated");
      qc.invalidateQueries({ queryKey: ["site-content"] });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-5 md:p-10 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <ImageIcon className="w-5 h-5" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl">Site Content</h1>
          <p className="text-muted-foreground text-sm">Manage homepage content</p>
        </div>
      </div>

      {isLoading && (
        <div className="mt-8 flex justify-center py-12">
          <Spinner className="w-6 h-6 text-primary" />
        </div>
      )}

      {error && (
        <div className="mt-8 p-5 rounded-2xl bg-destructive/10 text-destructive text-sm">
          Failed to load site content. {(error as Error).message}
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-6">
        <AddCustomSectionButton />
        <AccordionList storageKey="admin.site-content.sectionOrder.v2">
        <SectionRow id="branding" title="Branding" subtitle="Logo and header logo size">
          <section className="mt-6 bg-card border border-border rounded-2xl p-5 md:p-6">
            <LogoUploader
              value={values.brand_logo_url ?? ""}
              scale={values.brand_logo_scale ?? "1"}
              onChange={(url) => setValues((v) => ({ ...v, brand_logo_url: url }))}
              onScaleChange={(s) => setValues((v) => ({ ...v, brand_logo_scale: s }))}
            />
          </section>
        </SectionRow>

        <SectionRow id="announcement" title="Announcement Bar" subtitle="শীর্ষ অফার ও নোটিশ টিকার (মারকুই / অ্যানাউন্সমেন্ট)">
          <div className="space-y-6">
            <AnnouncementPreviewCard
              enabled={values.announcement_bar_enabled !== "false"}
              speed={Number(values.announcement_speed_sec) || 5}
              messages={[
                values.announcement_message_1,
                values.announcement_message_2,
                values.announcement_message_3,
                values.announcement_message_4,
              ]}
            />

            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-lg">শীর্ষ অ্যানাউন্সমেন্ট বার সেটিংস</h2>
                  <p className="text-xs text-muted-foreground">
                    সাইটের একদম ওপরে নোটিশ বা স্পেশাল অফার রোটেশন
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-background cursor-pointer hover:border-foreground/30 transition">
                  <input
                    type="checkbox"
                    checked={values.announcement_bar_enabled !== "false"}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        announcement_bar_enabled: e.target.checked ? "true" : "false",
                      }))
                    }
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-sm font-medium block">অ্যানাউন্সমেন্ট বার চালু রাখুন</span>
                    <span className="text-xs text-muted-foreground">আনচেক করলে পুরো সাইট থেকে বারটি লুকানো থাকবে</span>
                  </div>
                </label>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    মেসেজ পরিবর্তনের গতি (সেকেন্ড)
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={30}
                    value={values.announcement_speed_sec || "5"}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, announcement_speed_sec: e.target.value }))
                    }
                    placeholder="5"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <span className="text-[11px] text-muted-foreground mt-1 block">
                    কত সেকেন্ড পর পর বার্তা ঘুরবে (ডিফল্ট: ৫ সেকেন্ড)
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-border/60">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    বার্তা ১ (Message 1 - Primary)
                  </label>
                  <input
                    type="text"
                    value={values.announcement_message_1}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, announcement_message_1: e.target.value }))
                    }
                    placeholder="কালি ও ক্যানভাসে আধ্যাত্মিক প্রশান্তি — প্রিমিয়াম ইসলামিক ক্যালিগ্রাফি আর্ট"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    বার্তা ২ (Message 2 - Optional)
                  </label>
                  <input
                    type="text"
                    value={values.announcement_message_2}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, announcement_message_2: e.target.value }))
                    }
                    placeholder="সারা দেশে দ্রুত ক্যাশ অন ডেলিভারি সুবিধা"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    বার্তা ৩ (Message 3 - Optional)
                  </label>
                  <input
                    type="text"
                    value={values.announcement_message_3}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, announcement_message_3: e.target.value }))
                    }
                    placeholder="অরিজিনাল আর্ট ব্র্যান্ডস ও কোয়ালিটি পণ্য"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    বার্তা ৪ (Message 4 - Optional)
                  </label>
                  <input
                    type="text"
                    value={values.announcement_message_4}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, announcement_message_4: e.target.value }))
                    }
                    placeholder="জরুরি সহায়তায় সরাসরি কল বা WhatsApp করুন"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>
          </div>
        </SectionRow>
        <SectionRow id="courier" title="Courier API" subtitle="BDCourier & Steadfast fraud-check keys">
          <CourierSettingsPanel />
        </SectionRow>
        <SectionRow id="telegram" title="Telegram Alerts" subtitle="নতুন ও ইনকমপ্লিট অর্ডারের নোটিফিকেশন">
          <TelegramSettingsPanel />
        </SectionRow>
        <SectionRow id="hero" title="Hero Section" subtitle="Slider images, titles, featured cards" hidden={(values.section_hidden_hero ?? "") === "1"} actions={<HideEye flagKey="section_hidden_hero" values={values} setValues={setValues} />}>
        <div className="space-y-5">
          {/* Hero image & featured card */}
          <section className="mt-6 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
            <h2 className="font-display text-lg">Hero image & featured card</h2>
            <p className="text-xs text-muted-foreground -mt-4">
              Recommended: WebP/JPG, under 500KB. Large images are auto-compressed.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-56 aspect-[4/5] rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                {values.hero_image ? (
                  <img
                    src={values.hero_image}
                    alt="Hero preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                    No image — fallback used
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) =>
                    e.target.files?.[0] && onUpload(e.target.files[0])
                  }
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {uploading ? "Uploading…" : "Upload new image"}
                </button>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={values.hero_image}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, hero_image: e.target.value }))
                    }
                    placeholder="https://..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Leave blank to use the bundled default image.
                  </p>
                </div>

                <div className="pt-2 border-t border-border/60">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    Card title
                  </label>
                  <input
                    type="text"
                    value={values.hero_featured_title}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, hero_featured_title: e.target.value }))
                    }
                    placeholder="অ্যাক্রিলিক কালার সেট"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    Card description
                  </label>
                  <textarea
                    rows={2}
                    value={values.hero_featured_description}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, hero_featured_description: e.target.value }))
                    }
                    placeholder="প্রিমিয়াম পিগমেন্টেড আর্ট কালার কালেকশন"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="pt-2 border-t border-border/60">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    Linked category (image & card click)
                  </label>
                  <select
                    value={values.hero_category}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, hero_category: e.target.value }))
                    }
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">— None (not clickable) —</option>
                    {categories.map((c: string) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Select a category to make this slide's photo and featured card link to that category's products page.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Hero text */}
          <section className="mt-5 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="font-display text-lg">Hero text</h2>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Title — line 1
              </label>
              <input
                type="text"
                value={values.hero_title_line1}
                onChange={(e) =>
                  setValues((v) => ({ ...v, hero_title_line1: e.target.value }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Title — line 2 (italic accent)
              </label>
              <input
                type="text"
                value={values.hero_title_line2}
                onChange={(e) =>
                  setValues((v) => ({ ...v, hero_title_line2: e.target.value }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Description
              </label>
              <textarea
                rows={4}
                value={values.hero_description}
                onChange={(e) =>
                  setValues((v) => ({ ...v, hero_description: e.target.value }))
                }
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>

            <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  Button label
                </label>
                <input
                  type="text"
                  value={values.hero_cta_label}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, hero_cta_label: e.target.value }))
                  }
                  placeholder="Shop Now"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  Button link
                </label>
                <input
                  type="text"
                  value={values.hero_cta_href}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, hero_cta_href: e.target.value }))
                  }
                  placeholder="/products"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Use a path like <code>/products</code> or a full URL.
                </p>
              </div>
            </div>
            <div className="pt-3">
              <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={values.hero_cta_hidden === "1"}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      hero_cta_hidden: e.target.checked ? "1" : "",
                    }))
                  }
                  className="h-4 w-4 rounded border-border"
                />
                <span>Hide the button on the hero</span>
              </label>
            </div>
          </section>

          {/* Additional hero slides (2-4) */}
          {([2, 3, 4] as const).map((n) => {
            const imgKey = `hero_slide_${n}_image` as FieldKey;
            const t1Key = `hero_slide_${n}_title_line1` as FieldKey;
            const t2Key = `hero_slide_${n}_title_line2` as FieldKey;
            const descKey = `hero_slide_${n}_description` as FieldKey;
            const fTitleKey = `hero_slide_${n}_featured_title` as FieldKey;
            const fDescKey = `hero_slide_${n}_featured_description` as FieldKey;
            const slugKey = `hero_slide_${n}_category` as FieldKey;
            const isUp = !!uploadingSlide[n];
            return (
              <section
                key={n}
                className="mt-5 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5"
              >
                <div>
                  <h2 className="font-display text-lg">Hero slide {n}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Leave image blank to skip this slide. Slides without an image will not appear in the slider.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div className="w-full sm:w-56 aspect-[4/5] rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                    {values[imgKey] ? (
                      <img
                        src={values[imgKey]}
                        alt={`Hero slide ${n} preview`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs px-2 text-center">
                        No image — slide hidden
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-3 w-full">
                    <input
                      ref={(el) => {
                        slideFileRefs.current[n] = el;
                      }}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) =>
                        e.target.files?.[0] && onUploadSlide(e.target.files[0], n)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => slideFileRefs.current[n]?.click()}
                      disabled={isUp}
                      className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted disabled:opacity-60"
                    >
                      <Upload className="w-4 h-4" />
                      {isUp ? "Uploading…" : "Upload new image"}
                    </button>
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                        Image URL
                      </label>
                      <input
                        type="text"
                        value={values[imgKey]}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [imgKey]: e.target.value }))
                        }
                        placeholder="https://..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="pt-2 border-t border-border/60">
                      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                        Card title
                      </label>
                      <input
                        type="text"
                        value={values[fTitleKey]}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [fTitleKey]: e.target.value }))
                        }
                        placeholder="e.g. Pure Honey"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                        Card description
                      </label>
                      <textarea
                        rows={2}
                        value={values[fDescKey]}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [fDescKey]: e.target.value }))
                        }
                        placeholder="Short tagline for the floating card"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                      />
                    </div>

                    <div className="pt-2 border-t border-border/60">
                      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                        Linked category (image & card click)
                      </label>
                      <select
                        value={values[slugKey]}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [slugKey]: e.target.value }))
                        }
                        className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
                      >
                        <option value="">— None (not clickable) —</option>
                        {categories.map((c: string) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Title — line 1
                    </label>
                    <input
                      type="text"
                      value={values[t1Key]}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [t1Key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Title — line 2 (italic accent)
                    </label>
                    <input
                      type="text"
                      value={values[t2Key]}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [t2Key]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Description
                    </label>
                    <textarea
                      rows={4}
                      value={values[descKey]}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, [descKey]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        </SectionRow>


        <SectionRow id="categories" title="Categories" subtitle="Curated collection cards on home" hidden={(values.section_hidden_categories ?? "") === "1"} actions={<HideEye flagKey="section_hidden_categories" values={values} setValues={setValues} />}>
          <CategoriesEditor values={values} setValues={setValues} uploadTo={uploadTo} />
        </SectionRow>

        <SectionRow id="home-featured" title="Home — Featured Products" subtitle="Curated Edit / This Week's Favourites" hidden={(values.section_hidden_home_featured ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_featured" values={values} setValues={setValues} />}>
          <HomeTextEditor
            values={values}
            setValues={setValues}
            fields={[
              { key: "featured_kicker", label: "Small label", placeholder: "Curated Edit" },
              { key: "featured_title", label: "Heading", placeholder: "This Week's Favourites" },
            ]}
          />
        </SectionRow>

        <SectionRow id="home-popcat" title="Home — Popular Category" subtitle="Category strip under featured products" hidden={(values.section_hidden_home_popcat ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_popcat" values={values} setValues={setValues} />}>
          <HomeTextEditor
            values={values}
            setValues={setValues}
            fields={[
              { key: "popcat_kicker", label: "Small label", placeholder: "Popular Category" },
              { key: "popcat_title", label: "Heading", placeholder: "Decor — loved by our customers" },
              { key: "popcat_category", label: "Category name (must match a product category)", placeholder: "Decor" },
            ]}
          />
        </SectionRow>

        <SectionRow id="home-celebrate" title="Home — Celebrate Heading" subtitle="'What are you celebrating?' line above category grid" hidden={(values.section_hidden_home_celebrate ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_celebrate" values={values} setValues={setValues} />}>
          <HomeTextEditor
            values={values}
            setValues={setValues}
            fields={[
              { key: "celebrate_heading", label: "Heading", placeholder: "What are you celebrating?" },
            ]}
          />
          <div className="mt-4 p-3 rounded-md bg-muted/30 border border-border flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Eai grid e top-level menu categories show hosse (max 8). Notun category add korte ba ordering change korte menu categories page e jan.
            </p>
            <a
              href="/admin/menu-categories"
              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-full hover:bg-primary/90"
            >
              + Add / manage categories
            </a>
          </div>
        </SectionRow>

        <SectionRow id="home-ribbon" title="Home — Promise Ribbon" subtitle="4 scrolling items in the marquee belt" hidden={(values.section_hidden_home_ribbon ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_ribbon" values={values} setValues={setValues} />}>
          <HomeTextEditor
            values={values}
            setValues={setValues}
            fields={[
              { key: "ribbon_1_title", label: "Item 1 — title", placeholder: "Curated with Care" },
              { key: "ribbon_1_description", label: "Item 1 — description", placeholder: "Hand-picked pieces, never random" },
              { key: "ribbon_2_title", label: "Item 2 — title", placeholder: "Gift Wrapping Included" },
              { key: "ribbon_2_description", label: "Item 2 — description", placeholder: "Every order beautifully boxed" },
              { key: "ribbon_3_title", label: "Item 3 — title", placeholder: "Personalised Touch" },
              { key: "ribbon_3_description", label: "Item 3 — description", placeholder: "Notes, names, little surprises" },
              { key: "ribbon_4_title", label: "Item 4 — title", placeholder: "Made with Love" },
              { key: "ribbon_4_description", label: "Item 4 — description", placeholder: "From our studio to your gift list" },
            ]}
          />
        </SectionRow>

        <SectionRow id="home-spotlight" title="Home — Product Spotlight" subtitle="Headings above the single-product spotlight" hidden={(values.section_hidden_home_spotlight ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_spotlight" values={values} setValues={setValues} />}>
          <div className="space-y-5">
            <HomeTextEditor
              values={values}
              setValues={setValues}
              fields={[
                { key: "spotlight_kicker", label: "Small label", placeholder: "Product spotlight" },
                { key: "spotlight_title", label: "Heading", placeholder: "A closer look at one of our favourites" },
              ]}
            />
            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-3">
              <div>
                <h2 className="font-display text-lg">Featured product</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Konta product spotlight a dekhabe seta select korun. Khali rakhle automatically first featured product dekhabe.
                </p>
              </div>
              <select
                value={values.spotlight_product_slug ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, spotlight_product_slug: e.target.value }))}
                className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
              >
                <option value="">— Auto (first featured) —</option>
                {allProducts.map((p: any) => (
                  <option key={p.id} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </select>
            </section>
          </div>
        </SectionRow>

        <SectionRow id="home-showcase" title="Home — Product Showcase" subtitle="Headings above the swipeable product slider" hidden={(values.section_hidden_home_showcase ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_showcase" values={values} setValues={setValues} />}>
          <HomeTextEditor
            values={values}
            setValues={setValues}
            fields={[
              { key: "showcase_kicker", label: "Small label", placeholder: "In the spotlight" },
              { key: "showcase_title", label: "Heading", placeholder: "Look closer — swipe the photos" },
            ]}
          />
        </SectionRow>

        <SectionRow id="home-promise" title="Home — Our Promise" subtitle="Kicker, title and intro above the 4-step timeline" hidden={(values.section_hidden_home_promise ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_promise" values={values} setValues={setValues} />}>
          <div className="space-y-5">
            <HomeTextEditor
              values={values}
              setValues={setValues}
              fields={[
                { key: "promise_kicker", label: "Small label", placeholder: "Our Promise" },
                { key: "promise_title", label: "Heading", placeholder: "From our studio to your gift list" },
                { key: "promise_description", label: "Description", placeholder: "Every piece passes through a careful four-step journey…", textarea: true },
              ]}
            />
            <HomeTextEditor
              values={values}
              setValues={setValues}
              fields={[
                { key: "journey_1_title", label: "Step 1 — title", placeholder: "Designed" },
                { key: "journey_1_desc", label: "Step 1 — description", placeholder: "Sketched and styled in-house…", textarea: true },
                { key: "journey_2_title", label: "Step 2 — title", placeholder: "Crafted" },
                { key: "journey_2_desc", label: "Step 2 — description", placeholder: "Made by hand in small batches…", textarea: true },
                { key: "journey_3_title", label: "Step 3 — title", placeholder: "Wrapped" },
                { key: "journey_3_desc", label: "Step 3 — description", placeholder: "Hand-tied ribbons, gift boxes…", textarea: true },
                { key: "journey_4_title", label: "Step 4 — title", placeholder: "Delivered" },
                { key: "journey_4_desc", label: "Step 4 — description", placeholder: "Carefully shipped across Bangladesh…", textarea: true },
              ]}
            />
          </div>
        </SectionRow>

        <SectionRow id="home-testimonials" title="Home — Testimonials" subtitle="Headings above the customer photo marquee" hidden={(values.section_hidden_home_testimonials ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_testimonials" values={values} setValues={setValues} />}>
          <div className="space-y-5">
            <HomeTextEditor
              values={values}
              setValues={setValues}
              fields={[
                { key: "testimonials_kicker", label: "Small label", placeholder: "Loved By Households" },
                { key: "testimonials_title", label: "Heading", placeholder: "Stories from our customers" },
                { key: "testimonials_description", label: "Description", placeholder: "Real photos shared by our customers.", textarea: true },
              ]}
            />

            <div className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-3">
              <div>
                <h2 className="font-display text-lg">Customer photo cards</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Up to 6 cards. Leave the image blank to hide a card. Recommended square images.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {([1, 2, 3, 4, 5, 6] as const).map((n) => {
                  const imgKey = `testimonial_${n}_image` as FieldKey;
                  const nameKey = `testimonial_${n}_name` as FieldKey;
                  const locKey = `testimonial_${n}_location` as FieldKey;
                  const isUp = !!uploadingTestimonial[n];
                  return (
                    <div
                      key={n}
                      className="border border-border rounded-xl p-4 space-y-3 bg-background/40"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
                          {values[imgKey] ? (
                            <img
                              src={values[imgKey]}
                              alt={`Testimonial ${n}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">
                              No photo
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium mb-1">Card {n}</div>
                          <input
                            ref={(el) => {
                              testimonialFileRefs.current[n] = el;
                            }}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) =>
                              e.target.files?.[0] &&
                              onUploadTestimonial(e.target.files[0], n)
                            }
                          />
                          <button
                            type="button"
                            onClick={() => testimonialFileRefs.current[n]?.click()}
                            disabled={isUp}
                            className="inline-flex items-center gap-1.5 border border-border px-3 py-1.5 rounded-full text-xs hover:bg-muted disabled:opacity-60"
                          >
                            <Upload className="w-3 h-3" />
                            {isUp ? "Uploading…" : "Upload"}
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        value={values[imgKey]}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [imgKey]: e.target.value }))
                        }
                        placeholder="Image URL"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                      />
                      <input
                        type="text"
                        value={values[nameKey]}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [nameKey]: e.target.value }))
                        }
                        placeholder="Customer name (e.g. Tahmina R.)"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={values[locKey]}
                        onChange={(e) =>
                          setValues((v) => ({ ...v, [locKey]: e.target.value }))
                        }
                        placeholder="Location (e.g. Dhanmondi, Dhaka)"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </SectionRow>

        <SectionRow id="home-cta" title="Home — Final CTA Banner" subtitle="The closing 'Build a gift…' banner" hidden={(values.section_hidden_home_cta ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_cta" values={values} setValues={setValues} />}>
          <div className="space-y-5">
            <HomeTextEditor
              values={values}
              setValues={setValues}
              fields={[
                { key: "cta_kicker", label: "Small label", placeholder: "Curated Gift Box" },
                { key: "cta_title_line1", label: "Heading — line 1", placeholder: "Build a gift that" },
                { key: "cta_title_line2", label: "Heading — line 2 (italic accent)", placeholder: "feels like a hug." },
                { key: "cta_description", label: "Description", placeholder: "Handpick the pieces, add a personal note…", textarea: true },
                { key: "cta_badge", label: "Image overlay badge", placeholder: "Made by hand, 2026" },
                { key: "cta_button_1_label", label: "Button 1 label (→ Products)", placeholder: "Browse Gifts" },
                { key: "cta_button_2_label", label: "Button 2 label (→ Contact)", placeholder: "Talk to us on WhatsApp" },
              ]}
            />

            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
              <div>
                <h2 className="font-display text-lg">Banner image</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Left-side photo of the CTA banner. Leave blank for the bundled default.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-full sm:w-56 aspect-[4/5] rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                  {values.cta_image ? (
                    <img src={values.cta_image} alt="CTA preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      No image — fallback used
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3 w-full">
                  <input
                    ref={ctaFileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => e.target.files?.[0] && onUploadCta(e.target.files[0])}
                  />
                  <button
                    type="button"
                    onClick={() => ctaFileRef.current?.click()}
                    disabled={uploadingCta}
                    className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted disabled:opacity-60"
                  >
                    <Upload className="w-4 h-4" />
                    {uploadingCta ? "Uploading…" : "Upload new image"}
                  </button>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={values.cta_image}
                      onChange={(e) => setValues((v) => ({ ...v, cta_image: e.target.value }))}
                      placeholder="https://..."
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </SectionRow>

        <SectionRow id="home-faq" title="Home — FAQ" subtitle="Headings and 5 Q&A items" hidden={(values.section_hidden_home_faq ?? "") === "1"} actions={<HideEye flagKey="section_hidden_home_faq" values={values} setValues={setValues} />}>
          <div className="space-y-5">
            <HomeTextEditor
              values={values}
              setValues={setValues}
              fields={[
                { key: "faq_kicker", label: "Small label", placeholder: "Frequently Asked" },
                { key: "faq_title_line1", label: "Heading — line 1", placeholder: "Everything you" },
                { key: "faq_title_line2", label: "Heading — line 2", placeholder: "need to know" },
                { key: "faq_description", label: "Description", placeholder: "Thoughtful answers to the questions our customers ask most.", textarea: true },
                { key: "faq_link_label", label: "'Still curious' link label", placeholder: "Talk to us" },
              ]}
            />
            <HomeTextEditor
              values={values}
              setValues={setValues}
              fields={[
                { key: "faq_1_q", label: "Q1 — question", placeholder: "Are your gifts really premium?" },
                { key: "faq_1_a", label: "Q1 — answer", placeholder: "Yes. Every piece is made by hand…", textarea: true },
                { key: "faq_2_q", label: "Q2 — question", placeholder: "Do you offer gift wrapping?" },
                { key: "faq_2_a", label: "Q2 — answer", placeholder: "Absolutely — every order is beautifully wrapped…", textarea: true },
                { key: "faq_3_q", label: "Q3 — question", placeholder: "Do you offer cash on delivery?" },
                { key: "faq_3_a", label: "Q3 — answer", placeholder: "Absolutely. Cash on delivery is available…", textarea: true },
                { key: "faq_4_q", label: "Q4 — question", placeholder: "How long does delivery take?" },
                { key: "faq_4_a", label: "Q4 — answer", placeholder: "Inside Dhaka orders are typically delivered within 24 hours…", textarea: true },
                { key: "faq_5_q", label: "Q5 — question", placeholder: "Can I order a custom or personalised gift?" },
                { key: "faq_5_a", label: "Q5 — answer", placeholder: "Yes — message us on WhatsApp…", textarea: true },
              ]}
            />
          </div>
        </SectionRow>

        <SectionRow id="about" title="Our Story Page" subtitle="আমাদের গল্প, ব্র্যান্ড পরিচিতি, ক্যালিগ্রাফি স্টুডিও ও অঙ্গীকার">
        <div className="space-y-6">
          <AboutPreviewCard
            founderName={values.about_founder_name}
            tagline={values.about_founder_tagline}
            bio={values.about_founder_bio}
            photo={values.about_founder_photo}
            pullQuote={values.about_pull_quote}
            stat1Val={values.about_stat_1_value}
            stat1Lbl={values.about_stat_1_label}
            stat2Val={values.about_stat_2_value}
            stat2Lbl={values.about_stat_2_label}
            stat3Val={values.about_stat_3_value}
            stat3Lbl={values.about_stat_3_label}
          />
          {/* Founder photo & identity */}
          <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <UserIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display text-lg">Founder photo & identity</h2>
                <p className="text-xs text-muted-foreground">Shown at the top of the Our Story page.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="w-full sm:w-48 aspect-[4/5] rounded-xl overflow-hidden bg-muted border border-border shrink-0">
                {values.about_founder_photo ? (
                  <img src={values.about_founder_photo} alt="Founder preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center px-2">
                    No photo yet
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-3 w-full">
                <input
                  ref={founderFileRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => e.target.files?.[0] && onUploadFounder(e.target.files[0])}
                />
                <button
                  type="button"
                  onClick={() => founderFileRef.current?.click()}
                  disabled={uploadingFounder}
                  className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted disabled:opacity-60"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingFounder ? "Uploading…" : "Upload founder photo"}
                </button>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Photo URL</label>
                  <input
                    type="text"
                    value={values.about_founder_photo}
                    onChange={(e) => setValues((v) => ({ ...v, about_founder_photo: e.target.value }))}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="pt-2 border-t border-border/60">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Founder name</label>
                  <input
                    type="text"
                    value={values.about_founder_name}
                    onChange={(e) => setValues((v) => ({ ...v, about_founder_name: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Tagline (one line)</label>
                  <input
                    type="text"
                    value={values.about_founder_tagline}
                    onChange={(e) => setValues((v) => ({ ...v, about_founder_tagline: e.target.value }))}
                    placeholder="Calligrapher · Artist · Educator"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Role / Designation</label>
                  <input
                    type="text"
                    value={values.about_founder_role}
                    onChange={(e) => setValues((v) => ({ ...v, about_founder_role: e.target.value }))}
                    placeholder="প্রতিষ্ঠাতা ও প্রধান ক্যালিগ্রাফি শিল্পী"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Facebook Profile URL</label>
                  <input
                    type="url"
                    value={values.about_founder_fb}
                    onChange={(e) => setValues((v) => ({ ...v, about_founder_fb: e.target.value }))}
                    placeholder="https://www.facebook.com/ibnmobarakbd"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Short bio (1–2 lines)</label>
                  <textarea
                    rows={3}
                    value={values.about_founder_bio}
                    onChange={(e) => setValues((v) => ({ ...v, about_founder_bio: e.target.value }))}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Signature Quote (উক্তি)</label>
                  <textarea
                    rows={3}
                    value={values.about_founder_quote}
                    onChange={(e) => setValues((v) => ({ ...v, about_founder_quote: e.target.value }))}
                    placeholder="ক্যালিগ্রাফি শুধুই কাগজের ওপর হরফের বিন্যাস নয়..."
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Brand intro */}
          <section className="mt-5 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="font-display text-lg">Brand intro (top of page)</h2>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Paragraph 1</label>
              <textarea
                rows={3}
                value={values.about_brand_intro_1}
                onChange={(e) => setValues((v) => ({ ...v, about_brand_intro_1: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Paragraph 2</label>
              <textarea
                rows={3}
                value={values.about_brand_intro_2}
                onChange={(e) => setValues((v) => ({ ...v, about_brand_intro_2: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </section>

          {/* Article */}
          <section className="mt-5 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="font-display text-lg">Founder's article</h2>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Heading</label>
              <input
                type="text"
                value={values.about_article_heading}
                onChange={(e) => setValues((v) => ({ ...v, about_article_heading: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Body (separate paragraphs with a blank line)
              </label>
              <textarea
                rows={12}
                value={values.about_article_body}
                onChange={(e) => setValues((v) => ({ ...v, about_article_body: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Pull-quote (highlighted line in the middle)
              </label>
              <textarea
                rows={2}
                value={values.about_pull_quote}
                onChange={(e) => setValues((v) => ({ ...v, about_pull_quote: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </section>

          {/* Pillars */}
          <section className="mt-5 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="font-display text-lg">What he does — 4 craft pillars</h2>
            {[1, 2, 3, 4].map((n) => {
              const tKey = `about_pillar_${n}_title` as FieldKey;
              const dKey = `about_pillar_${n}_desc` as FieldKey;
              return (
                <div key={n} className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 first:border-0 first:pt-0">
                  <input
                    type="text"
                    value={values[tKey]}
                    onChange={(e) => setValues((v) => ({ ...v, [tKey]: e.target.value }))}
                    placeholder={`Pillar ${n} title`}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <textarea
                    rows={2}
                    value={values[dKey]}
                    onChange={(e) => setValues((v) => ({ ...v, [dKey]: e.target.value }))}
                    placeholder={`Pillar ${n} short description`}
                    className="sm:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              );
            })}
          </section>

          {/* Trust stats */}
          <section className="mt-5 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
            <h2 className="font-display text-lg">Trust stats (3 proof points)</h2>
            {[1, 2, 3].map((n) => {
              const vKey = `about_stat_${n}_value` as FieldKey;
              const lKey = `about_stat_${n}_label` as FieldKey;
              return (
                <div key={n} className="grid sm:grid-cols-3 gap-3 pt-3 border-t border-border/60 first:border-0 first:pt-0">
                  <input
                    type="text"
                    value={values[vKey]}
                    onChange={(e) => setValues((v) => ({ ...v, [vKey]: e.target.value }))}
                    placeholder={`Stat ${n} value (e.g. 1000+)`}
                    className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={values[lKey]}
                    onChange={(e) => setValues((v) => ({ ...v, [lKey]: e.target.value }))}
                    placeholder={`Stat ${n} label`}
                    className="sm:col-span-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              );
            })}
          </section>
        </div>
        </SectionRow>

        <SectionRow id="contact" title="Contact Info & Studio" subtitle="হটলাইন, স্টুডিও শো-রুম, বাল্ক অর্ডার ও সোশ্যাল লিংক">
          <div className="space-y-6">
            <ContactPreviewCard
              phone={values.contact_phone}
              phoneSecondary={values.contact_phone_secondary}
              email={values.contact_email}
              address={values.contact_address_full || values.contact_address}
              hoursBadge={values.contact_hours_badge}
              studioDesc={values.contact_studio_desc}
              studioImage={values.contact_studio_image}
              bulkTitle={values.contact_bulk_title}
              bulkDesc={values.contact_bulk_desc}
              bulkPoint1={values.contact_bulk_point_1}
              bulkPoint2={values.contact_bulk_point_2}
              bulkPoint3={values.contact_bulk_point_3}
              bulkCta={values.contact_bulk_cta}
            />

            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <PhoneIcon className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-lg">মৌলিক যোগাযোগ মাধ্যম</h2>
                  <p className="text-xs text-muted-foreground">
                    ফুটার, কন্টাক্ট পেজ ও হোয়াটসঅ্যাপ বাটনে তাৎক্ষণিকভাবে আপডেট হবে।
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">ইমেইল (Email)</label>
                  <input
                    type="email"
                    value={values.contact_email}
                    onChange={(e) => setValues((v) => ({ ...v, contact_email: e.target.value }))}
                    placeholder="ibnmobarakartgallery@gmail.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">ওয়েবসাইট ডোমেইন (Website Domain)</label>
                  <input
                    type="text"
                    value={values.contact_website_domain}
                    onChange={(e) => setValues((v) => ({ ...v, contact_website_domain: e.target.value }))}
                    placeholder="ibnmobarakartgallery.com"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ক্যাশ মেমো/ইনভয়েস ও সোশ্যাল শেয়ারিং লিংকে ব্যবহৃত হবে (যেমন: ibnmobarakartgallery.com)।
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">হটলাইন ১ (Primary Phone)</label>
                  <input
                    type="text"
                    value={values.contact_phone}
                    onChange={(e) => setValues((v) => ({ ...v, contact_phone: e.target.value }))}
                    placeholder="+880 1930-277557"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    কল লিংকের জন্য ব্যবহৃত হবে — কান্ট্রি কোড সহ রাখুন।
                  </p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">হটলাইন ২ (Secondary Phone - ঐচ্ছিক)</label>
                  <input
                    type="text"
                    value={values.contact_phone_secondary}
                    onChange={(e) => setValues((v) => ({ ...v, contact_phone_secondary: e.target.value }))}
                    placeholder="+880 1712-345678"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    কন্টাক্ট পেজে ব্যাকআপ ফোন নম্বর হিসেবে প্রদর্শিত হবে।
                  </p>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp নম্বর (Digits only)</label>
                  <input
                    type="text"
                    value={values.contact_whatsapp}
                    onChange={(e) => setValues((v) => ({ ...v, contact_whatsapp: e.target.value }))}
                    placeholder="8801930277557"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    কান্ট্রি কোড সহ শুধুমাত্র সংখ্যা। কোনো +, স্পেস বা হাইফেন নয়।
                  </p>
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp ডিসপ্লে লেবেল</label>
                  <input
                    type="text"
                    value={values.contact_whatsapp_display}
                    onChange={(e) => setValues((v) => ({ ...v, contact_whatsapp_display: e.target.value }))}
                    placeholder="+880 1930-277557"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp প্রি-ফিল্ড মেসেজ</label>
                <textarea
                  rows={2}
                  value={values.contact_whatsapp_message}
                  onChange={(e) => setValues((v) => ({ ...v, contact_whatsapp_message: e.target.value }))}
                  placeholder="Hello! I'd like to know more about your art collection."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">ঠিকানা (সংক্ষিপ্ত — ফুটারের জন্য)</label>
                  <input
                    type="text"
                    value={values.contact_address}
                    onChange={(e) => setValues((v) => ({ ...v, contact_address: e.target.value }))}
                    placeholder="Dhaka, Bangladesh"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">ঠিকানা (বিস্তারিত — কন্টাক্ট পেজ)</label>
                  <input
                    type="text"
                    value={values.contact_address_full}
                    onChange={(e) => setValues((v) => ({ ...v, contact_address_full: e.target.value }))}
                    placeholder="South Jatrabari, Dhaka"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>

              {/* Contact Page Subtitle */}
              <div className="pt-3 border-t border-border/60">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  কন্টাক্ট পেজ হেডার সাবটাইটেল
                </label>
                <input
                  type="text"
                  value={values.contact_hero_subtitle}
                  onChange={(e) => setValues((v) => ({ ...v, contact_hero_subtitle: e.target.value }))}
                  placeholder="আর্ট সামগ্রী, ক্যানভাস বা কাস্টম ফ্রেম সম্পর্কিত যেকোনো প্রয়োজনে যোগাযোগ করুন"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>

              {/* Physical Studio & Shop Customization */}
              <div className="pt-4 border-t border-border/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <h3 className="font-display text-sm font-semibold">ফিজিক্যাল স্টুডিও ও শপ কার্ড</h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      খোলা থাকার সময়সূচি ব্যাজ
                    </label>
                    <input
                      type="text"
                      value={values.contact_hours_badge}
                      onChange={(e) => setValues((v) => ({ ...v, contact_hours_badge: e.target.value }))}
                      placeholder="প্রতিদিন সকাল ১০টা - রাত ১০টা"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      স্টুডিও কার্ডের ছবি আপলোড
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        ref={studioFileRef}
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={(e) => e.target.files?.[0] && onUploadStudio(e.target.files[0])}
                      />
                      <button
                        type="button"
                        onClick={() => studioFileRef.current?.click()}
                        disabled={uploadingStudio}
                        className="inline-flex items-center gap-2 border border-border px-3.5 py-2 rounded-lg text-xs font-semibold hover:bg-muted disabled:opacity-60 shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {uploadingStudio ? "আপলোড হচ্ছে…" : "ছবি নির্বাচন"}
                      </button>
                      <input
                        type="text"
                        value={values.contact_studio_image}
                        onChange={(e) => setValues((v) => ({ ...v, contact_studio_image: e.target.value }))}
                        placeholder="বা ছবির URL দিন..."
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    স্টুডিওর বিবরণ বার্তা
                  </label>
                  <textarea
                    rows={2}
                    value={values.contact_studio_desc}
                    onChange={(e) => setValues((v) => ({ ...v, contact_studio_desc: e.target.value }))}
                    placeholder="সরাসরি দেখে অরিজিনাল ক্যানভাস পেইন্টিং, ব্রাশ ও আর্ট সাপ্লাই সংগ্রহ করতে আমাদের স্টুডিওতে আপনাকে স্বাগতম।"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Bulk & Custom Orders Section */}
              <div className="pt-4 border-t border-border/60 space-y-4">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <h3 className="font-display text-sm font-semibold">বাল্ক ও কাস্টম অর্ডার ব্যানার</h3>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">ব্যানার শিরোনাম</label>
                    <input
                      type="text"
                      value={values.contact_bulk_title}
                      onChange={(e) => setValues((v) => ({ ...v, contact_bulk_title: e.target.value }))}
                      placeholder="বাল্ক বা কাস্টম সাইজ ফ্রেম প্রয়োজন?"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">WhatsApp CTA বাটন লেখা</label>
                    <input
                      type="text"
                      value={values.contact_bulk_cta}
                      onChange={(e) => setValues((v) => ({ ...v, contact_bulk_cta: e.target.value }))}
                      placeholder="হোয়াটসঅ্যাপে আলোচনা করুন"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">ব্যানারের মূল বিবরণ</label>
                  <textarea
                    rows={2}
                    value={values.contact_bulk_desc}
                    onChange={(e) => setValues((v) => ({ ...v, contact_bulk_desc: e.target.value }))}
                    placeholder="স্কুল, কলেজ, আর্ট একাডেমি বা কর্পোরেট গিফটিংয়ের জন্য বিশেষ হোলসেল রেটে অর্ডার করতে সরাসরি আমাদের সাথে আলোচনা করুন।"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground">৩টি হাইলাইট বুলেট পয়েন্ট</label>
                  <input
                    type="text"
                    value={values.contact_bulk_point_1}
                    onChange={(e) => setValues((v) => ({ ...v, contact_bulk_point_1: e.target.value }))}
                    placeholder="বুলেট ১: কাস্টম সাইজ ক্যানভাস ও স্ট্রেচার বার তৈরি"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={values.contact_bulk_point_2}
                    onChange={(e) => setValues((v) => ({ ...v, contact_bulk_point_2: e.target.value }))}
                    placeholder="বুলেট ২: হোলসেল ও একাডেমি স্পেশাল ডিসকাউন্ট"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="text"
                    value={values.contact_bulk_point_3}
                    onChange={(e) => setValues((v) => ({ ...v, contact_bulk_point_3: e.target.value }))}
                    placeholder="বুলেট ৩: নিরাপদ কাঠের বক্সে জেলা পর্যায়ে ডেলিভারি"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>

              {/* Social URLs */}
              <div className="grid sm:grid-cols-2 gap-3 pt-3 border-t border-border/60">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Facebook URL</label>
                  <input
                    type="url"
                    value={values.contact_facebook_url}
                    onChange={(e) => setValues((v) => ({ ...v, contact_facebook_url: e.target.value }))}
                    placeholder="https://facebook.com/yourpage"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Instagram URL</label>
                  <input
                    type="url"
                    value={values.contact_instagram_url}
                    onChange={(e) => setValues((v) => ({ ...v, contact_instagram_url: e.target.value }))}
                    placeholder="https://instagram.com/yourpage"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">Messenger URL</label>
                  <input
                    type="url"
                    value={values.contact_messenger_url}
                    onChange={(e) => setValues((v) => ({ ...v, contact_messenger_url: e.target.value }))}
                    placeholder="https://m.me/yourpage"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>
          </div>
        </SectionRow>

        <SectionRow id="shipping_policy" title="Shipping Policy & Rates" subtitle="ঢাকার ভেতরে ও বাইরের ডেলিভারি চার্জ, সময়সীমা এবং পার্সেল ওজনের রেট">
          <div className="space-y-6">
            <ShippingRatesPreviewCard
              dhakaFee={values.shipping_dhaka_fee}
              dhakaTimeline={values.shipping_dhaka_timeline}
              outsideFee={values.shipping_outside_fee}
              outsideTimeline={values.shipping_outside_timeline}
              extraKgFee={values.shipping_extra_kg_fee}
              policyIntro={values.shipping_policy_intro}
            />

            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Truck className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="font-display text-lg">ডেলিভারি চার্জ ও সময়সীমা সেটিংস</h2>
                  <p className="text-xs text-muted-foreground">
                    এখানে দেওয়া রেট শিপিং পলিসি পেজ এবং ইউজার সাইটের চেকআউট ক্যালকুলেশনে স্বয়ংক্রিয়ভাবে কার্যকর হবে।
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  শিপিং পলিসি পেজ ভূমিকা (Policy Intro Text)
                </label>
                <textarea
                  rows={2}
                  value={values.shipping_policy_intro}
                  onChange={(e) => setValues((v) => ({ ...v, shipping_policy_intro: e.target.value }))}
                  placeholder="Ibn Mobarak Art Gallery-এর প্রতিটি আর্ট পণ্য ও ক্যানভাস অত্যন্ত সুরক্ষামূলক প্যাকেজিং সহ আপনার দ্বারে পৌঁছে দেওয়া হয়।"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4 pt-3 border-t border-border/60">
                <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block">ঢাকা সিটির ভেতরে</span>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      ডেলিভারি চার্জ (টাকায় / সংখ্যা)
                    </label>
                    <input
                      type="text"
                      value={values.shipping_dhaka_fee}
                      onChange={(e) => setValues((v) => ({ ...v, shipping_dhaka_fee: e.target.value }))}
                      placeholder="80"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      ডেলিভারি সময়সীমা
                    </label>
                    <input
                      type="text"
                      value={values.shipping_dhaka_timeline}
                      onChange={(e) => setValues((v) => ({ ...v, shipping_dhaka_timeline: e.target.value }))}
                      placeholder="২ থেকে ৩ কর্মদিবস"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/30 border border-border/70 space-y-3">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider block">ঢাকার বাইরে (সারাদেশ)</span>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      ডেলিভারি চার্জ (টাকায় / সংখ্যা)
                    </label>
                    <input
                      type="text"
                      value={values.shipping_outside_fee}
                      onChange={(e) => setValues((v) => ({ ...v, shipping_outside_fee: e.target.value }))}
                      placeholder="130"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      ডেলিভারি সময়সীমা
                    </label>
                    <input
                      type="text"
                      value={values.shipping_outside_timeline}
                      onChange={(e) => setValues((v) => ({ ...v, shipping_outside_timeline: e.target.value }))}
                      placeholder="৩ থেকে ৫ কর্মদিবস"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                  ১ কেজির বেশি ওজনে প্রতি কেজির অতিরিক্ত চার্জ (টাকায়)
                </label>
                <div className="sm:w-1/2">
                  <input
                    type="text"
                    value={values.shipping_extra_kg_fee}
                    onChange={(e) => setValues((v) => ({ ...v, shipping_extra_kg_fee: e.target.value }))}
                    placeholder="20"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-semibold"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    ক্যানভাস ও ফ্রেমের বাড়তি ওজনের ক্ষেত্রে কুরিয়ারের স্ট্যান্ডার্ড সারচার্জ।
                  </p>
                </div>
              </div>
            </section>
          </div>
        </SectionRow>

        <SectionRow id="footer" title="Footer" subtitle="ফুটার ব্র্যান্ড বার্তা, কাজের সময়সূচি ও কপিরাইট টেক্সট">
          <div className="space-y-6">
            <FooterPreviewCard
              tagline={values.footer_tagline}
              description={values.footer_description}
              openingHours={values.footer_opening_hours}
              copyright={values.footer_copyright_text}
              logoUrl={values.brand_logo_url}
            />

            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
              <h2 className="font-display text-lg">ফুটার কন্টেন্ট ও ব্র্যান্ড পরিচিতি</h2>
              <p className="text-xs text-muted-foreground -mt-4">
                ইউজার সাইটের নিচের ফুটারে প্রদর্শিত সকল লেখা এখান থেকে পরিবর্তন করুন।
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    ট্যাগলাইন (Tagline)
                  </label>
                  <input
                    type="text"
                    value={values.footer_tagline}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, footer_tagline: e.target.value }))
                    }
                    placeholder="বিশুদ্ধ রঙের স্পর্শে সৃজনশীলতার বিকাশ"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    সংক্ষিপ্ত ব্র্যান্ড পরিচিতি (Short Description)
                  </label>
                  <textarea
                    rows={2}
                    value={values.footer_description}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, footer_description: e.target.value }))
                    }
                    placeholder="প্রিমিয়াম কোয়ালিটি আর্ট সাপ্লাই ও ক্যালিগ্রাফি ফ্রেমের বিশ্বস্ত গ্যালারি।"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      অফিস / শোরুম সময়সূচি (Opening Hours)
                    </label>
                    <input
                      type="text"
                      value={values.footer_opening_hours}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, footer_opening_hours: e.target.value }))
                      }
                      placeholder="শনি - বৃহস্পতি: সকাল ১০টা - রাত ৮টা (শুক্রবার বন্ধ)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      কপিরাইট সমাপ্তি টেক্সট (Copyright Text)
                    </label>
                    <input
                      type="text"
                      value={values.footer_copyright_text}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, footer_copyright_text: e.target.value }))
                      }
                      placeholder="সর্বস্বত্ব সংরক্ষিত।"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                {/* Developer Credit Protected Info */}
                <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>
                      <strong className="text-foreground">ডেভেলপার ক্রেডিট (Developer Credit):</strong> Designed and developed by Ibrahim Kholilullah
                    </span>
                  </div>
                  <span className="self-start sm:self-auto px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                    স্থায়ী ও অপরিবর্তনযোগ্য (Locked)
                  </span>
                </div>
              </div>
            </section>
          </div>
        </SectionRow>

        <SectionRow id="product_perks" title="Product Page Delivery & Badges" subtitle="প্রোডাক্ট পেজ ডেলিভারি নোটিশ, চার্জ ও ৫টি ট্রাস্ট ব্যাজ">
          <div className="space-y-6">
            <ProductPerksPreviewCard
              whatsappCta={values.product_whatsapp_cta_text}
              deliveryNotice={values.product_delivery_notice}
              deliveryFee={values.product_delivery_fee_summary}
              badges={[
                values.product_badge_1 || "Premium",
                values.product_badge_2 || "Quality Checked",
                values.product_badge_3 || "Cash on Delivery",
                values.product_badge_4 || "Nationwide Delivery",
                values.product_badge_5 || "Gift-Wrapped",
              ]}
            />

            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
              <h2 className="font-display text-lg">প্রোডাক্ট বিস্তারিত পেজের তথ্য ও সুবিধা</h2>
              <p className="text-xs text-muted-foreground -mt-4">
                যেকোনো প্রোডাক্টের বিস্তারিত পেজে বাই-বক্সের নিচের নোটিশ ও ট্রাস্ট ব্যাজ কাস্টমাইজ করুন।
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    WhatsApp পরামর্শ বাটন টেক্সট (CTA)
                  </label>
                  <input
                    type="text"
                    value={values.product_whatsapp_cta_text}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, product_whatsapp_cta_text: e.target.value }))
                    }
                    placeholder="WhatsApp এ এই পণ্য সম্পর্কে প্রশ্ন করুন"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    সম্ভাব্য ডেলিভারি সময় নোটিশ (Estimated Dispatch Alert)
                  </label>
                  <input
                    type="text"
                    value={values.product_delivery_notice}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, product_delivery_notice: e.target.value }))
                    }
                    placeholder="আজ অর্ডার করলে সম্ভাব্য ডেলিভারি: ১-৩ কার্যদিবসের মধ্যে (ঢাকা ১-২ দিন, ঢাকার বাইরে ২-৪ দিন)"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    হোম ডেলিভারি চার্জ বিবরণ (Delivery Fee Summary)
                  </label>
                  <input
                    type="text"
                    value={values.product_delivery_fee_summary}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, product_delivery_fee_summary: e.target.value }))
                    }
                    placeholder="ঢাকা ৳৮০, ঢাকার বাইরে ৳১৩০ (১ কেজি পর্যন্ত ফিক্সড, এরপর প্রতি অতিরিক্ত কেজিতে ৳২০)।"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="pt-3 border-t border-border/60 space-y-3">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    ৫টি ট্রাস্ট ব্যাজের লেবেল (Trust Badges)
                  </h3>
                  <div className="grid sm:grid-cols-3 lg:grid-cols-5 gap-3">
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">ব্যাজ ১ (Award)</label>
                      <input
                        type="text"
                        value={values.product_badge_1}
                        onChange={(e) => setValues((v) => ({ ...v, product_badge_1: e.target.value }))}
                        placeholder="Premium"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">ব্যাজ ২ (Shield)</label>
                      <input
                        type="text"
                        value={values.product_badge_2}
                        onChange={(e) => setValues((v) => ({ ...v, product_badge_2: e.target.value }))}
                        placeholder="Quality Checked"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">ব্যাজ ৩ (Cash)</label>
                      <input
                        type="text"
                        value={values.product_badge_3}
                        onChange={(e) => setValues((v) => ({ ...v, product_badge_3: e.target.value }))}
                        placeholder="Cash on Delivery"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">ব্যাজ ৪ (Delivery)</label>
                      <input
                        type="text"
                        value={values.product_badge_4}
                        onChange={(e) => setValues((v) => ({ ...v, product_badge_4: e.target.value }))}
                        placeholder="Nationwide Delivery"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-muted-foreground mb-1">ব্যাজ ৫ (Gift)</label>
                      <input
                        type="text"
                        value={values.product_badge_5}
                        onChange={(e) => setValues((v) => ({ ...v, product_badge_5: e.target.value }))}
                        placeholder="Gift-Wrapped"
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </SectionRow>

        <SectionRow id="cart_delivery" title="Cart & Free Delivery" subtitle="কার্ট ড্রয়ার, ডেলিভারি স্ট্রিপ ও ফ্রি ডেলিভারি অফার নোটিশ">
          <div className="space-y-6">
            <CartDeliveryPreviewCard
              stripText={values.cart_delivery_strip_text}
              weightNote={values.cart_delivery_weight_note}
              threshold={Number(values.cart_free_shipping_threshold) || 2000}
              freeNote={values.cart_free_shipping_note}
              standardNote={values.cart_standard_shipping_note}
            />

            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-display text-lg">কার্ট ড্রয়ার ও ফ্রি ডেলিভারি অফার</h2>
                  <p className="text-xs text-muted-foreground">
                    কার্টের ওপরের ডেলিভারি স্ট্রিপ ও ফ্রি ডেলিভারি থ্রেশহোল্ড পরিবর্তন করুন
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    কার্ট শীর্ষ ডেলিভারি স্ট্রিপ টেক্সট
                  </label>
                  <input
                    type="text"
                    value={values.cart_delivery_strip_text}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, cart_delivery_strip_text: e.target.value }))
                    }
                    placeholder="🚚 ডেলিভারি: ঢাকা ৳৮০ · বাইরে ৳১৩০"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    ওজন পলিসি নোট (Weight Note)
                  </label>
                  <input
                    type="text"
                    value={values.cart_delivery_weight_note}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, cart_delivery_weight_note: e.target.value }))
                    }
                    placeholder="১ কেজি পর্যন্ত ফিক্সড, এরপর প্রতি অতিরিক্ত কেজিতে ৳২০ যোগ হবে"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="pt-3 border-t border-border/60 grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      ফ্রি ডেলিভারি ন্যূনতম অর্ডার (টাকায়)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={100}
                      value={values.cart_free_shipping_threshold || "2000"}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, cart_free_shipping_threshold: e.target.value }))
                      }
                      placeholder="2000"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                    <span className="text-[11px] text-muted-foreground mt-1 block">
                      কত টাকার বেশি অর্ডারে ফ্রি ডেলিভারি সক্রিয় হবে (ডিফল্ট: 2000)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      ফ্রি ডেলিভারি অর্জিত হলে বার্তা
                    </label>
                    <input
                      type="text"
                      value={values.cart_free_shipping_note}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, cart_free_shipping_note: e.target.value }))
                      }
                      placeholder="✓ এই অর্ডারে কোনো ডেলিভারি চার্জ প্রযোজ্য হবে না।"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    সাধারণ ডেলিভারি চার্জ নোট (চেকআউট বার্তা)
                  </label>
                  <input
                    type="text"
                    value={values.cart_standard_shipping_note}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, cart_standard_shipping_note: e.target.value }))
                    }
                    placeholder="ডেলিভারি চার্জ চেকআউটে হিসাব করা হবে (ঢাকা ৳৮০, বাইরে ৳১৩০)।"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>
              </div>
            </section>
          </div>
        </SectionRow>

        <SectionRow id="shop_catalog" title="Shop Page Banner & Checkout" subtitle="শপ ক্যাটালগ হেডার, ভেরিফায়েড ব্যাজ ও চেকআউট ট্রাস্ট গ্যারান্টি">
          <div className="space-y-6">
            <ShopAndCheckoutPreviewCard
              shopTitle={values.shop_hero_title}
              shopDesc={values.shop_hero_description}
              badgeTop={values.shop_badge_top}
              badgeSub={values.shop_badge_sub}
              checkoutCod={values.checkout_badge_cod_text}
              perk1Title={values.checkout_perk_1_title}
              perk1Desc={values.checkout_perk_1_desc}
              perk2Title={values.checkout_perk_2_title}
              perk2Desc={values.checkout_perk_2_desc}
            />

            <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
              <h2 className="font-display text-lg">শপ ক্যাটালগ ব্যানার ও টেক্সট</h2>
              <p className="text-xs text-muted-foreground -mt-4">
                ক্যাটালগ পেজের শীর্ষ ব্যানার ও চেকআউট পাতার ট্রাস্ট ব্যাজ কাস্টমাইজ করুন
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    শপ পেজ প্রধান শিরোনাম (Catalog Headline)
                  </label>
                  <input
                    type="text"
                    value={values.shop_hero_title}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, shop_hero_title: e.target.value }))
                    }
                    placeholder="The Art & Craft Collection"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                    শপ পেজ উপ-শিরোনাম / বিবরণী (Subtitle)
                  </label>
                  <textarea
                    rows={2}
                    value={values.shop_hero_description}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, shop_hero_description: e.target.value }))
                    }
                    placeholder="ক্যানভাস, অ্যাক্রিলিক কালার, ইসলামিক ক্যালিগ্রাফি ও পেইন্টিং সামগ্রীর বিশাল সম্ভার"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      ব্যানার স্ট্যাটাস ব্যাজ (Top Label)
                    </label>
                    <input
                      type="text"
                      value={values.shop_badge_top}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, shop_badge_top: e.target.value }))
                      }
                      placeholder="Verified Catalog"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      ব্যানার স্ট্যাটাস বিবরণী (Sub Label)
                    </label>
                    <input
                      type="text"
                      value={values.shop_badge_sub}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, shop_badge_sub: e.target.value }))
                      }
                      placeholder="৩,৯০০+ আইটেম রেডি স্টক"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border/60 space-y-4">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                    চেকআউট পেজ ট্রাস্ট ব্যাজ সেটিংস
                  </h3>

                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                      ক্যাশ অন ডেলিভারি ব্যাজ টেক্সট
                    </label>
                    <input
                      type="text"
                      value={values.checkout_badge_cod_text}
                      onChange={(e) =>
                        setValues((v) => ({ ...v, checkout_badge_cod_text: e.target.value }))
                      }
                      placeholder="ক্যাশ অন ডেলিভারি (হোম ডেলিভারি)"
                      className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
                    />
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl border border-border bg-background space-y-2.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-amber-500" />
                        ট্রাস্ট পারক ১ (কোয়ালিটি গ্যারান্টি)
                      </span>
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">টাইটেল</label>
                        <input
                          type="text"
                          value={values.checkout_perk_1_title}
                          onChange={(e) => setValues((v) => ({ ...v, checkout_perk_1_title: e.target.value }))}
                          placeholder="১০০% আসল পণ্য"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">সাবটাইটেল</label>
                        <input
                          type="text"
                          value={values.checkout_perk_1_desc}
                          onChange={(e) => setValues((v) => ({ ...v, checkout_perk_1_desc: e.target.value }))}
                          placeholder="যাচাইকৃত কোয়ালিটি"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-border bg-background space-y-2.5">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-amber-500" />
                        ট্রাস্ট পারক ২ (প্যাকেজিং ও ডেলিভারি)
                      </span>
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">টাইটেল</label>
                        <input
                          type="text"
                          value={values.checkout_perk_2_title}
                          onChange={(e) => setValues((v) => ({ ...v, checkout_perk_2_title: e.target.value }))}
                          placeholder="নিরাপদ ডেলিভারি"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-muted-foreground mb-1">সাবটাইটেল</label>
                        <input
                          type="text"
                          value={values.checkout_perk_2_desc}
                          onChange={(e) => setValues((v) => ({ ...v, checkout_perk_2_desc: e.target.value }))}
                          placeholder="বাবল-র‍্যাপ প্রোটেকশন"
                          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </SectionRow>

        <SectionRow id="tracking" title="Tracking" subtitle="Meta Pixel & analytics">
        <section className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-lg">Tracking & Analytics</h2>
              <p className="text-xs text-muted-foreground">
                Facebook / Meta Pixel for ads conversion tracking.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
              Meta Pixel ID
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={values.meta_pixel_id}
              onChange={(e) =>
                setValues((v) => ({ ...v, meta_pixel_id: e.target.value.replace(/[^\d]/g, "") }))
              }
              placeholder="e.g. 1234567890123456"
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-mono tracking-wide"
            />
            <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
              Khali rakhle pixel disabled thakbe — kono tracking script load hobe na.
              Facebook <strong>Events Manager → Data Sources</strong> theke Pixel ID
              copy kore ekhane paste korben. Save korar por public site er sob page e
              automatic <code>PageView</code> ebong order success page e <code>Purchase</code> event
              fire hobe.
            </p>
          </div>
        </section>
        </SectionRow>
        {customSections
          .slice()
          .sort((a, b) => a.position - b.position)
          .map((s) => (
            <CustomSectionRow key={s.id} id={s.id} section={s} />
          ))}
        </AccordionList>
        </div>
      )}

      {!isLoading && !error && (
        <div className="sticky bottom-0 mt-6 -mx-5 md:mx-0 px-5 md:px-0 py-4 bg-background/95 backdrop-blur border-t border-border md:border-0 md:bg-transparent flex justify-end">
          <button
            onClick={save}
            disabled={saving || uploading || uploadingFounder || uploadingStudio}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

type UploadFn = (
  file: File,
  field: FieldKey,
  prefix: string,
  setBusy: (b: boolean) => void,
  ref: React.RefObject<HTMLInputElement | null>,
) => Promise<void>;

function CategoriesEditor({
  values,
  setValues,
  uploadTo,
}: {
  values: Record<FieldKey, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<FieldKey, string>>>;
  uploadTo: UploadFn;
}) {
  const { data: realCategories = [] } = useQuery(productsCategoriesOptions());

  return (
    <section className="mt-6 bg-card border border-border rounded-2xl p-5 md:p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
          <LayoutGrid className="w-4 h-4" />
        </div>
        <div>
          <h2 className="font-display text-lg">Curated Collections (Home page)</h2>
          <p className="text-xs text-muted-foreground">
            6 ta category card — image, label, tag ar click korle kon product category dekhabe seta set korun.
            Image / label khali rakhle default fallback bosbe.
          </p>
        </div>
      </div>

      {[1, 2, 3, 4, 5, 6].map((n) => (
        <CategoryRow
          key={n}
          index={n}
          values={values}
          setValues={setValues}
          uploadTo={uploadTo}
          realCategories={realCategories}
        />
      ))}
    </section>
  );
}

function CategoryRow({
  index,
  values,
  setValues,
  uploadTo,
  realCategories,
}: {
  index: number;
  values: Record<FieldKey, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<FieldKey, string>>>;
  uploadTo: UploadFn;
  realCategories: string[];
}) {
  const imageKey = `category_${index}_image` as FieldKey;
  const labelKey = `category_${index}_label` as FieldKey;
  const tagKey = `category_${index}_tag` as FieldKey;
  const targetKey = `category_${index}_target` as FieldKey;

  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="pt-5 border-t border-border/60 first:border-0 first:pt-0">
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground mb-3">
        Card {index}
      </div>
      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="w-full sm:w-40 aspect-square rounded-xl overflow-hidden bg-muted border border-border shrink-0">
          {values[imageKey] ? (
            <img
              src={values[imageKey]}
              alt={`Category ${index} preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center px-2">
              No image — default used
            </div>
          )}
        </div>

        <div className="flex-1 space-y-3 w-full">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) =>
              e.target.files?.[0] &&
              uploadTo(e.target.files[0], imageKey, `category-${index}`, setBusy, fileRef)
            }
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="inline-flex items-center gap-2 border border-border px-4 py-2 rounded-full text-sm hover:bg-muted disabled:opacity-60"
          >
            <Upload className="w-4 h-4" />
            {busy ? "Uploading…" : "Upload image"}
          </button>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Label (card name)
              </label>
              <input
                type="text"
                value={values[labelKey]}
                onChange={(e) => setValues((v) => ({ ...v, [labelKey]: e.target.value }))}
                placeholder="Fresh Fruits"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
                Tag (small text)
              </label>
              <input
                type="text"
                value={values[tagKey]}
                onChange={(e) => setValues((v) => ({ ...v, [tagKey]: e.target.value }))}
                placeholder="Seasonal"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
              Target product category (click korle kothay jabe)
            </label>
            <select
              value={values[targetKey] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [targetKey]: e.target.value }))}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              <option value="">All products (no filter)</option>
              {realCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Options gulo product database theke auto load hoy.
              {values[targetKey] && !realCategories.includes(values[targetKey]) && (
                <>
                  {" "}
                  <span className="text-amber-600">Current value "{values[targetKey]}" exists in saved data but not in product DB.</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reusable simple text-field group for new home-page sections ───
type HomeTextField = {
  key: FieldKey;
  label: string;
  placeholder?: string;
  textarea?: boolean;
};

function HomeTextEditor({
  values,
  setValues,
  fields,
}: {
  values: Record<FieldKey, string>;
  setValues: React.Dispatch<React.SetStateAction<Record<FieldKey, string>>>;
  fields: HomeTextField[];
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-5 md:p-6 space-y-4">
      <p className="text-[11px] text-muted-foreground">
        Khali rakhle site er default text dekhabe — kichu break hobe na.
      </p>
      {fields.map((f) => (
        <div key={f.key}>
          <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-1.5">
            {f.label}
          </label>
          {f.textarea ? (
            <textarea
              rows={3}
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          ) : (
            <input
              type="text"
              value={values[f.key] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm"
            />
          )}
        </div>
      ))}
    </div>
  );
}
