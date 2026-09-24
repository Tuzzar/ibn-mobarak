import { createFileRoute } from "@tanstack/react-router";
import { forwardRef, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Save, X, Eye, EyeOff, Pencil, Settings } from "lucide-react";
import { toast } from "sonner";
import {
  SortableTree,
  SimpleTreeItemWrapper,
  type TreeItems,
  type TreeItemComponentProps,
} from "dnd-kit-sortable-tree";
import { supabase } from "@/integrations/supabase/external";
import {
  menuCategoriesOptions,
  slugify,
  type MenuCategoryRow,
} from "@/lib/menu-categories";
import { Spinner } from "@/components/site/Spinner";
import { useConfirm } from "@/components/ui/confirm-dialog";

export const Route = createFileRoute("/admin/menu-categories")({
  ssr: false,
  component: AdminMenuCategories,
});

const MAX_DEPTH = 3; // 4 levels: 0,1,2,3

type ItemData = MenuCategoryRow;
type Items = TreeItems<ItemData>;

function rowsToTree(rows: MenuCategoryRow[]): Items {
  const byParent = new Map<string | null, MenuCategoryRow[]>();
  rows.forEach((r) => {
    const k = r.parent_id;
    if (!byParent.has(k)) byParent.set(k, []);
    byParent.get(k)!.push(r);
  });
  byParent.forEach((arr) =>
    arr.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label))
  );
  const build = (parent: string | null, depth: number): Items =>
    (byParent.get(parent) ?? []).map((r) => ({
      ...r,
      id: r.id,
      canHaveChildren: depth < MAX_DEPTH,
      children: build(r.id, depth + 1),
    }));
  return build(null, 0);
}

function withCollapsed(items: Items, collapsed: Record<string, boolean>): Items {
  return items.map((n) => ({
    ...n,
    collapsed: collapsed[String(n.id)] ?? true,
    children: n.children?.length ? withCollapsed(n.children, collapsed) : [],
  }));
}

type Flat = { id: string; parent_id: string | null; sort_order: number; depth: number };
function flatten(items: Items, parent_id: string | null = null, depth = 0, acc: Flat[] = []): Flat[] {
  items.forEach((it, idx) => {
    acc.push({ id: String(it.id), parent_id, sort_order: idx, depth });
    if (it.children?.length) flatten(it.children, String(it.id), depth + 1, acc);
  });
  return acc;
}

