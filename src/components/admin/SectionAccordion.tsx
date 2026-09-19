import React, { createContext, useContext, useEffect, useState } from "react";
import { ChevronDown, GripVertical, RotateCcw } from "lucide-react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

const AccordionCtx = createContext<{
  openId: string | null;
  setOpenId: (id: string | null) => void;
}>({ openId: null, setOpenId: () => {} });

export function useAccordionOpen() {
  return useContext(AccordionCtx);
}

export function AccordionList({
  children,
  storageKey,
}: {
  children: React.ReactNode;
  storageKey: string;
}) {
  const entries = React.Children.toArray(children).filter(
    React.isValidElement,
  ) as React.ReactElement<{ id: string }>[];
  const defaultIds = entries.map((e) => e.props.id);

  const [order, setOrder] = useState<string[]>(defaultIds);
  const [openId, setOpenId] = useState<string | null>(null);
  const defaultIdsKey = defaultIds.join("|");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let saved: string[] = [];
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) saved = JSON.parse(raw) as string[];
    } catch {
      /* noop */
    }
    const merged = [
      ...saved.filter((id) => defaultIds.includes(id)),
      ...defaultIds.filter((id) => !saved.includes(id)),
    ];
    setOrder(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, defaultIdsKey]);

  const persist = (next: string[]) => {
    setOrder(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {
      /* noop */
    }
  };

  const reset = () => {
    setOrder(defaultIds);
    try {
      window.localStorage.removeItem(storageKey);
    } catch {
      /* noop */
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const byId = new Map(entries.map((e) => [e.props.id, e]));
  // Always keep order in sync with current children: include known ids in saved
  // order, append any new ids at the end, drop ids no longer present.
  const finalOrder = [
    ...order.filter((id) => byId.has(id)),
    ...defaultIds.filter((id) => !order.includes(id)),
  ];

  return (
    <AccordionCtx.Provider value={{ openId, setOpenId }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted-foreground">
          Drag rows to reorder • Click to expand (one at a time)
        </p>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          <RotateCcw className="w-3 h-3" /> Reset order
        </button>
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={({ active, over }) => {
          if (!over || active.id === over.id) return;
          const oldI = finalOrder.indexOf(String(active.id));
          const newI = finalOrder.indexOf(String(over.id));
          if (oldI < 0 || newI < 0) return;
          persist(arrayMove(finalOrder, oldI, newI));
        }}
      >
        <SortableContext items={finalOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {finalOrder.map((id) => byId.get(id) ?? null)}
          </div>
        </SortableContext>
      </DndContext>
    </AccordionCtx.Provider>
  );
}

export function SectionRow({
  id,
  title,
  subtitle,
  children,
  variant = "builtin",
  actions,
  hidden,
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  variant?: "builtin" | "custom";
  actions?: React.ReactNode;
  hidden?: boolean;
}) {
  const { openId, setOpenId } = useContext(AccordionCtx);
  const open = openId === id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 30 : undefined,
  };
  const customTint =
    variant === "custom"
      ? "bg-amber-50/40 dark:bg-amber-950/10 border-amber-200/70 dark:border-amber-900/40"
      : "bg-card border-border";
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg ${customTint} ${
        open ? "border-primary/50 shadow-sm" : ""
      } ${hidden ? "opacity-60" : ""}`}
    >
      <div className={`flex items-stretch ${open ? "bg-muted/30" : ""}`}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          className="px-2.5 flex items-center text-muted-foreground hover:text-primary cursor-grab active:cursor-grabbing touch-none focus:outline-none"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => setOpenId(open ? null : id)}
          aria-expanded={open}
          className="flex-1 flex items-center justify-between gap-3 py-4 pr-4 md:pr-5 text-left hover:bg-muted/30 transition-colors"
        >
          <div className="min-w-0">
            <h2 className="font-display text-base md:text-lg text-primary leading-tight truncate flex items-center gap-2">
              {variant === "custom" && (
                <span className="text-[10px] uppercase tracking-widest text-amber-700 dark:text-amber-400 border border-amber-300/70 dark:border-amber-700/60 px-1.5 py-0.5 rounded">
                  Custom
                </span>
              )}
              <span className="truncate">{title}</span>
              {hidden && (
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  hidden
                </span>
              )}
            </h2>
            {subtitle && (
              <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                {subtitle}
              </p>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>
        {actions && (
          <div
            className="flex items-center gap-1 pr-2"
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
      {open && (
        <div className="p-4 md:p-5 border-t border-border">{children}</div>
      )}
    </div>
  );
}