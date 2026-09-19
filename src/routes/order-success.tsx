import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Package, Phone, Truck, ArrowRight, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { formatBDT } from "@/lib/cart";

export const Route = createFileRoute("/order-success")({
  validateSearch: z.object({ id: z.string().optional() }),
  component: OrderSuccess,
  head: () => ({
    meta: [
      { title: "Order Confirmed — Ibn Mobarak Art Gallery" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type RecentOrder = {
  id: string;
  total: number;
  created_at: string;
  customer_name?: string;
  customer_phone?: string;
};

function OrderSuccess() {
  const { id } = Route.useSearch();
  const [order, setOrder] = useState<RecentOrder | null>(null);

  useEffect(() => {
    if (!id) return;
    try {
      const recent: RecentOrder[] = JSON.parse(localStorage.getItem("recent_orders") || "[]");
      const found = recent.find((o) => o.id === id);
      if (found) setOrder(found);
    } catch {
      // ignore
    }
  }, [id]);

  // Fire Meta Pixel Purchase event once per order
  useEffect(() => {
    if (!id || !order) return;
    if (typeof window === "undefined") return;
    const fbq = (window as any).fbq as ((...a: any[]) => void) | undefined;
    if (typeof fbq !== "function") return;
    const flagKey = `purchase_fired_${id}`;
    try {
      if (sessionStorage.getItem(flagKey)) return;
      fbq("track", "Purchase", {
        value: Number(order.total) || 0,
        currency: "BDT",
      });
      sessionStorage.setItem(flagKey, "1");
    } catch {
      // ignore
    }
  }, [id, order]);


  const shortId = id ? id.slice(0, 8).toUpperCase() : "";

  const copyId = async () => {
    if (!id) return;
    try {
      await navigator.clipboard.writeText(id);
      toast.success("Order ID copied");
    } catch {
      toast.error("Could not copy");
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-2xl py-12 sm:py-20">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gold/15 ring-1 ring-gold/40 mb-6">
          <CheckCircle2 className="w-10 h-10 text-gold" strokeWidth={1.5} />
        </div>
        <span className="block text-[11px] uppercase tracking-[0.32em] text-gold mb-3">Order confirmed</span>
        <h1 className="font-display text-4xl sm:text-5xl text-foreground">
          ধন্যবাদ আপনাকে
        </h1>
        <div className="mt-4 mx-auto flex items-center justify-center gap-3">
          <span className="h-px w-10 bg-gold/60" />
          <span className="font-display text-sm md:text-base italic text-primary">শালীনতায় আভিজাত্য</span>
          <span className="h-px w-10 bg-gold/60" />
        </div>
        <p className="text-muted-foreground mt-4 max-w-md mx-auto">
          আপনার অর্ডার আমরা পেয়েছি — শীঘ্রই কল করে ডেলিভারি নিশ্চিত করবো।
        </p>
      </div>

      {id && (
        <div className="mt-10 bg-card border border-gold/40 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4 pb-5 border-b border-border">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                Order Reference
              </p>
              <p className="font-display text-2xl mt-1 text-primary">#{shortId}</p>
            </div>
            <button
              onClick={copyId}
              className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-border hover:border-gold hover:text-primary transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Copy ID
            </button>
          </div>

          {order && (
            <dl className="grid sm:grid-cols-2 gap-4 mt-5 text-sm">
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
                  Total
                </dt>
                <dd className="font-display text-xl text-primary mt-1">
                  {formatBDT(order.total)}
                </dd>
              </div>
              <div>
                <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
                  Placed on
                </dt>
                <dd className="mt-1">
                  {new Date(order.created_at).toLocaleString("en-GB", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </dd>
              </div>
              {order.customer_name && (
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
                    Name
                  </dt>
                  <dd className="mt-1">{order.customer_name}</dd>
                </div>
              )}
              {order.customer_phone && (
                <div>
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-gold">
                    Phone
                  </dt>
                  <dd className="mt-1">{order.customer_phone}</dd>
                </div>
              )}
            </dl>
          )}

          <div className="mt-7 pt-6 border-t border-border">
            <span className="block text-[11px] uppercase tracking-[0.22em] text-gold mb-2">Next steps</span>
            <h2 className="font-display text-lg mb-4 text-foreground">What happens next</h2>
            <ol className="space-y-4">
              <Step
                icon={<Phone className="w-4 h-4" />}
                title="আমরা কল করবো"
                desc="Our team will reach out within a few hours to verify your order."
              />
              <Step
                icon={<Package className="w-4 h-4" />}
                title="যত্ন সহকারে প্যাক"
                desc="Premium, wrapped with care and ready for dispatch."
              />
              <Step
                icon={<Truck className="w-4 h-4" />}
                title="ঘরে পৌঁছে যাবে"
                desc="Pay cash on delivery when your order arrives at your doorstep."
              />
            </ol>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/products"
          className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-sm font-medium hover:bg-gold hover:text-gold-foreground transition-colors w-full sm:w-auto"
        >
          Continue shopping <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/"
          className="inline-flex items-center justify-center border border-border hover:border-gold text-foreground px-6 py-3 rounded-full text-sm font-medium transition-colors w-full sm:w-auto"
        >
          Back to home
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground italic mt-8">
        Save your Order ID — you can reference it when we call.
      </p>
    </div>
  );
}

function Step({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex gap-3">
      <div className="w-8 h-8 rounded-full bg-gold/15 text-gold flex items-center justify-center shrink-0 ring-1 ring-gold/30">
        {icon}
      </div>
      <div>
        <p className="font-display text-base text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
    </li>
  );
}

