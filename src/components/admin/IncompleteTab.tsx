import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Phone, MessageCircle, Trash2, Loader2, Check, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/external";
import { formatBDT } from "@/lib/cart";
import { cn } from "@/lib/utils";
import { ConvertLeadModal, type LeadForConvert } from "./ConvertLeadModal";
import { useConfirm } from "@/components/ui/confirm-dialog";

const STATUSES = ["new", "contacted", "recovered", "lost", "converted"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLES: Record<Status, string> = {
  new: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-blue-50 text-blue-700 border-blue-200",
  recovered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  lost: "bg-rose-50 text-rose-700 border-rose-200",
  converted: "bg-slate-100 text-slate-600 border-slate-200",
};

export type Lead = {
  id: string;
  customer_name: string;
  customer_phone: string;
  address: string;
  city: string;
  notes: string | null;
  items: Array<{ id?: string; name?: string; quantity: number; price?: number; unit?: string | null }>;
  subtotal: number;
  delivery_fee: number;
  total: number;
  source: string;
  landing_slug: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export function useLeads() {
  return useQuery({
    queryKey: ["admin-incomplete-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incomplete_orders")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Lead[];
    },
    refetchInterval: 60_000,
  });
}

function completeness(l: Lead) {
  let filled = 0;
  if (l.customer_name.trim().length >= 2) filled++;
  if (l.customer_phone.replace(/\D/g, "").length >= 10) filled++;
  if (l.address.trim().length >= 5) filled++;
  return Math.round((filled / 3) * 100);
}

export function IncompleteTab({ search }: { search: string }) {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { data: leads, isLoading } = useLeads();
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({});
  const [converting, setConverting] = useState<LeadForConvert | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (leads ?? []).filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!q) return true;
      return (
        l.customer_name.toLowerCase().includes(q) ||
        l.customer_phone.toLowerCase().includes(q) ||
        l.address.toLowerCase().includes(q)
      );
    });
  }, [leads, statusFilter, search]);

  const patch = async (id: string, values: Partial<Lead>) => {
    setSavingId(id);
    const { error } = await supabase.from("incomplete_orders").update(values as never).eq("id", id);
    setSavingId(null);
    if (error) {
      toast.error("Could not update");
      return;
    }
    qc.invalidateQueries({ queryKey: ["admin-incomplete-orders"] });
  };

  const remove = async (id: string) => {
    const ok = await confirm({
      title: "Delete Incomplete Order?",
      description: "Are you sure you want to delete this incomplete order? This action cannot be undone.",
      confirmText: "Delete",
      variant: "destructive",
      icon: "trash",
    });
    if (!ok) return;
    const { error } = await supabase.from("incomplete_orders").delete().eq("id", id);
    if (error) {
      toast.error("Could not delete");
      return;
    }
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-incomplete-orders"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s as "all" | Status)}
            className={cn(
              "px-3 py-1.5 text-[11px] uppercase tracking-[0.16em] border rounded-full transition",
              statusFilter === s
                ? "border-gold bg-gold/10 text-foreground"
                : "border-border text-muted-foreground hover:border-gold/40",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gold/40 rounded-2xl py-20 text-center text-muted-foreground">
          কোনো ইনকমপ্লিট অর্ডার নেই।
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const status = (STATUSES.includes(l.status as Status) ? l.status : "new") as Status;
            const phoneDigits = l.customer_phone.replace(/\D/g, "");
            const wa = phoneDigits.startsWith("880") ? phoneDigits : `880${phoneDigits.replace(/^0/, "")}`;
            return (
              <article key={l.id} className="border border-border bg-card rounded-2xl p-4 md:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-display text-lg">{l.customer_name || "নাম দেয়নি"}</h3>
                      <span
                        className={cn(
                          "text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 border rounded-full",
                          STATUS_STYLES[status],
                        )}
                      >
                        {status}
                      </span>
                      <span className="text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 border border-border rounded-full text-muted-foreground">
                        {l.source}
                        {l.landing_slug ? ` · ${l.landing_slug}` : ""}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{completeness(l)}% filled</span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 font-numeric">
                      {l.customer_phone || "ফোন নেই"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {l.address || "ঠিকানা নেই"}
                      {l.city ? ` — ${l.city}` : ""}
                    </p>
                    <ul className="mt-2 text-sm space-y-0.5">
                      {(l.items ?? []).map((it, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          {it.quantity} × {it.name ?? "Item"}
                          {it.price ? ` — ${formatBDT(it.price * it.quantity)}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-display text-xl text-primary">{formatBDT(l.total)}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {new Date(l.updated_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {l.status !== "converted" && (
                    <button
                      onClick={() =>
                        setConverting({
                          id: l.id,
                          customer_name: l.customer_name,
                          customer_phone: l.customer_phone,
                          address: l.address,
                          city: l.city,
                          notes: l.notes,
                          delivery_fee: Number(l.delivery_fee) || 70,
                          items: l.items ?? [],
                        })
                      }
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs bg-primary text-primary-foreground rounded-full hover:bg-gold hover:text-gold-foreground transition"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> Confirm → Order
                    </button>
                  )}
                  {phoneDigits && (
                    <>
                      <a
                        href={`tel:${l.customer_phone}`}
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-border rounded-full hover:border-gold transition"
                      >
                        <Phone className="w-3.5 h-3.5" /> Call
                      </a>
                      <a
                        href={`https://wa.me/${wa}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 text-xs border border-gold rounded-full hover:bg-gold/10 transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </a>
                    </>
                  )}

                  <select
                    value={status}
                    onChange={(e) => patch(l.id, { status: e.target.value })}
                    className="px-3 py-2 text-xs border border-input bg-background rounded-full focus:outline-none focus:ring-2 focus:ring-gold"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 flex-1 min-w-[200px]">
                    <input
                      value={noteDraft[l.id] ?? l.admin_note ?? ""}
                      onChange={(e) => setNoteDraft((d) => ({ ...d, [l.id]: e.target.value }))}
                      placeholder="Admin note…"
                      maxLength={500}
                      className="flex-1 px-3 py-2 text-xs border border-input bg-background rounded-full focus:outline-none focus:ring-2 focus:ring-gold"
                    />
                    <button
                      onClick={() => patch(l.id, { admin_note: noteDraft[l.id] ?? "" })}
                      disabled={
                        savingId === l.id || (noteDraft[l.id] ?? l.admin_note ?? "") === (l.admin_note ?? "")
                      }
                      className="p-2 text-primary disabled:opacity-30"
                      aria-label="Save note"
                    >
                      {savingId === l.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <button
                    onClick={() => remove(l.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-full"
                    aria-label="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {converting && (
        <ConvertLeadModal
          lead={converting}
          onClose={() => setConverting(null)}
          onConverted={() => {
            qc.invalidateQueries({ queryKey: ["admin-incomplete-orders"] });
            qc.invalidateQueries({ queryKey: ["admin-orders"] });
          }}
        />
      )}
    </div>
  );
}
