import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, Eye, EyeOff, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/external";
import { allProductsSlugOptions } from "@/lib/queries";
import { menuCategoriesOptions } from "@/lib/menu-categories";
import {
  SECTION_TYPES,
  allHomeSectionsOptions,
  getSectionMeta,
  type HomeSectionRow,
  type HomeSectionType,
} from "@/lib/home-sections";
import { SectionRow, useAccordionOpen } from "./SectionAccordion";
import { useConfirm } from "@/components/ui/confirm-dialog";

/** Add-button + type-picker, mounted above the unified AccordionList. */
export function AddCustomSectionButton() {
  const qc = useQueryClient();
  const { data: sections = [], isLoading } = useQuery(allHomeSectionsOptions());
  const { setOpenId } = useAccordionOpen();
  const [pickerOpen, setPickerOpen] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["home-sections"] });
  };

  const addSection = async (type: HomeSectionType) => {
    const meta = getSectionMeta(type);
    if (!meta) return;
    const maxPos = sections.reduce((m, s) => Math.max(m, s.position), -1);
    const { data, error } = await supabase
      .from("home_sections")
      .insert({
        type,
        title: meta.label,
        config: meta.defaultConfig as never,
        position: maxPos + 1,
        is_visible: true,
      })
      .select("id")
      .single();
    if (error) {
      toast.error(error.message);
      return;
    }
    setPickerOpen(false);
    if (data?.id) setOpenId(data.id);
    invalidate();
    toast.success(`${meta.label} added`);
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-foreground/60">
          Add your own home-page blocks. They appear in the list below in amber tint —
          drag them anywhere between the built-in sections.
          {isLoading ? " Loading…" : ""}
        </p>
        <button
          onClick={() => setPickerOpen((v) => !v)}
          className="inline-flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-full text-sm hover:bg-amber-700 transition shrink-0"
        >
          <Plus className="w-4 h-4" /> Add custom section
        </button>
      </div>

      {pickerOpen && (
        <div className="mt-3 p-4 border border-amber-300/60 rounded-lg bg-amber-50/40 dark:bg-amber-950/10">
          <div className="text-xs uppercase tracking-wider text-foreground/60 mb-3">
            Choose a section type
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SECTION_TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => addSection(t.type)}
                className="text-left p-3 border border-border rounded-md bg-background hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition"
              >
                <div className="font-medium text-sm">{t.label}</div>
                <div className="text-xs text-foreground/60 mt-0.5">{t.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** A single custom-section row designed to sit inside the unified AccordionList.
 *  NOTE: `id` must be forwarded as a prop (not just a React `key`) because the
 *  parent `AccordionList` reads `child.props.id` to build its sortable map. */
export function CustomSectionRow({
  id,
  section,
}: {
  id: string;
  section: HomeSectionRow;
}) {
  void id;
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { openId, setOpenId } = useAccordionOpen();
  const meta = getSectionMeta(section.type);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["home-sections"] });

  const update = async (patch: Partial<HomeSectionRow>) => {
    const { error } = await supabase
      .from("home_sections")
      .update(patch as never)
      .eq("id", section.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    invalidate();
  };

  const remove = async () => {
    const title = section.title || meta?.label || "Custom section";
    const ok = await confirm({
      title: "Delete Section?",
      description: `Are you sure you want to delete "${title}"? This section will be permanently removed from the home page.`,
      confirmText: "Delete Section",
      variant: "destructive",
      icon: "trash",
    });
    if (!ok) return;
    const { error } = await supabase.from("home_sections").delete().eq("id", section.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (openId === section.id) setOpenId(null);
    invalidate();
    toast.success("Section deleted");
  };

  return (
    <SectionRow
      id={section.id}
      title={section.title || meta?.label || "Custom section"}
      subtitle={meta?.label ?? section.type}
      variant="custom"
      hidden={!section.is_visible}
      actions={
        <SettingsMenu
          isVisible={section.is_visible}
          onToggleVisible={() => update({ is_visible: !section.is_visible })}
          onDelete={remove}
        />
      }
    >
      {meta && <SectionEditor section={section} meta={meta} onChange={update} />}
    </SectionRow>
  );
}

function SettingsMenu({
  isVisible,
  onToggleVisible,
  onDelete,
}: {
  isVisible: boolean;
  onToggleVisible: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 text-foreground/60 hover:text-foreground"
        title="Section settings"
        aria-label="Section settings"
      >
        <Settings className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-40 min-w-[160px] rounded-md border border-border bg-popover shadow-md py-1">
          <button
            type="button"
            onClick={() => {
              onToggleVisible();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted"
          >
            {isVisible ? (
              <>
                <EyeOff className="w-4 h-4" /> Hide on home
              </>
            ) : (
              <>
                <Eye className="w-4 h-4" /> Show on home
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-4 h-4" /> Delete section
          </button>
        </div>
      )}
    </div>
  );
}

function SectionEditor({
  section,
  meta,
  onChange,
}: {
  section: HomeSectionRow;
  meta: ReturnType<typeof getSectionMeta> & {};
  onChange: (patch: Partial<HomeSectionRow>) => void;
}) {
  const [title, setTitle] = useState(section.title);
  const [config, setConfig] = useState<Record<string, unknown>>(section.config ?? {});
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await onChange({ title, config });
    setSaving(false);
    toast.success("Saved");
  };

  return (
    <div className="border-t border-border p-4 space-y-3 bg-muted/20">
      <Field label="Internal title (admin only)">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
        />
      </Field>
      {meta.fields.map((f) => {
        const rawVal = config[f.key];
        const val = (typeof rawVal === "string" ? rawVal : "") ?? "";
        const setVal = (v: unknown) => setConfig({ ...config, [f.key]: v });
        return (
          <Field key={f.key} label={f.label}>
            {f.type === "textarea" ? (
              <textarea
                value={val}
                onChange={(e) => setVal(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              />
            ) : f.type === "select" ? (
              <select
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              >
                {f.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "number" ? (
              <input
                type="number"
                min={f.min}
                max={f.max}
                value={typeof rawVal === "number" ? rawVal : Number(val) || 0}
                onChange={(e) => setVal(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              />
            ) : f.type === "product_select" ? (
              <ProductSelect value={val} onChange={(v) => setVal(v)} />
            ) : f.type === "product_multiselect" ? (
              <ProductMultiSelect
                value={Array.isArray(rawVal) ? (rawVal as string[]) : []}
                onChange={(v) => setVal(v)}
                max={f.max}
              />
            ) : f.type === "category_multiselect" ? (
              <CategoryMultiSelect
                value={Array.isArray(rawVal) ? (rawVal as string[]) : []}
                onChange={(v) => setVal(v)}
                max={f.max}
              />
            ) : f.type === "repeater" ? (
              <Repeater
                value={Array.isArray(rawVal) ? (rawVal as Record<string, string>[]) : []}
                onChange={(v) => setVal(v)}
                itemLabel={f.itemLabel}
                max={f.max}
                fields={f.fields}
              />
            ) : (
              <input
                type={f.type === "url" ? "url" : "text"}
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
              />
            )}
          </Field>
        );
      })}
      <div className="flex justify-end pt-2">
        <button
          onClick={save}
          disabled={saving}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save section"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wider text-foreground/60 mb-1">
        {label}
      </span>
      {children}
    </label>
  );
}

function ProductSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const { data: products = [] } = useQuery(allProductsSlugOptions());
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
    >
      <option value="">— Select a product —</option>
      {products.map((p) => (
        <option key={p.id} value={p.slug}>
          {p.name}
        </option>
      ))}
    </select>
  );
}

function ProductMultiSelect({
  value,
  onChange,
  max,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const { data: products = [] } = useQuery(allProductsSlugOptions());
  const add = (slug: string) => {
    if (!slug || value.includes(slug)) return;
    if (max && value.length >= max) {
      toast.error(`Maximum ${max} products`);
      return;
    }
    onChange([...value, slug]);
  };
  const remove = (slug: string) => onChange(value.filter((s) => s !== slug));
  const move = (slug: string, dir: -1 | 1) => {
    const i = value.indexOf(slug);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <select
        value=""
        onChange={(e) => {
          add(e.target.value);
          e.currentTarget.value = "";
        }}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
      >
        <option value="">+ Add a product…</option>
        {products
          .filter((p) => !value.includes(p.slug))
          .map((p) => (
            <option key={p.id} value={p.slug}>
              {p.name}
            </option>
          ))}
      </select>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((slug) => {
            const p = products.find((x) => x.slug === slug);
            return (
              <li
                key={slug}
                className="flex items-center gap-2 px-2 py-1.5 border border-border rounded-md bg-background text-sm"
              >
                <span className="flex-1 truncate">{p?.name ?? slug}</span>
                <button
                  type="button"
                  onClick={() => move(slug, -1)}
                  className="text-xs text-foreground/60 hover:text-foreground px-1"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(slug, 1)}
                  className="text-xs text-foreground/60 hover:text-foreground px-1"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(slug)}
                  className="text-xs text-destructive hover:underline"
                >
                  remove
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
function CategoryMultiSelect({
  value,
  onChange,
  max,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const { data: cats = [] } = useQuery(menuCategoriesOptions());
  const add = (slug: string) => {
    if (!slug || value.includes(slug)) return;
    if (max && value.length >= max) {
      toast.error(`Maximum ${max} categories`);
      return;
    }
    onChange([...value, slug]);
  };
  const remove = (slug: string) => onChange(value.filter((s) => s !== slug));
  const move = (slug: string, dir: -1 | 1) => {
    const i = value.indexOf(slug);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-2">
      <select
        value=""
        onChange={(e) => {
          add(e.target.value);
          e.currentTarget.value = "";
        }}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm"
      >
        <option value="">+ Add a category…</option>
        {cats
          .filter((c) => !value.includes(c.slug))
          .map((c) => (
            <option key={c.id} value={c.slug}>
              {c.label}
            </option>
          ))}
      </select>
      {value.length > 0 && (
        <ul className="space-y-1">
          {value.map((slug) => {
            const c = cats.find((x) => x.slug === slug);
            return (
              <li
                key={slug}
                className="flex items-center gap-2 px-2 py-1.5 border border-border rounded-md bg-background text-sm"
              >
                <span className="flex-1 truncate">{c?.label ?? slug}</span>
                <button type="button" onClick={() => move(slug, -1)} className="text-xs text-foreground/60 hover:text-foreground px-1">↑</button>
                <button type="button" onClick={() => move(slug, 1)} className="text-xs text-foreground/60 hover:text-foreground px-1">↓</button>
                <button type="button" onClick={() => remove(slug)} className="text-xs text-destructive hover:underline">remove</button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Repeater({
  value,
  onChange,
  itemLabel,
  max,
  fields,
}: {
  value: Record<string, string>[];
  onChange: (v: Record<string, string>[]) => void;
  itemLabel: string;
  max?: number;
  fields: { key: string; label: string; type: "text" | "textarea" | "url" }[];
}) {
  const addItem = () => {
    if (max && value.length >= max) {
      toast.error(`Maximum ${max} items`);
      return;
    }
    const empty: Record<string, string> = {};
    fields.forEach((f) => (empty[f.key] = ""));
    onChange([...value, empty]);
  };
  const updateItem = (i: number, key: string, v: string) => {
    const next = [...value];
    next[i] = { ...next[i], [key]: v };
    onChange(next);
  };
  const removeItem = (i: number) => onChange(value.filter((_, idx) => idx !== i));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="space-y-3">
      {value.map((item, i) => (
        <div key={i} className="border border-border rounded-md p-3 bg-background space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-foreground/60">
              {itemLabel} {i + 1}
            </span>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => move(i, -1)} className="text-xs text-foreground/60 hover:text-foreground px-1">↑</button>
              <button type="button" onClick={() => move(i, 1)} className="text-xs text-foreground/60 hover:text-foreground px-1">↓</button>
              <button type="button" onClick={() => removeItem(i)} className="text-xs text-destructive hover:underline ml-1">remove</button>
            </div>
          </div>
          {fields.map((f) =>
            f.type === "textarea" ? (
              <textarea
                key={f.key}
                placeholder={f.label}
                value={item[f.key] ?? ""}
                onChange={(e) => updateItem(i, f.key, e.target.value)}
                rows={3}
                className="w-full px-2.5 py-1.5 border border-border rounded-md bg-background text-sm"
              />
            ) : (
              <input
                key={f.key}
                type={f.type === "url" ? "url" : "text"}
                placeholder={f.label}
                value={item[f.key] ?? ""}
                onChange={(e) => updateItem(i, f.key, e.target.value)}
                className="w-full px-2.5 py-1.5 border border-border rounded-md bg-background text-sm"
              />
            ),
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="text-sm border border-dashed border-border rounded-md px-3 py-2 w-full hover:border-primary hover:bg-primary/5 transition"
      >
        + Add {itemLabel.toLowerCase()}
      </button>
    </div>
  );
}