function AdminMenuCategories() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data: rows, isLoading } = useQuery(menuCategoriesOptions());
  const serverTree = useMemo(() => rowsToTree((rows ?? []) as MenuCategoryRow[]), [rows]);
  const [items, setItems] = useState<Items>(() => withCollapsed(serverTree, {}));
  const [busy, setBusy] = useState(false);

  // When server data changes, merge fresh rows with current collapsed state
  // so editing/toggling doesn't re-expand the tree.
  useEffect(() => {
    setItems((prev) => {
      const collapsed: Record<string, boolean> = {};
      const walk = (arr: Items) => {
        arr.forEach((n) => {
          collapsed[String(n.id)] = !!(n as any).collapsed;
          if (n.children?.length) walk(n.children);
        });
      };
      walk(prev);
      return withCollapsed(serverTree, collapsed);
    });
  }, [serverTree]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["menu-categories"] });
  };

  const addCategory = async (parentId: string | null) => {
    const siblings = ((rows ?? []) as MenuCategoryRow[]).filter((r) => r.parent_id === parentId);
    const nextOrder = siblings.length
      ? Math.max(...siblings.map((s) => s.sort_order)) + 1
      : 0;
    const label = parentId ? "New Subcategory" : "New Category";
    setBusy(true);
    const { error } = await supabase.from("menu_categories" as any).insert({
      parent_id: parentId,
      label,
      name: label,
      slug: slugify(label) + "-" + Date.now().toString(36).slice(-4),
      sort_order: nextOrder,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Added");
      invalidate();
    }
  };

  const updateNode = async (id: string, patch: Partial<MenuCategoryRow>) => {
    const patchPayload: any = { ...patch };
    if (patch.label) {
      patchPayload.name = patch.label;
    }
    const { error } = await supabase
      .from("menu_categories" as any)
      .update(patchPayload)
      .eq("id", id);
    if (error) toast.error(error.message);
    else invalidate();
  };

  const deleteNode = async (id: string, label: string) => {
    const ok = await confirm({
      title: "Delete Category?",
      description: `Are you sure you want to delete "${label}" and all its subcategories? This cannot be undone.`,
      confirmText: "Delete",
      variant: "destructive",
      icon: "trash",
    });
    if (!ok) return;
    setBusy(true);
    const { error } = await supabase.from("menu_categories" as any).delete().eq("id", id);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      invalidate();
    }
  };

  const persistTree = async (next: Items) => {
    const flat = flatten(next);
    if (flat.some((f) => f.depth > MAX_DEPTH)) {
      toast.error(`Maximum nesting is ${MAX_DEPTH + 1} levels.`);
      setItems(serverTree);
      return;
    }
    const current = new Map(
      ((rows ?? []) as MenuCategoryRow[]).map((r) => [r.id, r])
    );
    const changed = flat.filter((f) => {
      const c = current.get(f.id);
      return !c || c.parent_id !== f.parent_id || c.sort_order !== f.sort_order;
    });
    if (!changed.length) return;
    setBusy(true);
    const results = await Promise.all(
      changed.map((f) =>
        supabase
          .from("menu_categories" as any)
          .update({ parent_id: f.parent_id, sort_order: f.sort_order } as any)
          .eq("id", f.id)
      )
    );
    setBusy(false);
    const err = results.find((r) => r.error)?.error;
    if (err) {
      toast.error(err.message);
      setItems(serverTree);
    } else {
      toast.success("Order saved");
      // Don't invalidate — local `items` already reflects the new order.
      // Refetching would replace object refs mid-interaction and cause jank.
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl">Menu Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Drag rows to reorder or to nest under another category (up to 3 levels).
          </p>
        </div>
        <button
          onClick={() => addCategory(null)}
          disabled={busy}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 disabled:opacity-60"
        >
          <Plus className="w-4 h-4" /> Add top-level
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 flex justify-center"><Spinner /></div>
      ) : items.length === 0 ? (
        <div className="border border-dashed border-border rounded-lg p-10 text-center text-muted-foreground">
          No categories yet. Click "Add top-level" to create one.
        </div>
      ) : (
        <MenuTree
          items={items}
          onItemsChanged={(next) => {
            setItems(next);
            persistTree(next);
          }}
          onAdd={addCategory}
          onUpdate={updateNode}
          onDelete={deleteNode}
          busy={busy}
        />
      )}
    </div>
  );
}

type RowCallbacks = {
  onAdd: (parentId: string | null) => void;
  onUpdate: (id: string, patch: Partial<MenuCategoryRow>) => void;
  onDelete: (id: string, label: string) => void;
  busy: boolean;
};

// Context-ish: pass via closure by recreating the component each render.
function MenuTree({
  items,
  onItemsChanged,
  onAdd,
  onUpdate,
  onDelete,
  busy,
}: {
  items: Items;
  onItemsChanged: (next: Items) => void;
} & RowCallbacks) {
  const TreeItemComponent = useMemo(
    () =>
      forwardRef<HTMLDivElement, TreeItemComponentProps<ItemData>>((props, ref) => (
        <SimpleTreeItemWrapper {...props} ref={ref} showDragHandle manualDrag={false}>
          <RowContent
            item={props.item as ItemData}
            depth={props.depth}
            onAdd={onAdd}
            onUpdate={onUpdate}
            onDelete={onDelete}
            busy={busy}
          />
        </SimpleTreeItemWrapper>
      )),
    [onAdd, onUpdate, onDelete, busy]
  );
  return (
    <SortableTree
      items={items}
      onItemsChanged={onItemsChanged}
      TreeItemComponent={TreeItemComponent}
      indentationWidth={28}
      indicator
    />
  );
}

