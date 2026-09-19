import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/external";

export type LandingFeature = { title: string; description?: string; icon?: string };
export type LandingFaq = { question: string; answer: string };
export type LandingTrustItem = { icon?: string; text: string };
export type LandingJourneyStep = { n: string; t: string; d?: string };
export type LandingStatItem = { n: string; l: string };

export type LandingPage = {
  id: string;
  slug: string;
  product_id: string | null;
  is_active: boolean;
  hero_headline: string;
  hero_subheadline: string;
  hero_image_url: string | null;
  offer_text: string | null;
  urgency_text: string | null;
  discount_amount: number | null;
  discount_percent: number | null;
  free_delivery: boolean;
  features: LandingFeature[];
  testimonial_ids: string[];
  faq: LandingFaq[];
  cta_button_text: string;
  cta_phone: string | null;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  meta_pixel_id: string | null;
  review_images: string[];
  video_url: string | null;
  video_urls: string | null;
  video_label: string | null;
  video_heading: string | null;
  video_description: string | null;
  // newly editable (all nullable — code falls back to defaults when null/empty)
  hero_bullets: string[] | null;
  hero_badge_top: string | null;
  hero_badge_bottom: string | null;
  trust_strip: LandingTrustItem[] | null;
  testimonials_kicker: string | null;
  testimonials_title: string | null;
  features_kicker: string | null;
  features_title: string | null;
  amrapali_kicker: string | null;
  amrapali_title: string | null;
  amrapali_points: string[] | null;
  promise_kicker: string | null;
  promise_title: string | null;
  promise_items: string[] | null;
  journey_kicker: string | null;
  journey_title: string | null;
  journey_steps: LandingJourneyStep[] | null;
  stats_kicker: string | null;
  stats_title: string | null;
  stats_items: LandingStatItem[] | null;
  faq_kicker: string | null;
  faq_title: string | null;
  final_cta_kicker: string | null;
  final_cta_title: string | null;
  final_cta_description: string | null;
  quantity_note: string | null;
  created_at: string;
  updated_at: string;
};

export const landingPagesListOptions = (opts?: { activeOnly?: boolean }) =>
  queryOptions({
    queryKey: ["landing-pages", opts?.activeOnly ? "active" : "all"],
    // Always refetch on mount / focus so admin edits show up instantly in the
    // preview tab without a manual full-page refresh.
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    queryFn: async () => {
      let q = supabase
        .from("landing_pages" as any)
        .select("*")
        .order("updated_at", { ascending: false });
      if (opts?.activeOnly) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as LandingPage[];
    },
  });

export const landingPageBySlugOptions = (slug: string) =>
  queryOptions({
    queryKey: ["landing-page", slug],
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("landing_pages" as any)
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as LandingPage | null;
    },
  });
