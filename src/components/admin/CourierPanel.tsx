import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getCourierHistory } from "@/lib/courier.functions";

function tone(rate: number, total: number) {
  if (total === 0) return { label: "New customer", cls: "text-muted-foreground", ring: "stroke-border" };
  if (rate >= 80) return { label: "Safe", cls: "text-emerald-700", ring: "stroke-emerald-600" };
  if (rate >= 50) return { label: "Caution", cls: "text-amber-700", ring: "stroke-amber-500" };
  return { label: "Risky", cls: "text-rose-700", ring: "stroke-rose-600" };
}

function ago(iso?: string) {
  if (!iso) return "";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function CourierPanel({ phone }: { phone: string }) {
  const check = useServerFn(getCourierHistory);
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["courier-history", phone],
    queryFn: () => check({ data: { phone } }),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const rate = Number(data?.success_rate ?? 0);
  const total = Number(data?.total_parcel ?? 0);
  const t = tone(rate, total);
  const circumference = 2 * Math.PI * 34;

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-primary" />
          <h3 className="font-display text-lg">Courier history</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-xs"
          disabled={isFetching}
          onClick={() => check({ data: { phone, force: true } }).then(() => refetch())}
        >
          <RefreshCw className={cn("w-3.5 h-3.5", isFetching && "animate-spin")} /> Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Checking couriers…
        </div>
      )}

      {!isLoading && error && (
        <div className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-6 text-center">
          {error instanceof Error ? error.message : "Courier data unavailable."}
        </div>
      )}

      {!isLoading && !error && data && (
        <div className="space-y-4">
          <div className="flex items-center gap-5 bg-card border border-border rounded-2xl p-4">
            <div className="relative w-[84px] h-[84px] shrink-0">
              <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                <circle cx="40" cy="40" r="34" className="stroke-border" strokeWidth="7" fill="none" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  className={t.ring}
                  strokeWidth="7"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - Math.min(rate, 100) / 100)}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-xl leading-none">{rate}%</span>
              </div>
            </div>
            <div className="min-w-0">
              <div className={cn("font-medium", t.cls)}>{t.label}</div>
              <div className="mt-1 grid grid-cols-3 gap-3 text-sm">
                <Stat label="Total" value={total} />
                <Stat label="Delivered" value={Number(data.delivered ?? 0)} />
                <Stat label="Cancelled" value={Number(data.cancelled ?? 0)} />
              </div>
              <div className="text-[11px] text-muted-foreground mt-2">
                Checked {ago(data.last_checked_at)}
                {data.stale ? " • showing cached data" : ""}
              </div>
            </div>
          </div>

          {data.couriers?.length > 0 && (
            <div className="border border-border rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50 text-[11px] uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="text-left font-medium px-3 py-2">Courier</th>
                    <th className="text-right font-medium px-3 py-2">Total</th>
                    <th className="text-right font-medium px-3 py-2">Delivered</th>
                    <th className="text-right font-medium px-3 py-2">Cancelled</th>
                  </tr>
                </thead>
                <tbody>
                  {data.couriers.map((c) => (
                    <tr key={c.name} className="border-t border-border">
                      <td className="px-3 py-2 capitalize">{c.name}</td>
                      <td className="px-3 py-2 text-right">{c.total}</td>
                      <td className="px-3 py-2 text-right text-emerald-700">{c.delivered}</td>
                      <td className="px-3 py-2 text-right text-rose-700">{c.cancelled}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="font-display text-lg leading-tight">{value}</div>
    </div>
  );
}
