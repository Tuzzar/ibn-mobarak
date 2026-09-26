import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, ExternalLink, ArrowLeft, Upload, Copy, Settings, Power, Pencil } from "lucide-react";
import { AccordionList, SectionRow } from "@/components/admin/SectionAccordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/external";
import { uploadFileToR2 } from "@/lib/r2-storage";
import { useAuth } from "@/lib/auth";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { landingPagesListOptions, type LandingPage, type LandingFeature, type LandingFaq, type LandingTrustItem, type LandingJourneyStep, type LandingStatItem } from "@/lib/landing-queries";
import { allProductsSlugOptions } from "@/lib/queries";

export const Route = createFileRoute("/admin/landing")({
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(landingPagesListOptions());
  },
  component: AdminLanding,
  head: () => ({
    meta: [
      { title: "Landing Pages — Admin" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const emptyPage = (): Partial<LandingPage> => ({
  slug: "",
  product_id: null,
  is_active: true,
  hero_headline: "",
  hero_subheadline: "",
  hero_image_url: null,
  offer_text: null,
  urgency_text: null,
  discount_amount: null,
  discount_percent: null,
  free_delivery: true,
  features: [],
  testimonial_ids: [],
  faq: [],
  cta_button_text: "অর্ডার করুন",
  cta_phone: null,
  seo_title: null,
  seo_description: null,
  og_image_url: null,
  meta_pixel_id: null,
  review_images: [],
  video_url: null,
  video_urls: null,
  video_label: null,
  video_heading: null,
  video_description: null,
  hero_bullets: null,
  hero_badge_top: null,
  hero_badge_bottom: null,
  trust_strip: null,
  testimonials_kicker: null,
  testimonials_title: null,
  features_kicker: null,
  features_title: null,
  amrapali_kicker: null,
  amrapali_title: null,
  amrapali_points: null,
  promise_kicker: null,
  promise_title: null,
  promise_items: null,
  journey_kicker: null,
  journey_title: null,
  journey_steps: null,
  stats_kicker: null,
  stats_title: null,
  stats_items: null,
  faq_kicker: null,
  faq_title: null,
  final_cta_kicker: null,
  final_cta_title: null,
  final_cta_description: null,
  quantity_note: null,
});

function AdminLanding() {
  const { isAdmin } = useAuth();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data: pages } = useSuspenseQuery(landingPagesListOptions());
  const [editing, setEditing] = useState<Partial<LandingPage> | null>(null);

  if (!isAdmin) {
    return <div className="p-8 text-muted-foreground">Not authorized.</div>;
  }

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["landing-pages"] });
  };

  const onDelete = async (id: string) => {
    const target = (pages ?? []).find((p) => p.id === id);
    const label = target?.slug ? `"${target.slug}"` : "this landing page";
    const ok = await confirm({
      title: "Delete Landing Page?",
      description: `Are you sure you want to delete ${label}? All custom content for this landing page will be removed.`,
      confirmText: "Delete",
      variant: "destructive",
      icon: "trash",
    });
    if (!ok) return;
    const { error } = await supabase.from("landing_pages" as any).delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      refresh();
    }
  };

  const onToggle = async (p: LandingPage) => {
    const { error } = await supabase
      .from("landing_pages" as any)
      .update({ is_active: !p.is_active })
      .eq("id", p.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const onDuplicate = async (p: LandingPage) => {
    const existingSlugs = new Set(pages.map((x) => x.slug));
    const base = `${p.slug}-copy`;
    let newSlug = base;
    let i = 2;
    while (existingSlugs.has(newSlug)) {
      newSlug = `${base}-${i++}`;
    }
    const { id, created_at, updated_at, ...rest } = p as any;
    const payload = {
      ...rest,
      slug: newSlug,
      is_active: false,
      hero_headline: p.hero_headline ? `${p.hero_headline} (Copy)` : p.hero_headline,
    };
    const { error } = await supabase.from("landing_pages" as any).insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Duplicated as inactive draft");
      refresh();
    }
  };

  if (editing) {
    return (
      <Editor
        initial={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          refresh();
          setEditing(null);
        }}
      />
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl md:text-3xl text-primary">Landing Pages</h1>
          <p className="text-sm text-muted-foreground">Ad-specific landing pages for FB campaigns.</p>
        </div>
        <button
          onClick={() => setEditing(emptyPage())}
          className="inline-flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> New page
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
          No landing pages yet. Click "New page" to create one.
        </div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
          {pages.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/40">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium truncate">{p.hero_headline || p.slug}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      p.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground truncate">/landing/{p.slug}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to="/landing/$slug"
                  params={{ slug: p.slug }}
                  target="_blank"
                  className="p-2 hover:text-primary"
                  aria-label="Open"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="h-8 w-8 rounded-md border border-border hover:bg-muted inline-flex items-center justify-center"
                      aria-label="Settings"
                      title="Settings"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem onClick={() => setEditing(p)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onToggle(p)}>
                      <Power className="w-4 h-4 mr-2" />
                      {p.is_active ? "Deactivate" : "Activate"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDuplicate(p)}>
                      <Copy className="w-4 h-4 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(p.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function parseVideoUrls(urls: unknown, fallbackUrl?: unknown): string[] {
  if (Array.isArray(urls)) {
    return urls.filter((x): x is string => typeof x === "string" && Boolean(x.trim()));
  }
  if (typeof urls === "string" && urls.trim()) {
    return urls.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(fallbackUrl)) {
    return fallbackUrl.filter((x): x is string => typeof x === "string" && Boolean(x.trim()));
  }
  if (typeof fallbackUrl === "string" && fallbackUrl.trim()) {
    return fallbackUrl.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function Editor({
  initial,
  onClose,
  onSaved,
}: {
  initial: Partial<LandingPage>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [v, setV] = useState<Partial<LandingPage>>(initial);
  const [whatsappNumber, setWhatsappNumber] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingReview, setUploadingReview] = useState(false);
  const { data: products = [] } = useQuery(allProductsSlugOptions());
  const fileRef = useRef<HTMLInputElement>(null);
  const reviewFileRef = useRef<HTMLInputElement>(null);

  // Load per-page WhatsApp number from site_content
  useEffect(() => {
    if (!initial.slug) return;
    let active = true;
    (async () => {
      const { data } = (await (supabase as any)
        .from("site_content")
        .select("value")
        .eq("key", `landing_whatsapp_${initial.slug}`)
        .maybeSingle()) as { data: { value?: string } | null };
      if (active && data?.value) {
        setWhatsappNumber(data.value);
      }
    })();
    return () => {
      active = false;
    };
  }, [initial.slug]);

  // ---- Global landing-page texts (stored in site_content, shared by ALL landing pages) ----
  const GLOBAL_TEXT_KEYS = [
    "landing_default_phone",
    "landing_default_whatsapp",
    "landing_security_note",
    "landing_visit_eyebrow",
    "landing_visit_headline",
    "landing_visit_description",
    "landing_visit_button",
    "landing_form_legend",
    "landing_form_label_name",
    "landing_form_label_phone",
    "landing_form_label_address",
    "landing_form_label_notes",
    "landing_form_summary_delivery",
    "landing_form_summary_delivery_value",
    "landing_form_summary_savings",
    "landing_form_summary_total",
    "landing_form_cta_fallback",
  ] as const;
  type GlobalTextKey = (typeof GLOBAL_TEXT_KEYS)[number];
  const [globalTexts, setGlobalTexts] = useState<Record<GlobalTextKey, string>>(
    () => Object.fromEntries(GLOBAL_TEXT_KEYS.map((k) => [k, ""])) as Record<GlobalTextKey, string>,
  );
  const [savingGlobal, setSavingGlobal] = useState(false);
  const qc = useQueryClient();
  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("site_content" as any)
        .select("key,value")
        .in("key", GLOBAL_TEXT_KEYS as unknown as string[]);
      if (!active || !data) return;
      const next = { ...globalTexts };
      for (const row of data as unknown as Array<{ key: string; value: string | null }>) {
        if ((GLOBAL_TEXT_KEYS as readonly string[]).includes(row.key)) {
          next[row.key as GlobalTextKey] = row.value ?? "";
        }
      }
      setGlobalTexts(next);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const updGlobal = (k: GlobalTextKey, val: string) =>
    setGlobalTexts((g) => ({ ...g, [k]: val }));
  const saveGlobalTexts = async () => {
    if (savingGlobal) return;
    setSavingGlobal(true);
    try {
      const rows = GLOBAL_TEXT_KEYS.map((key) => ({ key, value: globalTexts[key] ?? "" }));
      const { error: upErr } = await supabase
        .from("site_content" as any)
        .upsert(rows, { onConflict: "key" });
      if (upErr) {
        toast.error(upErr.message);
        return;
      }
      toast.success("Landing texts saved (applies to all landing pages)");
      qc.invalidateQueries({ queryKey: ["site-content"] });
    } finally {
      setSavingGlobal(false);
    }
  };

  const uploadOne = async (file: File): Promise<string | null> => {
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `reviews/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      return await uploadFileToR2(file, "landing", filename);
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
      return null;
    }
  };

  const onUploadReviewImages = async (files: FileList) => {
    setUploadingReview(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        if (f.size > 5 * 1024 * 1024) {
          toast.error(`${f.name}: too large (max 5MB)`);
          continue;
        }
        const url = await uploadOne(f);
        if (url) urls.push(url);
      }
      if (urls.length) {
        upd("review_images", [...(v.review_images ?? []), ...urls]);
        toast.success(`${urls.length} image(s) uploaded to Cloudflare R2`);
      }
    } finally {
      setUploadingReview(false);
      if (reviewFileRef.current) reviewFileRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!v.slug && v.hero_headline) {
      setV((x) => ({ ...x, slug: slugify(v.hero_headline!) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v.hero_headline]);

  const upd = <K extends keyof LandingPage>(k: K, val: any) =>
    setV((x) => ({ ...x, [k]: val }));

  const onUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large (max 5MB)");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}.${ext}`;
      const publicUrl = await uploadFileToR2(file, "landing", filename);
      upd("hero_image_url", publicUrl);
      toast.success("Image uploaded to Cloudflare R2");
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const save = async () => {
    if (!v.slug?.trim()) {
      toast.error("Slug is required");
      return;
    }
    if (!v.hero_headline?.trim()) {
      toast.error("Headline is required");
      return;
    }
    setSaving(true);
    const cleanedVideoUrls = parseVideoUrls(v.video_urls, v.video_url);
    const joinedVideoUrls = cleanedVideoUrls.length ? cleanedVideoUrls.join("\n") : null;
    // Store ALL urls (newline-joined) in the legacy video_url column too,
    // so multiple videos survive even when the video_urls column doesn't
    // exist in the production DB. The reader splits both columns by newline.
    const firstVideoUrl = joinedVideoUrls;
    const payload: Record<string, any> = {
      slug: v.slug!.trim(),
      product_id: v.product_id || null,
      is_active: v.is_active ?? true,
      hero_headline: v.hero_headline ?? "",
      hero_subheadline: v.hero_subheadline ?? "",
      hero_image_url: v.hero_image_url || null,
      offer_text: v.offer_text || null,
      urgency_text: v.urgency_text || null,
      discount_amount:
        v.discount_amount === null || v.discount_amount === undefined || (v.discount_amount as any) === ""
          ? null
          : Math.max(0, Math.floor(Number(v.discount_amount))),
      discount_percent:
        v.discount_percent === null || v.discount_percent === undefined || (v.discount_percent as any) === ""
          ? null
          : Math.max(0, Math.min(90, Math.floor(Number(v.discount_percent)))),
      free_delivery: v.free_delivery ?? true,
      features: v.features ?? [],
      testimonial_ids: v.testimonial_ids ?? [],
      faq: v.faq ?? [],
      cta_button_text: v.cta_button_text || "অর্ডার করুন",
      cta_phone: v.cta_phone || null,
      seo_title: v.seo_title || null,
      seo_description: v.seo_description || null,
      og_image_url: v.og_image_url || null,
      meta_pixel_id: v.meta_pixel_id || null,
      review_images: v.review_images ?? [],
      video_url: firstVideoUrl,
      video_urls: joinedVideoUrls,
      video_label: v.video_label || null,
      video_heading: v.video_heading || null,
      video_description: v.video_description || null,
      hero_bullets: (v.hero_bullets ?? []).filter((s) => s && s.trim()).length ? v.hero_bullets : null,
      hero_badge_top: v.hero_badge_top || null,
      hero_badge_bottom: v.hero_badge_bottom || null,
      trust_strip: (v.trust_strip ?? []).filter((x) => x && x.text?.trim()).length ? v.trust_strip : null,
      testimonials_kicker: v.testimonials_kicker || null,
      testimonials_title: v.testimonials_title || null,
      features_kicker: v.features_kicker || null,
      features_title: v.features_title || null,
      amrapali_kicker: v.amrapali_kicker || null,
      amrapali_title: v.amrapali_title || null,
      amrapali_points: (v.amrapali_points ?? []).filter((s) => s && s.trim()).length ? v.amrapali_points : null,
      promise_kicker: v.promise_kicker || null,
      promise_title: v.promise_title || null,
      promise_items: (v.promise_items ?? []).filter((s) => s && s.trim()).length ? v.promise_items : null,
      journey_kicker: v.journey_kicker || null,
      journey_title: v.journey_title || null,
      journey_steps: (v.journey_steps ?? []).filter((x) => x && (x.t?.trim() || x.n?.trim())).length ? v.journey_steps : null,
      stats_kicker: v.stats_kicker || null,
      stats_title: v.stats_title || null,
      stats_items: (v.stats_items ?? []).filter((x) => x && (x.n?.trim() || x.l?.trim())).length ? v.stats_items : null,
      faq_kicker: v.faq_kicker || null,
      faq_title: v.faq_title || null,
      final_cta_kicker: v.final_cta_kicker || null,
      final_cta_title: v.final_cta_title || null,
      final_cta_description: v.final_cta_description || null,
      quantity_note: v.quantity_note || null,
    };
    const persist = (data: Record<string, any>) =>
      v.id
        ? supabase.from("landing_pages" as any).update(data).eq("id", v.id)
        : supabase.from("landing_pages" as any).insert(data);
    const missingColumnName = (message?: string) =>
      message?.match(/Could not find the '([^']+)' column/)?.[1] ??
      message?.match(/column landing_pages\.([a-z_]+) does not exist/)?.[1] ??
      null;
    let res = await persist(payload);
    const skippedColumns = new Set<string>();
    while (res.error) {
      const missing = missingColumnName(res.error.message);
      if (!missing || skippedColumns.has(missing)) break;
      skippedColumns.add(missing);
      delete payload[missing];
      if (missing === "video_urls") {
        payload.video_url = joinedVideoUrls;
      }
      res = await persist(payload);
    }
    setSaving(false);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    if (v.slug) {
      await supabase
        .from("site_content" as any)
        .upsert(
          {
            key: `landing_whatsapp_${v.slug.trim()}`,
            value: (whatsappNumber ?? "").trim(),
          },
          { onConflict: "key" },
        );
      qc.invalidateQueries({ queryKey: ["site-content"] });
    }
    toast.success("Saved");
    onSaved();
  };

  const Label = ({ children }: { children: React.ReactNode }) => (
    <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1.5">
      {children}
    </label>
  );
  const inputCls =
    "w-full h-10 px-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const textCls =
    "w-full p-3 rounded-md border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto pb-48 md:pb-56">
      <button onClick={onClose} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to list
      </button>
      <h1 className="font-display text-2xl text-primary mb-6">
        {v.id ? "Edit Landing Page" : "New Landing Page"}
      </h1>

      <AccordionList storageKey="admin.landing.sectionOrder.v1">
        <SectionRow id="basics" title="Basics">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Slug (URL)</Label>
              <input
                className={inputCls}
                value={v.slug ?? ""}
                onChange={(e) => upd("slug", slugify(e.target.value))}
                placeholder="calligraphy-master-kit"
              />
              <p className="text-xs text-muted-foreground mt-1">/landing/{v.slug || "your-slug"}</p>
            </div>
            <div>
              <Label>Product</Label>
              <select
                className={inputCls}
                value={v.product_id ?? ""}
                onChange={(e) => upd("product_id", e.target.value || null)}
              >
                <option value="">— Select product —</option>
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm mt-4">
            <input
              type="checkbox"
              checked={v.is_active ?? true}
              onChange={(e) => upd("is_active", e.target.checked)}
            />
            Active (live on /landing/{v.slug || "…"})
          </label>
        </SectionRow>

        <SectionRow id="hero" title="Hero">
          <Label>Headline</Label>
          <input
            className={inputCls}
            value={v.hero_headline ?? ""}
            onChange={(e) => upd("hero_headline", e.target.value)}
            placeholder="ইসলামিক ক্যালিগ্রাফি মাস্টার কিট — প্রিমিয়াম আর্ট সামগ্রী"
          />
          <div className="mt-4">
            <Label>Sub-headline</Label>
            <textarea
              className={textCls}
              rows={2}
              value={v.hero_subheadline ?? ""}
              onChange={(e) => upd("hero_subheadline", e.target.value)}
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Offer badge</Label>
              <input
                className={inputCls}
                value={v.offer_text ?? ""}
                onChange={(e) => upd("offer_text", e.target.value)}
                placeholder="20% off — limited"
              />
            </div>
            <div>
              <Label>Urgency text</Label>
              <input
                className={inputCls}
                value={v.urgency_text ?? ""}
                onChange={(e) => upd("urgency_text", e.target.value)}
                placeholder="Only 50 boxes left"
              />
            </div>
          </div>
          <div className="mt-4">
            <Label>Quantity note (product name-er niche)</Label>
            <input
              className={inputCls}
              value={v.quantity_note ?? ""}
              onChange={(e) => upd("quantity_note", e.target.value)}
              placeholder="ফুল সেট: ক্যালিগ্রাফি কলম, বাঁশের কলম, স্পেশাল কালি ও পেপার"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Khali rakhle default text dekhabe.</p>
          </div>
          <div className="mt-4">
            <Label>Hero image</Label>
            {v.hero_image_url && (
              <img src={v.hero_image_url} alt="" className="w-48 aspect-video object-cover rounded-md mb-2 border" />
            )}
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
                className="hidden"
                id="hero-file"
              />
              <label
                htmlFor="hero-file"
                className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border text-sm cursor-pointer hover:bg-muted"
              >
                <Upload className="w-4 h-4" /> {uploading ? "Uploading…" : "Upload"}
              </label>
              {v.hero_image_url && (
                <button
                  onClick={() => upd("hero_image_url", null)}
                  className="text-sm text-destructive px-3"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </SectionRow>

        <SectionRow id="pricing" title="Pricing & Offer">
          <p className="text-xs text-muted-foreground mb-3">
            Product-এর মূল দাম থেকে কত টাকা / শতাংশ ছাড় দেখাবেন সেটা এখান থেকে নিয়ন্ত্রণ করুন। Discount Amount পূরণ করলে সেটা priority পাবে; না হলে Percent ব্যবহার হবে; দুটোই খালি থাকলে product-এর নিজস্ব discount দেখাবে।
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Discount amount (৳)</Label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={v.discount_amount ?? ""}
                onChange={(e) => upd("discount_amount", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="e.g. 310"
              />
            </div>
            <div>
              <Label>Discount percent (%)</Label>
              <input
                type="number"
                min={0}
                max={90}
                className={inputCls}
                value={v.discount_percent ?? ""}
                onChange={(e) => upd("discount_percent", e.target.value === "" ? null : Number(e.target.value))}
                placeholder="e.g. 15"
              />
            </div>
            <div>
              <Label>Free delivery badge</Label>
              <label className="inline-flex items-center gap-2 text-sm h-10">
                <input
                  type="checkbox"
                  checked={v.free_delivery ?? true}
                  onChange={(e) => upd("free_delivery", e.target.checked)}
                />
                Show "🚚 Free Delivery"
              </label>
            </div>
          </div>
        </SectionRow>

        <SectionRow id="features" title="Features (Why us)">
          <ListEditor<LandingFeature>
            items={v.features ?? []}
            onChange={(items) => upd("features", items)}
            empty={{ title: "", description: "" }}
            render={(item, on) => (
              <>
                <input
                  className={inputCls}
                  value={item.title}
                  onChange={(e) => on({ ...item, title: e.target.value })}
                  placeholder="Title"
                />
                <textarea
                  className={textCls + " mt-2"}
                  rows={2}
                  value={item.description ?? ""}
                  onChange={(e) => on({ ...item, description: e.target.value })}
                  placeholder="Description"
                />
              </>
            )}
          />
        </SectionRow>

        <SectionRow id="video" title="Video Section (replaces gallery)">
          <p className="text-xs text-muted-foreground mb-3">
            একাধিক YouTube video URL যোগ করতে পারবেন। Landing page-এ একটাই section হিসেবে দেখাবে, কিন্তু visitor slide করে সব ভিডিও দেখতে পারবে। নিচে dot indicator থাকবে।
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Label>YouTube video URLs</Label>
              <p className="text-[11px] text-muted-foreground mb-2">
                একাধিক ভিডিও যোগ করতে "+ Add" চাপুন। প্রথম ভিডিওটি SEO/share image হিসেবেও ব্যবহার হবে।
              </p>
              <StringListEditor
                items={parseVideoUrls(v.video_urls, v.video_url)}
                onChange={(list: string[]) => {
                  upd("video_urls", list.length ? list.join("\n") : null);
                  const firstNonEmpty = list.map((s) => s.trim()).find(Boolean);
                  upd("video_url", firstNonEmpty ?? null);
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                inputCls={inputCls}
              />
            </div>
            <div>
              <Label>Kicker label</Label>
              <input
                className={inputCls}
                value={v.video_label ?? ""}
                onChange={(e) => upd("video_label", e.target.value)}
                placeholder="🎨 আমাদের সামগ্রী"
              />
            </div>
            <div>
              <Label>Heading</Label>
              <input
                className={inputCls}
                value={v.video_heading ?? ""}
                onChange={(e) => upd("video_heading", e.target.value)}
                placeholder="আর্টিস্টদের প্রথম পছন্দ"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Description</Label>
              <textarea
                className={textCls}
                rows={2}
                value={v.video_description ?? ""}
                onChange={(e) => upd("video_description", e.target.value)}
                placeholder="দেখুন কীভাবে আমাদের প্রিমিয়াম আর্ট ও ক্যালিগ্রাফি সামগ্রী আপনার কাছে সুরক্ষিতভাবে পৌঁছায়।"
              />
            </div>
          </div>
        </SectionRow>

        <SectionRow id="reviews" title="Review Screenshots (carousel)">
          <p className="text-xs text-muted-foreground mb-3">
            Upload customer review screenshots. They'll show as a swipeable carousel on the landing page.
          </p>
          {(v.review_images ?? []).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-3">
              {(v.review_images ?? []).map((url, i) => (
                <div key={url + i} className="relative group border border-border rounded-md overflow-hidden bg-muted">
                  <img src={url} alt={`Review ${i + 1}`} className="w-full aspect-[3/4] object-cover" />
                  <button
                    type="button"
                    onClick={() =>
                      upd(
                        "review_images",
                        (v.review_images ?? []).filter((_, j) => j !== i),
                      )
                    }
                    className="absolute top-1 right-1 bg-background/90 text-destructive rounded-md p-1 opacity-0 group-hover:opacity-100 transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <input
            ref={reviewFileRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files?.length && onUploadReviewImages(e.target.files)}
            className="hidden"
            id="review-files"
          />
          <label
            htmlFor="review-files"
            className="inline-flex items-center gap-2 px-3 h-9 rounded-md border border-border text-sm cursor-pointer hover:bg-muted"
          >
            <Upload className="w-4 h-4" /> {uploadingReview ? "Uploading…" : "Upload review images"}
          </label>
        </SectionRow>

        <SectionRow id="faq" title="FAQ">
          <ListEditor<LandingFaq>
            items={v.faq ?? []}
            onChange={(items) => upd("faq", items)}
            empty={{ question: "", answer: "" }}
            render={(item, on) => (
              <>
                <input
                  className={inputCls}
                  value={item.question}
                  onChange={(e) => on({ ...item, question: e.target.value })}
                  placeholder="Question"
                />
                <textarea
                  className={textCls + " mt-2"}
                  rows={3}
                  value={item.answer}
                  onChange={(e) => on({ ...item, answer: e.target.value })}
                  placeholder="Answer"
                />
              </>
            )}
          />
        </SectionRow>

        <SectionRow id="cta" title="Call & WhatsApp Buttons (কল ও হোয়াটসঅ্যাপ)">
          <p className="text-xs text-muted-foreground mb-4">
            এখানে ল্যান্ডিং পেজের কল নম্বর এবং হোয়াটসঅ্যাপ নম্বর আলাদাভাবে সেট করতে পারেন। খালি রাখলে গ্লোবাল ডিফল্ট নম্বর ব্যবহৃত হবে।
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Button text (অর্ডার বোতাম)</Label>
              <input
                className={inputCls}
                value={v.cta_button_text ?? ""}
                onChange={(e) => upd("cta_button_text", e.target.value)}
                placeholder="অর্ডার করুন"
              />
            </div>
            <div>
              <Label>Call Phone (কল করার নম্বর)</Label>
              <input
                className={inputCls}
                value={v.cta_phone ?? ""}
                onChange={(e) => upd("cta_phone", e.target.value)}
                placeholder="01677-870998"
              />
              <span className="text-[11px] text-muted-foreground block mt-1">
                'ফোন করুন' বাটনে চাপ দিলে এই নম্বরে কল যাবে।
              </span>
            </div>
            <div>
              <Label>WhatsApp Number (হোয়াটসঅ্যাপ নম্বর)</Label>
              <input
                className={inputCls}
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="01677-870998 বা +8801677870998"
              />
              <span className="text-[11px] text-muted-foreground block mt-1">
                'WhatsApp এ অর্ডার করুন' বাটনে এই নম্বরে চ্যাট খুলবে।
              </span>
            </div>
          </div>
        </SectionRow>

        <SectionRow id="hero-extras" title="Hero — Bullets & Badges">
          <p className="text-xs text-muted-foreground mb-3">
            Leave empty to use the default 4 bullets and the "100% প্রাকৃতিক / কার্বাইডমুক্ত" badge.
          </p>
          <Label>Hero bullets (max 4 shown nicely)</Label>
          <StringListEditor
            items={v.hero_bullets ?? []}
            onChange={(items) => upd("hero_bullets", items)}
            placeholder="e.g. 100% কার্বাইডমুক্ত"
            inputCls={inputCls}
          />
          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <Label>Floating badge — top line</Label>
              <input className={inputCls} value={v.hero_badge_top ?? ""} onChange={(e) => upd("hero_badge_top", e.target.value)} placeholder="100% প্রাকৃতিক" />
            </div>
            <div>
              <Label>Floating badge — bottom line</Label>
              <input className={inputCls} value={v.hero_badge_bottom ?? ""} onChange={(e) => upd("hero_badge_bottom", e.target.value)} placeholder="কার্বাইডমুক্ত" />
            </div>
          </div>
        </SectionRow>

        <SectionRow id="trust-strip" title="Trust Strip (4 items on black bar)">
          <p className="text-xs text-muted-foreground mb-3">Leave empty for defaults. Icons cycle automatically (Leaf, Shield, Truck, Wallet).</p>
          <ListEditor<LandingTrustItem>
            items={v.trust_strip ?? []}
            onChange={(items) => upd("trust_strip", items)}
            empty={{ text: "" }}
            render={(item, on) => (
              <input className={inputCls} value={item.text} onChange={(e) => on({ ...item, text: e.target.value })} placeholder="e.g. ১০০% অথেনটিক" />
            )}
          />
        </SectionRow>

        <SectionRow id="section-headings" title="Section Headings (Kicker + Title)">
          <p className="text-xs text-muted-foreground mb-3">All optional — leave empty to keep current defaults.</p>
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Testimonials kicker</Label><input className={inputCls} value={v.testimonials_kicker ?? ""} onChange={(e) => upd("testimonials_kicker", e.target.value)} placeholder="❤️ গ্রাহকদের অভিজ্ঞতা" /></div>
            <div><Label>Testimonials title</Label><input className={inputCls} value={v.testimonials_title ?? ""} onChange={(e) => upd("testimonials_title", e.target.value)} placeholder="হাজারো পরিবারের ভালোবাসা" /></div>
            <div><Label>Features kicker</Label><input className={inputCls} value={v.features_kicker ?? ""} onChange={(e) => upd("features_kicker", e.target.value)} placeholder="⭐ কেন Ibn Mobarak Art Gallery?" /></div>
            <div><Label>Features title</Label><input className={inputCls} value={v.features_title ?? ""} onChange={(e) => upd("features_title", e.target.value)} placeholder="সেরা মানের ক্যালিগ্রাফি ও আর্ট সামগ্রী…" /></div>
            <div><Label>FAQ kicker</Label><input className={inputCls} value={v.faq_kicker ?? ""} onChange={(e) => upd("faq_kicker", e.target.value)} placeholder="❓ FAQ" /></div>
            <div><Label>FAQ title</Label><input className={inputCls} value={v.faq_title ?? ""} onChange={(e) => upd("faq_title", e.target.value)} placeholder="প্রায় জিজ্ঞাসিত প্রশ্ন" /></div>
          </div>
        </SectionRow>

        <SectionRow id="amrapali" title="Product Specialty (পণ্যের বিশেষত্ব)">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div><Label>Kicker</Label><input className={inputCls} value={v.amrapali_kicker ?? ""} onChange={(e) => upd("amrapali_kicker", e.target.value)} placeholder="🎨 পণ্যের বিশেষত্ব" /></div>
            <div><Label>Title</Label><input className={inputCls} value={v.amrapali_title ?? ""} onChange={(e) => upd("amrapali_title", e.target.value)} placeholder="কেন আমাদের ক্যালিগ্রাফি কিট সেরা?" /></div>
          </div>
          <Label>Points (one per row)</Label>
          <StringListEditor
            items={v.amrapali_points ?? []}
            onChange={(items) => upd("amrapali_points", items)}
            placeholder="e.g. প্রিমিয়াম হ্যান্ডমেড নিব ও খাঁটি কালি"
            inputCls={inputCls}
          />
        </SectionRow>

        <SectionRow id="promise" title="Our Promise (5 chips)">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div><Label>Kicker</Label><input className={inputCls} value={v.promise_kicker ?? ""} onChange={(e) => upd("promise_kicker", e.target.value)} placeholder="📦 আমাদের প্রতিশ্রুতি" /></div>
            <div><Label>Title</Label><input className={inputCls} value={v.promise_title ?? ""} onChange={(e) => upd("promise_title", e.target.value)} placeholder="প্রতিটি প্যাকেট মানে নির্ভরতা" /></div>
          </div>
          <Label>Promise items</Label>
          <StringListEditor
            items={v.promise_items ?? []}
            onChange={(items) => upd("promise_items", items)}
            placeholder="e.g. ১০০% অথেনটিক ব্র্যান্ড"
            inputCls={inputCls}
          />
        </SectionRow>

        <SectionRow id="journey" title="Journey (Steps with number + title + desc)">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div><Label>Kicker</Label><input className={inputCls} value={v.journey_kicker ?? ""} onChange={(e) => upd("journey_kicker", e.target.value)} placeholder="📦 অর্ডার থেকে ডেলিভারি" /></div>
            <div><Label>Title</Label><input className={inputCls} value={v.journey_title ?? ""} onChange={(e) => upd("journey_title", e.target.value)} placeholder="৪টি সহজ ধাপে আপনার ঘরে" /></div>
          </div>
          <ListEditor<LandingJourneyStep>
            items={v.journey_steps ?? []}
            onChange={(items) => upd("journey_steps", items)}
            empty={{ n: "", t: "", d: "" }}
            render={(item, on) => (
              <>
                <div className="grid grid-cols-[80px_1fr] gap-2">
                  <input className={inputCls} value={item.n} onChange={(e) => on({ ...item, n: e.target.value })} placeholder="১" />
                  <input className={inputCls} value={item.t} onChange={(e) => on({ ...item, t: e.target.value })} placeholder="Step title" />
                </div>
                <textarea className={textCls + " mt-2"} rows={2} value={item.d ?? ""} onChange={(e) => on({ ...item, d: e.target.value })} placeholder="Step description" />
              </>
            )}
          />
        </SectionRow>

        <SectionRow id="stats" title="Stats (3 numbers)">
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div><Label>Kicker</Label><input className={inputCls} value={v.stats_kicker ?? ""} onChange={(e) => upd("stats_kicker", e.target.value)} placeholder="📊 Ibn Mobarak Art Gallery" /></div>
            <div><Label>Title</Label><input className={inputCls} value={v.stats_title ?? ""} onChange={(e) => upd("stats_title", e.target.value)} placeholder="সংখ্যাই বলে কাহিনী" /></div>
          </div>
          <ListEditor<LandingStatItem>
            items={v.stats_items ?? []}
            onChange={(items) => upd("stats_items", items)}
            empty={{ n: "", l: "" }}
            render={(item, on) => (
              <div className="grid grid-cols-2 gap-2">
                <input className={inputCls} value={item.n} onChange={(e) => on({ ...item, n: e.target.value })} placeholder="১০,০০০+" />
                <input className={inputCls} value={item.l} onChange={(e) => on({ ...item, l: e.target.value })} placeholder="সন্তুষ্ট গ্রাহক" />
              </div>
            )}
          />
        </SectionRow>

        <SectionRow id="final-cta" title="Final CTA Block (above order form)">
          <div className="grid md:grid-cols-2 gap-4">
            <div><Label>Kicker</Label><input className={inputCls} value={v.final_cta_kicker ?? ""} onChange={(e) => upd("final_cta_kicker", e.target.value)} placeholder="🚚 এখনই অর্ডার করুন" /></div>
            <div><Label>Title</Label><input className={inputCls} value={v.final_cta_title ?? ""} onChange={(e) => upd("final_cta_title", e.target.value)} placeholder="আজকের সংগ্রহ সীমিত" /></div>
          </div>
          <div className="mt-4">
            <Label>Description</Label>
            <textarea className={textCls} rows={2} value={v.final_cta_description ?? ""} onChange={(e) => upd("final_cta_description", e.target.value)} placeholder="আপনার সৃজনশীল শিল্পচর্চায় সেরা উপাদান নিশ্চিত করতে আজই অর্ডার করুন…" />
          </div>
        </SectionRow>


        <SectionRow id="seo" title="SEO & Tracking">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>SEO title</Label>
              <input
                className={inputCls}
                value={v.seo_title ?? ""}
                onChange={(e) => upd("seo_title", e.target.value)}
              />
            </div>
            <div>
              <Label>Meta Pixel ID</Label>
              <input
                className={inputCls}
                value={v.meta_pixel_id ?? ""}
                onChange={(e) => upd("meta_pixel_id", e.target.value)}
              />
            </div>
          </div>
          <div className="mt-4">
            <Label>SEO description</Label>
            <textarea
              className={textCls}
              rows={2}
              value={v.seo_description ?? ""}
              onChange={(e) => upd("seo_description", e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Label>Open Graph image URL (share preview)</Label>
            <input
              className={inputCls}
              value={v.og_image_url ?? ""}
              onChange={(e) => upd("og_image_url", e.target.value)}
              placeholder="Defaults to hero image"
            />
          </div>
        </SectionRow>

        <SectionRow id="global-texts" title="Landing Page Texts (shared by all landing pages)">
          <p className="text-xs text-muted-foreground mb-4">
            Eta global setting — sob landing page e ekoi text dekhabe. Khali rakhle default text dekhabe.
          </p>
          <div className="p-4 rounded-xl bg-secondary/30 border border-border space-y-3 mb-5">
            <h3 className="font-display text-base">Default Call & WhatsApp (সকল ল্যান্ডিং পেজের ডিফল্ট নম্বর)</h3>
            <p className="text-xs text-muted-foreground">
              কোনো ল্যান্ডিং পেজে নির্দিষ্ট নম্বর দেওয়া না থাকলে এই ডিফল্ট নম্বরগুলোতে কল ও হোয়াটসঅ্যাপ যাবে।
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Default Call Number (ডিফল্ট কল নম্বর)</Label>
                <input
                  className={inputCls}
                  value={globalTexts.landing_default_phone ?? ""}
                  onChange={(e) => updGlobal("landing_default_phone", e.target.value)}
                  placeholder="01677-870998"
                />
              </div>
              <div>
                <Label>Default WhatsApp Number (ডিফল্ট হোয়াটসঅ্যাপ নম্বর)</Label>
                <input
                  className={inputCls}
                  value={globalTexts.landing_default_whatsapp ?? ""}
                  onChange={(e) => updGlobal("landing_default_whatsapp", e.target.value)}
                  placeholder="01677-870998 বা +8801677870998"
                />
              </div>
            </div>
          </div>
          <div>
            <Label>Security note (order button er niche)</Label>
            <textarea
              className={textCls}
              rows={2}
              maxLength={300}
              value={globalTexts.landing_security_note}
              onChange={(e) => updGlobal("landing_security_note", e.target.value)}
              placeholder="🔒 আপনার তথ্য সম্পূর্ণ নিরাপদ। অগ্রিম কোনো পেমেন্ট দিতে হবে না।"
            />
          </div>

          <div className="mt-5 pt-5 border-t border-border space-y-4">
            <h3 className="font-display text-base">"Visit Main Site" Card</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Eyebrow</Label>
                <input
                  className={inputCls}
                  value={globalTexts.landing_visit_eyebrow}
                  onChange={(e) => updGlobal("landing_visit_eyebrow", e.target.value)}
                  placeholder="Explore More"
                />
              </div>
              <div>
                <Label>Button text</Label>
                <input
                  className={inputCls}
                  value={globalTexts.landing_visit_button}
                  onChange={(e) => updGlobal("landing_visit_button", e.target.value)}
                  placeholder="মেইন সাইটে যান"
                />
              </div>
            </div>
            <div>
              <Label>Headline</Label>
              <input
                className={inputCls}
                value={globalTexts.landing_visit_headline}
                onChange={(e) => updGlobal("landing_visit_headline", e.target.value)}
                placeholder="আমাদের মেইন সাইট থেকে ঘুরে আসুন"
              />
            </div>
            <div>
              <Label>Description</Label>
              <textarea
                className={textCls}
                rows={2}
                maxLength={300}
                value={globalTexts.landing_visit_description}
                onChange={(e) => updGlobal("landing_visit_description", e.target.value)}
                placeholder="আরো অনেক ফ্রেশ পণ্য…"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={saveGlobalTexts}
              disabled={savingGlobal}
              className="px-4 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {savingGlobal ? "Saving…" : "Save landing texts"}
            </button>
          </div>
        </SectionRow>

        <SectionRow id="form-labels" title="Shipping Form Labels (shared by all landing pages)">
          <p className="text-xs text-muted-foreground mb-4">
            Order form er label / button text. Khali rakhle default text dekhabe.
          </p>
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              ["landing_form_legend", "Form legend", "Shipping Details"],
              ["landing_form_label_name", "Name label", "Full name"],
              ["landing_form_label_phone", "Phone label", "Phone"],
              ["landing_form_label_address", "Address label", "Address"],
              ["landing_form_label_notes", "Notes label", "Notes"],
              ["landing_form_summary_delivery", "Summary: Delivery label", "Delivery"],
              ["landing_form_summary_delivery_value", "Summary: Delivery value", "Free"],
              ["landing_form_summary_savings", "Summary: Savings label", "🔥 Savings"],
              ["landing_form_summary_total", "Summary: Total label", "Total"],
              ["landing_form_cta_fallback", "Default CTA button text", "Place Order (Cash on Delivery)"],
            ] as Array<[GlobalTextKey, string, string]>).map(([k, label, ph]) => (
              <div key={k}>
                <Label>{label}</Label>
                <input
                  className={inputCls}
                  value={globalTexts[k] ?? ""}
                  onChange={(e) => updGlobal(k, e.target.value)}
                  placeholder={ph}
                />
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={saveGlobalTexts}
              disabled={savingGlobal}
              className="px-4 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
            >
              {savingGlobal ? "Saving…" : "Save form labels"}
            </button>
          </div>
        </SectionRow>
      </AccordionList>


      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-background border-t border-border p-3 flex justify-end gap-2 z-20">
        <button onClick={onClose} className="px-4 h-10 rounded-md border border-border text-sm">
          Cancel
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="px-5 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}


function ListEditor<T>({
  items,
  onChange,
  empty,
  render,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  empty: T;
  render: (item: T, on: (next: T) => void) => React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="border border-border rounded-md p-3 relative">
          {render(item, (next) => {
            const copy = items.slice();
            copy[i] = next;
            onChange(copy);
          })}
          <button
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="absolute top-2 right-2 text-destructive p-1"
            aria-label="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        onClick={() => onChange([...items, { ...empty }])}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <Plus className="w-4 h-4" /> Add
      </button>
    </div>
  );
}

function StringListEditor({
  items,
  onChange,
  placeholder,
  inputCls,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  inputCls: string;
}) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input
            className={inputCls}
            value={item}
            onChange={(e) => {
              const copy = items.slice();
              copy[i] = e.target.value;
              onChange(copy);
            }}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, j) => j !== i))}
            className="px-2 text-destructive"
            aria-label="Remove"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
      >
        <Plus className="w-4 h-4" /> Add
      </button>
    </div>
  );
}
