import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useMemo } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Upload, X, Copy, Star, ArrowUp, ArrowDown, GripVertical, Search, Filter, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/external";
import { formatBDT } from "@/lib/cart";
import { Spinner } from "@/components/site/Spinner";
import { SIZES, isSizeLabel, parseSizes, sizeSummary, totalSizeStock, type ProductVariant } from "@/lib/sizes";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export const Route = createFileRoute("/admin/products")({
  component: AdminProducts,
});

const LEVELS = ["A", "B", "C", "D", "E", "F"] as const;
type Level = (typeof LEVELS)[number];

type SizeRow = ProductVariant;

type Product = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  unit: string;
  image_url: string | null;
  images: string[];
  featured: boolean;
  product_level: Level;
  sizes: SizeRow[];
  discount_amount: number;
};

const empty: Product = {
  name: "", slug: "", description: "", price: 0, stock: 0,
  category: "", unit: "pcs", image_url: null, images: [], featured: false,
  product_level: "F", sizes: [], discount_amount: 0,
};

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const getProductStock = (p: any): number => {
  if (!p) return 0;
  const sizes = parseSizes(p.weight_variants);
  if (sizes.length > 0) return totalSizeStock(sizes);
  return Number(p.stock) || 0;
};

function AdminProducts() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: products, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { count, error: countErr } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true });

      if (countErr) throw countErr;
      const total = count || 0;
      const BATCH_SIZE = 1000;
      const promises = [];

      for (let from = 0; from < total; from += BATCH_SIZE) {
        promises.push(
          supabase
            .from("products")
            .select("*")
            .order("product_level", { ascending: true })
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false })
            .range(from, from + BATCH_SIZE - 1)
        );
      }

      const results = await Promise.all(promises);
      return results.flatMap((r) => r.data ?? []);
    },
  });

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStock, setSelectedStock] = useState<"all" | "in" | "low" | "out">("all");
  const [selectedLevel, setSelectedLevel] = useState<"all" | Level>("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    (products ?? []).forEach((p: any) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  const stats = useMemo(() => {
    let inStock = 0;
    let lowStock = 0;
    let outStock = 0;
    let featured = 0;
    (products ?? []).forEach((p: any) => {
      const s = getProductStock(p);
      if (s <= 0) outStock++;
      else if (s < 5) lowStock++;
      else inStock++;
      if (p.featured) featured++;
    });
    return { total: products?.length ?? 0, inStock, lowStock, outStock, featured };
  }, [products]);

  const isFiltered = Boolean(search.trim() || selectedCategory !== "all" || selectedStock !== "all" || selectedLevel !== "all");

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products ?? []).filter((p: any) => {
      if (selectedLevel !== "all" && p.product_level !== selectedLevel) return false;
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      if (selectedStock !== "all") {
        const s = getProductStock(p);
        if (selectedStock === "in" && s < 5) return false;
        if (selectedStock === "low" && (s <= 0 || s >= 5)) return false;
        if (selectedStock === "out" && s > 0) return false;
      }
      if (q) {
        const matchName = p.name?.toLowerCase().includes(q);
        const matchSlug = p.slug?.toLowerCase().includes(q);
        const matchId = p.id?.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchId) return false;
      }
      return true;
    });
  }, [products, search, selectedCategory, selectedStock, selectedLevel]);

  const grouped = useMemo(() => {
    const map: Record<Level, any[]> = { A: [], B: [], C: [], D: [], E: [], F: [] };
    filteredProducts.forEach((p: any) => {
      const lvl = (LEVELS as readonly string[]).includes(p.product_level) ? (p.product_level as Level) : "F";
      map[lvl].push(p);
    });
    return map;
  }, [filteredProducts]);

  const save = async () => {
    if (!editing || saving) return;
    const slug = editing.slug || slugify(editing.name);
    if (!editing.name || !slug || editing.price <= 0) {
      toast.error("Name, slug, and price are required");
      return;
    }
    setSaving(true);
    try {
      const images = editing.images.filter(Boolean);
      const primary = images[0] ?? editing.image_url ?? null;
      const sizes = (editing.sizes ?? [])
        .filter((s) => isSizeLabel(s.label))
        .map((s) => ({
          label: s.label.toUpperCase(),
          price: editing.price,
          stock: Math.max(0, Math.floor(Number(s.stock) || 0)),
        }));
      const discount = Math.max(0, Math.floor(Number(editing.discount_amount) || 0));
      if (discount > 0 && discount >= editing.price) {
        toast.error("Discount price er cheye kom hote hobe");
        setSaving(false);
        return;
      }
      const payload: any = {
        name: editing.name,
        slug,
        description: editing.description || null,
        price: editing.price,
        stock: sizes.length > 0 ? totalSizeStock(sizes) : editing.stock,
        category: editing.category || null,
        unit: editing.unit || "pcs",
        image_url: primary,
        images,
        featured: editing.featured,
        product_level: editing.product_level || "F",
        weight_variants: sizes,
        discount_amount: discount,
      };
      const { error } = editing.id
        ? await supabase.from("products").update(payload).eq("id", editing.id)
        : await supabase.from("products").insert(payload);

      if (error) return toast.error(error.message);
      toast.success(editing.id ? "Product updated" : "Product created");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["featured-products"] });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const duplicate = async (p: any) => {
    const baseSlug = `${p.slug}-copy`;
    let newSlug = baseSlug;
    let i = 2;
    while (true) {
      const { data: existing } = await supabase.from("products").select("id").eq("slug", newSlug).maybeSingle();
      if (!existing) break;
      newSlug = `${baseSlug}-${i++}`;
    }
    const payload = {
      name: `${p.name} (Copy)`,
      slug: newSlug,
      description: p.description,
      price: p.price,
      stock: p.stock,
      category: p.category,
      unit: p.unit ?? "kg",
      image_url: p.image_url,
      images: Array.isArray(p.images) ? p.images : (p.image_url ? [p.image_url] : []),
      featured: false,
      product_level: p.product_level ?? "F",
      weight_variants: Array.isArray(p.weight_variants) ? p.weight_variants : [],
    };
    const { error } = await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Product duplicated");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    qc.invalidateQueries({ queryKey: ["featured-products"] });
  };

  const onUpload = async (files: FileList) => {
    if (!editing) return;
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("products").upload(path, file, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("products").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    if (uploaded.length) {
      const next = [...editing.images, ...uploaded];
      setEditing({ ...editing, images: next, image_url: next[0] });
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const setPrimary = (idx: number) => {
    if (!editing) return;
    const next = [...editing.images];
    const [pick] = next.splice(idx, 1);
    next.unshift(pick);
    setEditing({ ...editing, images: next, image_url: next[0] });
  };

  const moveImg = (idx: number, dir: -1 | 1) => {
    if (!editing) return;
    const next = [...editing.images];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setEditing({ ...editing, images: next, image_url: next[0] });
  };

  const removeImg = (idx: number) => {
    if (!editing) return;
    const next = editing.images.filter((_, i) => i !== idx);
    setEditing({ ...editing, images: next, image_url: next[0] ?? null });
  };

  const persistOrder = async (level: Level, ordered: any[]) => {
    // Optimistic update
    qc.setQueryData(["admin-products"], (prev: any) => {
      if (!prev) return prev;
      const others = prev.filter((p: any) => (p.product_level ?? "F") !== level);
      const updated = ordered.map((p, i) => ({ ...p, sort_order: i }));
      return [...others, ...updated].sort((a, b) => {
        const la = a.product_level ?? "F";
        const lb = b.product_level ?? "F";
        if (la !== lb) return la < lb ? -1 : 1;
        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
      });
    });
    // Persist in parallel
    const updates = ordered.map((p, i) =>
      supabase.from("products").update({ sort_order: i }).eq("id", p.id),
    );
    const results = await Promise.all(updates);
    const firstErr = results.find((r) => r.error)?.error;
    if (firstErr) {
      toast.error(firstErr.message);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    } else {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["featured-products"] });
    }
  };

  return (
    <div className="p-5 md:p-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl">Products Catalog</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            মোট ৩,৯০০+ আর্ট পণ্যের ক্যাটালগ ও স্টক ব্যবস্থাপনা
          </p>
        </div>
        <button
          onClick={() => setEditing({ ...empty })}
          className="self-start sm:self-auto inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium shadow-xs hover:bg-primary/90 transition"
        >
          <Plus className="w-4 h-4" /> New product
        </button>
      </div>

      {/* Quick Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setSelectedStock("all")}
          className={`text-left bg-card border rounded-2xl p-4 transition cursor-pointer hover:border-foreground/30 ${
            selectedStock === "all" ? "border-foreground/40 ring-1 ring-foreground/20" : "border-border/80"
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Products</span>
          <p className="text-2xl font-bold font-display text-foreground mt-1">{stats.total}</p>
        </button>
        <button
          type="button"
          onClick={() => setSelectedStock(selectedStock === "in" ? "all" : "in")}
          className={`text-left bg-card border rounded-2xl p-4 transition cursor-pointer hover:border-emerald-500/50 ${
            selectedStock === "in" ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/5" : "border-border/80"
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">In Stock (৫+)</span>
          <p className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">{stats.inStock}</p>
        </button>
        <button
          type="button"
          onClick={() => setSelectedStock(selectedStock === "low" ? "all" : "low")}
          className={`text-left bg-card border rounded-2xl p-4 transition cursor-pointer hover:border-amber-500/50 ${
            selectedStock === "low" ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5" : "border-border/80"
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold">Low Stock (&lt; ৫টি)</span>
          <p className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400 mt-1">{stats.lowStock}</p>
        </button>
        <button
          type="button"
          onClick={() => setSelectedStock(selectedStock === "out" ? "all" : "out")}
          className={`text-left bg-card border rounded-2xl p-4 transition cursor-pointer hover:border-rose-500/50 ${
            selectedStock === "out" ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-500/5" : "border-border/80"
          }`}
        >
          <span className="text-[11px] uppercase tracking-wider text-rose-600 dark:text-rose-400 font-semibold">Out of Stock</span>
          <p className="text-2xl font-bold font-display text-rose-600 dark:text-rose-400 mt-1">{stats.outStock}</p>
        </button>
        <div className="bg-card border border-border/80 rounded-2xl p-4">
          <span className="text-[11px] uppercase tracking-wider text-purple-600 dark:text-purple-400 font-semibold">Featured</span>
          <p className="text-2xl font-bold font-display text-purple-600 dark:text-purple-400 mt-1">{stats.featured}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="পণ্য, স্লাগ বা আইডি খুঁজুন..."
              className="w-full bg-background border border-border pl-10 pr-8 py-2 text-xs sm:text-sm rounded-xl outline-none focus:border-gold"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-background border border-border px-3 py-2 text-xs sm:text-sm rounded-xl outline-none focus:border-gold"
            >
              <option value="all">সকল ক্যাটাগরি ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Stock Filter */}
          <div>
            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value as any)}
              className="w-full bg-background border border-border px-3 py-2 text-xs sm:text-sm rounded-xl outline-none focus:border-gold"
            >
              <option value="all">সব স্টক স্ট্যাটাস</option>
              <option value="in">ইন-স্টক (৫+) ({stats.inStock})</option>
              <option value="low">লো স্টক (&lt; ৫টি) ({stats.lowStock})</option>
              <option value="out">আউট অব স্টক ({stats.outStock})</option>
            </select>
          </div>

          {/* Level Filter */}
          <div>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as any)}
              className="w-full bg-background border border-border px-3 py-2 text-xs sm:text-sm rounded-xl outline-none focus:border-gold"
            >
              <option value="all">সব লেভেল (A - F)</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>Level {l}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Indicator & Reset */}
        {isFiltered && (
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <span className="text-muted-foreground">
              ফিল্টার অনুসারে মোট <strong className="text-foreground">{filteredProducts.length}টি</strong> পণ্য পাওয়া গেছে
            </span>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setSelectedStock("all");
                setSelectedLevel("all");
              }}
              className="inline-flex items-center gap-1 text-gold hover:text-primary transition font-medium"
            >
              <RotateCcw className="w-3 h-3" /> সব ফিল্টার রিসেট
            </button>
          </div>
        )}
      </div>

      {isLoading && <div className="p-8 text-center text-muted-foreground">Loading…</div>}
      {!isLoading && (products?.length ?? 0) === 0 && (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl">No products yet</div>
      )}
      {!isLoading && (products?.length ?? 0) > 0 && filteredProducts.length === 0 && (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-2xl">
          ফিল্টারের সাথে কোনো পণ্য মেলেনি।
        </div>
      )}

      <div className="space-y-6">
        {LEVELS.map((level) => {
          const items = grouped[level];
          if (!items || items.length === 0) return null;
          return (
            <LevelSection
              key={level}
              level={level}
              items={items}
              isFiltered={isFiltered}
              onEdit={(p) => setEditing({
                id: p.id, name: p.name, slug: p.slug, description: p.description ?? "",
                price: Number(p.price), stock: p.stock, category: p.category ?? "",
                unit: p.unit ?? "pcs", image_url: p.image_url,
                images: Array.isArray(p.images) && p.images.length ? p.images : (p.image_url ? [p.image_url] : []),
                featured: p.featured,
                product_level: (LEVELS as readonly string[]).includes(p.product_level) ? (p.product_level as Level) : "F",
                sizes: parseSizes(p.weight_variants),
                discount_amount: Number(p.discount_amount) || 0,
              })}
              onDuplicate={duplicate}
              onDelete={remove}
              onReorder={(ordered) => persistOrder(level, ordered)}
            />
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-card rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-auto p-5 sm:p-8 border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display text-xl sm:text-2xl">{editing.id ? "Edit product" : "New product"}</h2>
              <button onClick={() => setEditing(null)} className="p-2 -mr-2 hover:bg-muted rounded-full"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v, slug: editing.slug || slugify(v) })} />
              <Input label="Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: slugify(v) })} />
              <Input label="Category" value={editing.category} onChange={(v) => setEditing({ ...editing, category: v })} />
              <Input label="Unit" value={editing.unit} onChange={(v) => setEditing({ ...editing, unit: v })} />
              <Input label="Price (BDT)" type="number" value={String(editing.price)} onChange={(v) => setEditing({ ...editing, price: Number(v) })} />
              {editing.sizes.length > 0 ? (
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Stock (auto)</label>
                  <div className="w-full px-4 py-3 rounded-xl border border-input bg-muted/40 text-muted-foreground">
                    {totalSizeStock(editing.sizes)} pcs · size onujayi hishab
                  </div>
                </div>
              ) : (
                <Input label="Stock" type="number" value={String(editing.stock)} onChange={(v) => setEditing({ ...editing, stock: Number(v) })} />
              )}

              <div>
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Priority level</label>
                <select
                  value={editing.product_level}
                  onChange={(e) => setEditing({ ...editing, product_level: e.target.value as Level })}
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background"
                >
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>
                      {l}{l === "A" ? " — highest" : l === "F" ? " — lowest (default)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Description</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  rows={3} className="w-full px-4 py-3 rounded-xl border border-input bg-background" />
              </div>

              {/* Images */}
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground">
                    Images {editing.images.length > 0 && <span className="normal-case tracking-normal text-foreground/60">· first one is the hero image</span>}
                  </label>
                  <input ref={fileRef} type="file" accept="image/*" multiple hidden
                    onChange={(e) => e.target.files && e.target.files.length && onUpload(e.target.files)} />
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                    className="inline-flex items-center gap-2 border border-border px-3 py-1.5 rounded-full text-xs hover:bg-muted disabled:opacity-60">
                    <Upload className="w-3.5 h-3.5" /> {uploading ? "Uploading…" : "Upload"}
                  </button>
                </div>

                {editing.images.length === 0 ? (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full aspect-[3/2] sm:aspect-[5/2] rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm transition-colors">
                    <Upload className="w-6 h-6" />
                    Tap to upload product images
                    <span className="text-xs">PNG, JPG, WEBP · multiple allowed</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {editing.images.map((url, idx) => {
                      const isPrimary = idx === 0;
                      return (
                        <div key={url + idx} className={`relative group rounded-xl overflow-hidden border bg-muted ${isPrimary ? "border-primary ring-2 ring-primary/30" : "border-border"}`}>
                          <div className="aspect-square">
                            <img src={url} alt="" className="w-full h-full object-cover" />
                          </div>
                          {isPrimary && (
                            <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full font-medium shadow-sm">
                              <Star className="w-3 h-3 fill-current" /> Primary
                            </span>
                          )}
                          <button type="button" onClick={() => removeImg(idx)} title="Remove"
                            className="absolute top-1.5 right-1.5 bg-background/90 hover:bg-destructive hover:text-destructive-foreground rounded-full p-1 shadow-sm transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-foreground/70 to-transparent p-1.5 flex items-center justify-between gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {!isPrimary ? (
                              <button type="button" onClick={() => setPrimary(idx)}
                                className="text-[10px] uppercase tracking-wider bg-background/90 hover:bg-background text-foreground px-2 py-1 rounded-full">
                                Set primary
                              </button>
                            ) : <span />}
                            <div className="flex gap-1">
                              <button type="button" onClick={() => moveImg(idx, -1)} disabled={idx === 0}
                                className="bg-background/90 hover:bg-background text-foreground rounded-full p-1 disabled:opacity-40">
                                <ArrowUp className="w-3 h-3" />
                              </button>
                              <button type="button" onClick={() => moveImg(idx, 1)} disabled={idx === editing.images.length - 1}
                                className="bg-background/90 hover:bg-background text-foreground rounded-full p-1 disabled:opacity-40">
                                <ArrowDown className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Product Variants / Variables */}
              <div className="sm:col-span-2 rounded-2xl border border-border bg-muted/20 p-4">
                <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                  <div>
                    <label className="block text-xs uppercase tracking-widest font-bold text-foreground">
                      Product Variants / Variables (ভ্যারিয়েন্ট)
                    </label>
                    <p className="text-[11px] text-muted-foreground">
                      প্রোডাক্টের বিভিন্ন সাইজ (A3, A4, 8x8), কালার বা ভলিউম আলাদা দাম ও স্টক সহ যুক্ত করুন
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Total Stock: <strong className="text-foreground">{totalSizeStock(editing.sizes)} pcs</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newVariant = {
                          label: "",
                          attribute: editing.sizes[0]?.attribute || "Size",
                          price: editing.price,
                          stock: 10,
                        };
                        setEditing({ ...editing, sizes: [...editing.sizes, newVariant] });
                      }}
                      className="inline-flex items-center gap-1 bg-primary text-primary-foreground text-xs px-3 py-1.5 rounded-lg hover:bg-primary/90 transition shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Variant
                    </button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3 text-[11px]">
                  <span className="text-muted-foreground">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        { label: "A3", attribute: "Pad Size", price: editing.price, stock: 20 },
                        { label: "A4", attribute: "Pad Size", price: Math.round(editing.price * 0.67), stock: 25 },
                        { label: "A5", attribute: "Pad Size", price: Math.round(editing.price * 0.35), stock: 30 },
                      ];
                      setEditing({ ...editing, sizes: presets });
                    }}
                    className="px-2 py-0.5 rounded bg-background border border-border hover:border-gold hover:text-primary transition"
                  >
                    + Pad Sizes (A3, A4, A5)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        { label: "8x8 inch", attribute: "Size", price: editing.price, stock: 20 },
                        { label: "10x10 inch", attribute: "Size", price: Math.round(editing.price * 1.3), stock: 20 },
                        { label: "12x12 inch", attribute: "Size", price: Math.round(editing.price * 1.6), stock: 15 },
                      ];
                      setEditing({ ...editing, sizes: presets });
                    }}
                    className="px-2 py-0.5 rounded bg-background border border-border hover:border-gold hover:text-primary transition"
                  >
                    + Canvas (8x8, 10x10, 12x12)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const presets = [
                        { label: "Golden", attribute: "Colour", price: editing.price, stock: 50 },
                        { label: "Silver", attribute: "Colour", price: editing.price, stock: 50 },
                      ];
                      setEditing({ ...editing, sizes: presets });
                    }}
                    className="px-2 py-0.5 rounded bg-background border border-border hover:border-gold hover:text-primary transition"
                  >
                    + Colours (Golden, Silver)
                  </button>
                  {editing.sizes.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, sizes: [] })}
                      className="px-2 py-0.5 rounded text-destructive hover:underline ml-auto"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {editing.sizes.length === 0 ? (
                  <div className="text-center py-4 text-xs text-muted-foreground border border-dashed rounded-xl bg-background/50">
                    কোনো ভ্যারিয়েন্ট নেই। সাধারণ প্রোডাক্ট হিসেবে উপরের Stock ({editing.stock} pcs) ও Price (৳{editing.price}) প্রযোজ্য হবে।
                  </div>
                ) : (
                  <div className="space-y-2 overflow-x-auto">
                    <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_88px_70px_28px] gap-2 text-[10px] uppercase font-bold text-muted-foreground px-2 items-center min-w-[480px]">
                      <span className="truncate">Attribute</span>
                      <span className="truncate">Option Label</span>
                      <span className="truncate text-right pr-1">Price (৳)</span>
                      <span className="truncate text-center">Stock (pcs)</span>
                      <span></span>
                    </div>
                    {editing.sizes.map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1.5fr)_88px_70px_28px] gap-2 items-center bg-background border border-border p-2 rounded-xl min-w-[480px]"
                      >
                        <input
                          type="text"
                          placeholder="e.g. Pad Size"
                          value={row.attribute || ""}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditing({
                              ...editing,
                              sizes: editing.sizes.map((s, i) => (i === idx ? { ...s, attribute: val } : s)),
                            });
                          }}
                          className="w-full min-w-0 px-2.5 py-1.5 rounded-lg border border-input text-xs bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="text"
                          placeholder="e.g. A3 or 100ml"
                          value={row.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditing({
                              ...editing,
                              sizes: editing.sizes.map((s, i) => (i === idx ? { ...s, label: val } : s)),
                            });
                          }}
                          className="w-full min-w-0 px-2.5 py-1.5 rounded-lg border border-input text-xs font-semibold bg-card focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="৳"
                          value={row.price || ""}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setEditing({
                              ...editing,
                              sizes: editing.sizes.map((s, i) => (i === idx ? { ...s, price: val } : s)),
                            });
                          }}
                          className="w-full min-w-0 px-2 py-1.5 rounded-lg border border-input text-xs bg-card text-right font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <input
                          type="number"
                          min={0}
                          placeholder="pcs"
                          value={row.stock != null ? row.stock : ""}
                          onChange={(e) => {
                            const val = Math.max(0, Math.floor(Number(e.target.value) || 0));
                            setEditing({
                              ...editing,
                              sizes: editing.sizes.map((s, i) => (i === idx ? { ...s, stock: val } : s)),
                            });
                          }}
                          className="w-full min-w-0 px-2 py-1.5 rounded-lg border border-input text-xs bg-card text-center font-medium [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditing({
                              ...editing,
                              sizes: editing.sizes.filter((_, i) => i !== idx),
                            });
                          }}
                          className="w-7 h-7 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition shrink-0"
                          title="Delete variant"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>


              {/* Discount */}
              <div className="sm:col-span-2">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Discount (৳)  <span className="normal-case tracking-normal text-foreground/60">· optional, taka amount</span>
                </label>
                <input
                  type="number"
                  min={0}
                  value={editing.discount_amount || ""}
                  onChange={(e) => {
                    const n = Math.max(0, Math.floor(Number(e.target.value) || 0));
                    setEditing({ ...editing, discount_amount: n });
                  }}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl border border-input bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {(editing.discount_amount || 0) > 0 && editing.price > 0 ? (
                  (editing.discount_amount >= editing.price ? (
                    <p className="text-xs text-destructive mt-1.5">Discount price er cheye kom hote hobe.</p>
                  ) : (
                    <p className="text-xs text-primary mt-1.5">
                      Discounted price: {formatBDT(editing.price - editing.discount_amount)} (original {formatBDT(editing.price)}, -{Math.round((editing.discount_amount / editing.price) * 100)}%)
                    </p>
                  ))
                ) : null}
              </div>



              <label className="flex items-center gap-2 sm:col-span-2 cursor-pointer">
                <input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} />
                <span className="text-sm">Featured on homepage</span>
              </label>
            </div>

            <div className="sticky bottom-0 -mx-5 sm:-mx-8 -mb-5 sm:-mb-8 mt-8 px-5 sm:px-8 py-4 bg-card border-t border-border flex justify-end gap-3">
              <button onClick={() => setEditing(null)} disabled={saving} className="px-5 py-2.5 rounded-full border border-border disabled:opacity-50">Cancel</button>
              <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground disabled:opacity-50 transition">
                {saving && <Spinner className="w-4 h-4" />}
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LevelSection({
  level, items, onEdit, onDuplicate, onDelete, onReorder, isFiltered = false,
}: {
  level: Level;
  items: any[];
  onEdit: (p: any) => void;
  onDuplicate: (p: any) => void;
  onDelete: (id: string) => void;
  onReorder: (ordered: any[]) => void;
  isFiltered?: boolean;
}) {
  const [displayLimit, setDisplayLimit] = useState(30);
  const visibleItems = useMemo(() => items.slice(0, displayLimit), [items, displayLimit]);
  const ids = visibleItems.map((p) => p.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (e: DragEndEvent) => {
    if (isFiltered) return;
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIdx = items.findIndex((p) => p.id === active.id);
    const newIdx = items.findIndex((p) => p.id === over.id);
    if (oldIdx < 0 || newIdx < 0) return;
    onReorder(arrayMove(items, oldIdx, newIdx));
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-bold">{level}</span>
          <span className="text-sm font-medium">Level {level}</span>
          <span className="text-xs text-muted-foreground">· {items.length} item{items.length === 1 ? "" : "s"}</span>
        </div>
        {items.length > displayLimit && (
          <span className="text-[11px] text-muted-foreground">
            দেখাচ্ছে ১–{Math.min(displayLimit, items.length)}
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="bg-muted/30 text-left">
            <tr>
              <th className="p-3 w-10"></th>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Sizes</th>
              <th className="p-3">Featured</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              <tbody>
                {visibleItems.map((p) => (
                  <SortableRow
                    key={p.id}
                    product={p}
                    onEdit={() => onEdit(p)}
                    onDuplicate={() => onDuplicate(p)}
                    onDelete={() => onDelete(p.id)}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>
      {items.length > displayLimit && (
        <div className="p-3 text-center bg-muted/20 border-t border-border flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setDisplayLimit((prev) => prev + 50)}
            className="text-xs font-semibold text-primary hover:underline px-4 py-1.5 rounded-lg border border-primary/20 bg-primary/5 cursor-pointer"
          >
            আরও ৫০টি দেখুন (দেখাচ্ছে {Math.min(displayLimit, items.length)} / {items.length})
          </button>
          <button
            type="button"
            onClick={() => setDisplayLimit(items.length)}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline cursor-pointer"
          >
            সবগুলো ({items.length}টি) লোড করুন
          </button>
        </div>
      )}
    </div>
  );
}

function SortableRow({
  product: p, onEdit, onDuplicate, onDelete,
}: { product: any; onEdit: () => void; onDuplicate: () => void; onDelete: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: p.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <tr ref={setNodeRef} style={style} className="border-t border-border bg-card">
      <td className="p-3 w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
          title="Drag to reorder"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden shrink-0">
            {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
          </div>
          <div>
            <div className="font-medium">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.slug}</div>
          </div>
        </div>
      </td>
      <td className="p-3">{p.category || "—"}</td>
      <td className="p-3">{formatBDT(Number(p.price))}</td>
      <td className="p-3">
        {(() => {
          const s = getProductStock(p);
          if (s <= 0) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400">
                0 · Out
              </span>
            );
          }
          if (s < 5) {
            return (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                ⚠️ {s} · Low
              </span>
            );
          }
          return <span className="font-medium text-foreground">{s}</span>;
        })()}
      </td>
      <td className="p-3">
        {(() => {
          const sizes = parseSizes(p.weight_variants);
          if (sizes.length === 0) return <span className="text-muted-foreground">—</span>;
          return (
            <span className="flex flex-wrap gap-1">
              {sizes.map((s) => (
                <span
                  key={s.label}
                  className={`text-[11px] px-1.5 py-0.5 rounded border ${
                    s.stock > 0 ? "border-primary/40 text-foreground" : "border-border text-muted-foreground line-through"
                  }`}
                  title={sizeSummary(sizes)}
                >
                  {s.label}·{s.stock}
                </span>
              ))}
            </span>
          );
        })()}
      </td>
      <td className="p-3">{p.featured ? "Yes" : "No"}</td>
      <td className="p-3 text-right whitespace-nowrap">
        <button onClick={onEdit} className="p-2 hover:bg-muted rounded" title="Edit">
          <Pencil className="w-4 h-4" />
        </button>
        <button onClick={onDuplicate} className="p-2 hover:bg-muted rounded" title="Duplicate">
          <Copy className="w-4 h-4" />
        </button>
        <button onClick={onDelete} className="p-2 hover:bg-muted rounded text-destructive" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-input bg-background" />
    </div>
  );
}
