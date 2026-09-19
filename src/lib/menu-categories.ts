import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/external";

export type MenuCategoryRow = {
  id: string;
  parent_id: string | null;
  label: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_active: boolean;
};

export type MenuCategoryNode = MenuCategoryRow & {
  children: MenuCategoryNode[];
};

export function buildTree(rows: MenuCategoryRow[]): MenuCategoryNode[] {
  const byId = new Map<string, MenuCategoryNode>();
  rows.forEach((r) => byId.set(r.id, { ...r, children: [] }));
  const roots: MenuCategoryNode[] = [];
  byId.forEach((node) => {
    if (node.parent_id && byId.has(node.parent_id)) {
      byId.get(node.parent_id)!.children.push(node);
    } else {
      roots.push(node);
    }
  });
  const sortRec = (arr: MenuCategoryNode[]) => {
    arr.sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
    arr.forEach((n) => sortRec(n.children));
  };
  sortRec(roots);
  return roots;
}

export const menuCategoriesOptions = () =>
  queryOptions({
    queryKey: ["menu-categories"],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_categories" as any)
        .select("id, parent_id, label, slug, icon, sort_order, is_active")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MenuCategoryRow[];
    },
  });

export const activeMenuTreeOptions = () =>
  queryOptions({
    queryKey: ["menu-categories", "active-tree"],
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_categories" as any)
        .select("id, parent_id, label, slug, icon, sort_order, is_active")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return buildTree((data ?? []) as unknown as MenuCategoryRow[]);
    },
  });

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}