function RowContent({
  item,
  depth,
  onAdd,
  onUpdate,
  onDelete,
  busy,
}: { item: ItemData & { children?: Items }; depth: number } & RowCallbacks) {
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [label, setLabel] = useState(item.label);
  useEffect(() => {
    if (!menuOpen) return;
    const r = btnRef.current?.getBoundingClientRect();
    if (r) setMenuPos({ top: r.bottom + 4, left: r.right - 180 });
  }, [menuOpen]);

  const [slug, setSlug] = useState(item.slug);
  const [icon, setIcon] = useState(item.icon ?? "");
  const canAddChild = depth < MAX_DEPTH;

  useEffect(() => {
    setLabel(item.label);
    setSlug(item.slug);
    setIcon(item.icon ?? "");
  }, [item.label, item.slug, item.icon]);

  const save = () => {
    onUpdate(item.id as string, {
      label,
      slug: slug || slugify(label),
      icon: icon || null,
    });
    setEditing(false);
  };
  const cancel = () => {
    setLabel(item.label);
    setSlug(item.slug);
    setIcon(item.icon ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div
        className="flex-1 flex items-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            value={label}
            onChange={(e) => {
              setLabel(e.target.value);
              if (!slug || slug === slugify(item.label)) setSlug(slugify(e.target.value));
            }}
            placeholder="Label"
            className="px-2 py-1.5 text-sm rounded border border-border bg-background"
          />
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="slug"
            className="px-2 py-1.5 text-sm rounded border border-border bg-background font-mono"
          />
          <input
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="icon (optional)"
            className="px-2 py-1.5 text-sm rounded border border-border bg-background"
          />
        </div>
        <button onClick={save} className="p-1.5 text-primary hover:bg-primary/10 rounded" aria-label="Save">
          <Save className="w-4 h-4" />
        </button>
        <button onClick={cancel} className="p-1.5 text-muted-foreground hover:bg-muted rounded" aria-label="Cancel">
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center gap-2">
      <div className="flex-1 flex items-center gap-3 min-w-0">
        <span className={`text-sm font-medium truncate ${item.is_active ? "" : "line-through opacity-50"}`}>
          {item.label}
        </span>
        <span className="text-xs text-muted-foreground font-mono truncate">/{item.slug}</span>
      </div>
      <div className="relative shrink-0">
        <button
          ref={btnRef}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
          className="p-1.5 text-muted-foreground hover:text-primary hover:bg-muted rounded"
          aria-label="Actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <Settings className="w-4 h-4" />
        </button>
        {menuOpen && menuPos && typeof document !== "undefined" && createPortal(
          <>
            <div
              className="fixed inset-0 z-40"
              onPointerDown={(e) => { e.stopPropagation(); setMenuOpen(false); }}
              onClick={(e) => e.stopPropagation()}
            />
            <div
              role="menu"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              style={{ position: "fixed", top: menuPos.top, left: menuPos.left }}
              className="z-50 min-w-[180px] rounded-md border border-border bg-popover text-popover-foreground shadow-md py-1"
            >
              <button
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); setEditing(true); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onUpdate(item.id as string, { is_active: !item.is_active }); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left"
              >
                {item.is_active ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {item.is_active ? "Hide from menu" : "Show in menu"}
              </button>
              {canAddChild && (
                <button
                  role="menuitem"
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onAdd(item.id as string); }}
                  disabled={busy}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-muted text-left disabled:opacity-60"
                >
                  <Plus className="w-3.5 h-3.5" /> Add subcategory
                </button>
              )}
              <div className="my-1 border-t border-border" />
              <button
                role="menuitem"
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); onDelete(item.id as string, item.label); }}
                disabled={busy}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-destructive/10 text-destructive text-left disabled:opacity-60"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </>,
          document.body
        )}
      </div>
    </div>
  );
}