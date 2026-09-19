import { useQuery } from "@tanstack/react-query";
import { History, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/external";
import { ORDER_FIELD_LABELS, type OrderHistoryEntry } from "@/lib/order-admin";

export function OrderHistoryPanel({ orderId }: { orderId: string }) {
  const { data: history, isLoading } = useQuery({
    queryKey: ["order-history", orderId],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_history")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false });
      return (data ?? []) as OrderHistoryEntry[];
    },
  });

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <History className="w-4 h-4 text-primary" />
        <h3 className="font-display text-lg">Activity history</h3>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      )}

      {!isLoading && history?.length === 0 && (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
          No edits yet. Changes will appear here.
        </div>
      )}

      {!isLoading && history && history.length > 0 && (
        <ol className="relative border-l border-border ml-2 space-y-4">
          {history.map((h) => (
            <li key={h.id} className="pl-4 relative">
              <span className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-gold ring-4 ring-background" />
              <div className="text-xs text-muted-foreground">
                {new Date(h.created_at).toLocaleString()}
                {h.changed_by_email && <> • {h.changed_by_email}</>}
              </div>
              <div className="mt-1 text-sm">
                <span className="font-medium">
                  {ORDER_FIELD_LABELS[h.field_name] ?? h.field_name}
                </span>{" "}
                changed
              </div>
              <div className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-xs">
                <span className="text-muted-foreground">From</span>
                <span className="line-through text-rose-700/80 break-words">
                  {h.old_value || <em className="text-muted-foreground">empty</em>}
                </span>
                <span className="text-muted-foreground">To</span>
                <span className="text-emerald-700 break-words">
                  {h.new_value || <em className="text-muted-foreground">empty</em>}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
