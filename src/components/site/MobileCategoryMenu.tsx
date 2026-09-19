import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ChevronRight, ChevronDown, Layers, Palette, Brush, Frame, BookOpen, Feather, Maximize, Gem, PackagePlus, Pencil } from "lucide-react";
import { activeMenuTreeOptions, type MenuCategoryNode } from "@/lib/menu-categories";
import { MASTER_ART_CATEGORIES } from "@/data/artCategories";

const ICON_MAP: Record<string, any> = {
  Palette,
  Brush,
  Frame,
  BookOpen,
  Pencil,
  Feather,
  Layers,
  Maximize,
  Gem,
  PackagePlus,
};

type Props = {
  onNavigate: () => void;
};

export function MobileCategoryMenu({ onNavigate }: Props) {
  const { data: dbTree } = useQuery(activeMenuTreeOptions());

  // Fallback tree built from MASTER_ART_CATEGORIES if DB tree isn't ready
  const tree: MenuCategoryNode[] =
    dbTree && dbTree.length > 0
      ? dbTree
      : MASTER_ART_CATEGORIES.map((cat, idx) => ({
          id: cat.id,
          parent_id: null,
          label: `${cat.bengali} (${cat.name})`,
          slug: cat.slug,
          icon: cat.iconName,
          sort_order: idx * 10,
          is_active: true,
          children: cat.subcategories.map((sub, sIdx) => ({
            id: sub.id,
            parent_id: cat.id,
            label: `${sub.bengali} (${sub.name})`,
            slug: sub.slug,
            icon: null,
            sort_order: sIdx + 1,
            is_active: true,
            children: [],
          })),
        }));

  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-[10px] uppercase tracking-[0.28em] font-semibold text-accent">
          ক্যাটাগরি সমূহ (Categories)
        </span>
        <button
          type="button"
          onClick={() => {
            onNavigate();
          }}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
        >
          সব প্রোডাক্টস
        </button>
      </div>
      <ul className="flex flex-col divide-y divide-border/40">
        {tree.map((node) => (
          <CategoryRow
            key={node.id}
            node={node}
            depth={0}
            parentSlug={null}
            onNavigate={onNavigate}
          />
        ))}
      </ul>
    </div>
  );
}

function CategoryRow({
  node,
  depth,
  parentSlug,
  onNavigate,
}: {
  node: MenuCategoryNode;
  depth: number;
  parentSlug: string | null;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const hasChildren = node.children && node.children.length > 0;
  const IconComponent = node.icon ? ICON_MAP[node.icon] : null;

  const handleRowClick = () => {
    if (hasChildren) {
      setOpen((o) => !o);
    } else {
      goToCategory();
    }
  };

  const goToCategory = () => {
    if (parentSlug) {
      // Subcategory navigation
      navigate({
        to: "/products",
        search: { category: parentSlug, subcategory: node.slug, q: "" } as any,
      });
    } else {
      // Parent category navigation
      navigate({
        to: "/products",
        search: { category: node.slug, q: "" } as any,
      });
    }
    onNavigate();
  };

  return (
    <li className="group">
      <div
        className={`flex items-center justify-between py-2.5 transition-colors ${
          depth === 0 ? "hover:bg-muted/40 px-2 rounded-lg" : "hover:bg-muted/20 pl-6 pr-2 rounded-md"
        }`}
      >
        <button
          type="button"
          onClick={handleRowClick}
          className="flex-1 flex items-center gap-2.5 text-left select-none"
        >
          {depth === 0 && IconComponent && (
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <IconComponent className="w-3.5 h-3.5" />
            </div>
          )}
          {depth > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-gold/60 shrink-0" />
          )}
          <span
            className={`truncate ${
              depth === 0
                ? "text-sm font-medium text-foreground group-hover:text-primary"
                : "text-xs text-foreground/80 group-hover:text-foreground"
            }`}
          >
            {node.label}
          </span>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          {hasChildren ? (
            <>
              <button
                type="button"
                onClick={goToCategory}
                className="px-2 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/10 rounded transition-colors"
                title={`View all in ${node.label}`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition"
                aria-label={open ? "Collapse subcategories" : "Expand subcategories"}
              >
                {open ? (
                  <ChevronDown className="w-4 h-4 text-primary" strokeWidth={2} />
                ) : (
                  <ChevronRight className="w-4 h-4" strokeWidth={1.8} />
                )}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={goToCategory}
              className="p-1 text-muted-foreground group-hover:text-primary transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" strokeWidth={1.8} />
            </button>
          )}
        </div>
      </div>

      {hasChildren && open && (
        <ul className="flex flex-col py-1 space-y-0.5 border-l-2 border-gold/25 ml-5 pl-1 my-1">
          {node.children.map((c) => (
            <CategoryRow
              key={c.id}
              node={c}
              depth={depth + 1}
              parentSlug={node.slug}
              onNavigate={onNavigate}
            />
          ))}
        </ul>
      )}
    </li>
  );
}