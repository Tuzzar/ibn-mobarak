import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  Truck,
  ShieldCheck,
  Banknote,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ShoppingBag,
} from "lucide-react";

import { useQuery } from "@tanstack/react-query";
import { useCart, formatBDT } from "@/lib/cart";
import { placeOrder } from "@/lib/orders.functions";
import { siteContentOptions } from "@/lib/queries";
import { Spinner } from "@/components/site/Spinner";
import { useIncompleteOrderTracker } from "@/hooks/use-incomplete-order";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/checkout")({
  component: Checkout,
  head: () => ({
    meta: [
      { title: "অর্ডার নিশ্চিত করুন (Checkout) — Ibn Mobarak Art Gallery" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

const schema = z.object({
  customer_name: z.string().trim().min(2, "আপনার পুরো নাম লিখুন").max(100),
  customer_phone: z
    .string()
    .trim()
    .regex(/^01[3-9]\d{8}$/, "সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)"),
  district: z.string().trim().min(2, "আপনার জেলা নির্বাচন করুন"),
  address: z.string().trim().min(5, "বিস্তারিত ঠিকানা দিন (বাসা/রোড/এলাকা)").max(500),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

type DeliveryZone = "inside" | "outside";
const DELIVERY_FEES: Record<DeliveryZone, number> = { inside: 80, outside: 130 };

export const BD_DISTRICTS = [
  "ঢাকা (Dhaka)", "চট্টগ্রাম (Chattogram)", "সিলেট (Sylhet)", "রাজশাহী (Rajshahi)",
  "খুলনা (Khulna)", "বরিশাল (Barishal)", "রংপুর (Rangpur)", "ময়মনসিংহ (Mymensingh)",
  "কুমিল্লা (Cumilla)", "গাজীপুর (Gazipur)", "নারায়ণগঞ্জ (Narayanganj)", "বগুড়া (Bogura)",
  "কক্সবাজার (Cox's Bazar)", "ফেনী (Feni)", "ব্রাহ্মণবাড়িয়া (Brahmanbaria)", "নোয়াখালী (Noakhali)",
  "চাঁদপুর (Chandpur)", "লক্ষ্মীপুর (Lakshmipur)", "নরসিংদী (Narsingdi)", "মানিকগঞ্জ (Manikganj)",
  "মুন্সীগঞ্জ (Munshiganj)", "টাঙ্গাইল (Tangail)", "কিশোরগঞ্জ (Kishoreganj)", "ফরিদপুর (Faridpur)",
  "মাদারীপুর (Madaripur)", "শরীয়তপুর (Shariatpur)", "গোপালগঞ্জ (Gopalganj)", "রাজবাড়ী (Rajbari)",
  "পাবনা (Pabna)", "সিরাজগঞ্জ (Sirajganj)", "নাটোর (Natore)", "নওগাঁ (Naogaon)",
  "চাঁপাইনবাবগঞ্জ (Chapai Nawabganj)", "জয়পুরহাট (Joypurhat)", "যশোর (Jashore)", "সাতক্ষীরা (Satkhira)",
  "কুষ্টিয়া (Kushtia)", "ঝিনাইদহ (Jhenaidah)", "চুয়াডাঙ্গা (Chuadanga)", "মেহেরপুর (Meherpur)",
  "বাগেরহাট (Bagerhat)", "মাগুরা (Magura)", "নড়াইল (Narail)", "পটুয়াখালী (Patuakhali)",
  "পিরোজপুর (Pirojpur)", "ভোলা (Bhola)", "বরগুনা (Barguna)", "ঝালকাঠি (Jhalakathi)",
  "দিনাজপুর (Dinajpur)", "ঠাকুরগাঁও (Thakurgaon)", "পঞ্চগড় (Panchagarh)", "নীলফামারী (Nilphamari)",
  "গাইবান্ধা (Gaibandha)", "কুড়িগ্রাম (Kurigram)", "লালমনিরহাট (Lalmonirhat)", "হবিগঞ্জ (Habiganj)",
  "মৌলভীবাজার (Moulvibazar)", "সুনামগঞ্জ (Sunamganj)", "নেত্রকোণা (Netrokona)", "জামালপুর (Jamalpur)",
  "শেরপুর (Sherpur)"
];

function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: content } = useQuery(siteContentOptions());
  const navigate = useNavigate();
  const placeOrderFn = useServerFn(placeOrder);
  const [submitting, setSubmitting] = useState(false);
  const [zone, setZone] = useState<DeliveryZone>("inside");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [form, setForm] = useState({
    customer_name: "",
    customer_phone: "",
    district: "ঢাকা (Dhaka)",
    address: "",
    notes: "",
  });

  const deliveryFee = DELIVERY_FEES[zone];
  const total = subtotal + deliveryFee;

  const handleDistrictChange = (selected: string) => {
    const isDhaka = selected.includes("ঢাকা") || selected.includes("Dhaka");
    setForm({ ...form, district: selected });
    setZone(isDhaka ? "inside" : "outside");
  };

  const fullDeliveryAddress = `${form.district ? form.district + ", " : ""}${form.address}`;

  const { markConverted } = useIncompleteOrderTracker({
    customer_name: form.customer_name,
    customer_phone: form.customer_phone,
    address: fullDeliveryAddress,
    city: zone === "inside" ? "Inside Dhaka" : "Outside Dhaka",
    notes: form.notes,
    items: items.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      price: i.price,
      unit: i.unit,
    })),
    subtotal,
    delivery_fee: deliveryFee,
    total,
    source: "checkout",
  });

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 sm:px-6 py-20 text-center max-w-lg">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8 text-gold" />
        </div>
        <span className="block text-[11px] uppercase tracking-[0.32em] text-gold mb-2 font-semibold">চেকআউট</span>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "'Tiro Bangla', serif" }}>
          আপনার কার্ট এখনো খালি
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          অর্ডার করার জন্য অনুগ্রহ করে শপ থেকে পছন্দের আর্ট সামগ্রী বা ক্যালিগ্রাফি কার্টে যোগ করুন।
        </p>
        <Link
          to="/products"
          className="mt-6 inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-full text-xs sm:text-sm font-semibold hover:bg-gold hover:text-gold-foreground transition-colors shadow-md"
        >
          কালেকশন দেখুন
        </Link>
      </div>
    );
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    let orderId: string;
    let confirmedTotal: number;
    try {
      const order = await placeOrderFn({
        data: {
          customer_name: parsed.data.customer_name,
          customer_phone: parsed.data.customer_phone,
          customer_email: "",
          address: `${parsed.data.district}, ${parsed.data.address}`,
          city: zone === "inside" ? "Inside Dhaka" : "Outside Dhaka",
          notes: parsed.data.notes || "",
          items: items.map((item) => ({ id: item.id, quantity: item.quantity })),
          delivery_fee: deliveryFee,
        },
      });
      orderId = order.orderId;
      confirmedTotal = order.total;
    } catch (error) {
      setSubmitting(false);
      toast.error(error instanceof Error ? error.message : "অর্ডার প্লেস করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
      return;
    }
    setSubmitting(false);
    markConverted(orderId);
    try {
      const recent = JSON.parse(localStorage.getItem("recent_orders") || "[]");
      recent.unshift({
        id: orderId,
        total: confirmedTotal,
        created_at: new Date().toISOString(),
        customer_name: parsed.data.customer_name,
        customer_phone: parsed.data.customer_phone,
      });
      localStorage.setItem("recent_orders", JSON.stringify(recent.slice(0, 20)));
    } catch {}
    clear();
    toast.success("অর্ডার সফলভাবে সম্পন্ন হয়েছে! শীঘ্রই কনফার্মেশন কল দেওয়া হবে।");
    navigate({ to: "/order-success", search: { id: orderId } });
  };

  return (
    <div className="w-full mx-auto px-4 sm:px-6 max-w-6xl py-6 sm:py-10 md:py-14 pb-16 overflow-x-hidden box-border">
      {/* Top Breadcrumb & Header */}
      <div className="mb-5 sm:mb-8">
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>কার্টে ফিরে যান</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1.5">
          <div>
            <span className="block text-[10px] uppercase tracking-[0.24em] text-gold font-semibold">
              নিরাপদ চেকআউট
            </span>
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground"
              style={{ fontFamily: "'Tiro Bangla', serif" }}
            >
              অর্ডার সম্পন্ন করুন
            </h1>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1 rounded-full w-fit">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{content?.checkout_badge_cod_text || "ক্যাশ অন ডেলিভারি (হোম ডেলিভারি)"}</span>
          </span>
        </div>
      </div>

      {/* MOBILE ONLY: Collapsible Order Summary Accordion at Top */}
      <div className="lg:hidden mb-5 rounded-2xl border border-gold/30 bg-section-a/60 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
          className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-foreground bg-section-a/80 hover:bg-section-a transition-colors"
        >
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-gold" />
            <span>অর্ডার সংক্ষেপ ({items.length}টি পণ্য)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary text-sm">{formatBDT(total)}</span>
            {mobileSummaryOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
        </button>

        {mobileSummaryOpen && (
          <div className="p-3.5 border-t border-border/60 bg-background/80 space-y-3 animate-in slide-in-from-top-2 duration-200">
            <ul className="divide-y divide-border/50 max-h-56 overflow-y-auto pr-1 text-xs">
              {items.map((i) => (
                <li key={i.id} className="py-2 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {i.image_url ? (
                      <img
                        src={i.image_url}
                        alt={i.name}
                        className="w-9 h-9 rounded-lg object-cover shrink-0 border border-border/60"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 truncate">
                      <p className="font-medium text-foreground truncate">{i.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {i.quantity} × {formatBDT(i.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-foreground shrink-0">
                    {formatBDT(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="pt-2 border-t border-border/60 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>সাবটোটাল</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>ডেলিভারি চার্জ ({zone === "inside" ? "ঢাকা সিটি" : "ঢাকার বাইরে"})</span>
                <span>{formatBDT(deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t border-border/40">
                <span>সর্বমোট পরিশোধযোগ্য</span>
                <span className="text-primary">{formatBDT(total)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={onSubmit} className="grid lg:grid-cols-12 gap-6 lg:gap-10">
        {/* Left Form Column */}
        <div className="lg:col-span-7 space-y-5 min-w-0">
          {/* 1. Address Section */}
          <div className="bg-card border border-border/80 rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-sm overflow-hidden">
            <h2
              className="text-lg sm:text-xl font-bold text-primary flex items-center gap-2 mb-4 sm:mb-6"
              style={{ fontFamily: "'Tiro Bangla', serif" }}
            >
              <Truck className="w-5 h-5 text-gold" />
              ডেলিভারি তথ্য
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field
                label="আপনার পুরো নাম"
                placeholder="যেমন: মোহাম্মদ আব্দুল্লাহ"
                value={form.customer_name}
                onChange={(v) => setForm({ ...form, customer_name: v })}
                required
              />

              <Field
                label="১১ ডিজিটের মোবাইল নম্বর"
                placeholder="01XXXXXXXXX"
                value={form.customer_phone}
                onChange={(v) => setForm({ ...form, customer_phone: v })}
                required
                type="tel"
              />

              {/* District Dropdown */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5 font-semibold">
                  জেলা নির্বাচন করুন <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <select
                    value={form.district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full max-w-full h-11 sm:h-12 px-3.5 pr-9 rounded-xl border border-input bg-background text-foreground text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold focus:border-gold transition-colors appearance-none cursor-pointer box-border"
                  >
                    {BD_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Delivery Zone Radio Cards */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5 font-semibold">
                  ডেলিভারি এলাকা <span className="text-destructive">*</span>
                </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {([
                    { id: "inside", label: "ঢাকা সিটির ভেতরে", fee: 80, time: "২-৩ দিন" },
                    { id: "outside", label: "ঢাকার বাইরে (সারাদেশ)", fee: 130, time: "৩-৫ দিন" },
                  ] as const).map((opt) => {
                    const active = zone === opt.id;
                    return (
                      <label
                        key={opt.id}
                        className={cn(
                          "flex items-center justify-between gap-2 px-3 py-3 border rounded-xl cursor-pointer transition active:scale-[0.99] overflow-hidden",
                          active
                            ? "border-gold bg-primary/5 ring-1 ring-inset ring-gold shadow-sm"
                            : "border-input bg-background hover:border-gold/50",
                        )}
                      >
                        <span className="flex items-center gap-2 min-w-0 flex-1">
                          <span
                            className={cn(
                              "w-4 h-4 shrink-0 rounded-full border flex items-center justify-center",
                              active ? "border-gold" : "border-muted-foreground/40",
                            )}
                          >
                            {active && <span className="w-2 h-2 rounded-full bg-gold" />}
                          </span>
                          <span className="flex flex-col min-w-0">
                            <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                              {opt.label}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              সময়সীমা: {opt.time}
                            </span>
                          </span>
                        </span>
                        <span className="text-xs font-bold text-primary shrink-0 whitespace-nowrap">
                          {formatBDT(opt.fee)}
                        </span>
                        <input
                          type="radio"
                          name="zone"
                          value={opt.id}
                          checked={active}
                          onChange={() => setZone(opt.id)}
                          className="sr-only"
                        />
                      </label>
                    );
                  })}
                </div>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1.5 pl-0.5">
                  * ১ কেজি পর্যন্ত ফিক্সড চার্জ, পরবর্তী প্রতি অতিরিক্ত কেজিতে ৳২০ যোগ হবে
                </p>
              </div>

              {/* Detailed Address */}
              <div className="sm:col-span-2">
                <Field
                  label="বিস্তারিত ঠিকানা (বাসা/রোড/এলাকা/উপজেলা)"
                  placeholder="যেমন: বাড়ি নং ১২, রোড ৪, সেক্টর ৭, উত্তরা, ঢাকা"
                  value={form.address}
                  onChange={(v) => setForm({ ...form, address: v })}
                  required
                />
              </div>

              {/* Order Notes */}
              <div className="sm:col-span-2">
                <label className="block text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5 font-semibold">
                  বিশেষ নির্দেশনা (অপশনাল)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="প্যাকেজিং বা ডেলিভারি নিয়ে কোনো বিশেষ নির্দেশনা থাকলে লিখুন..."
                  rows={2}
                  className="w-full max-w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold focus:border-gold transition-colors text-base sm:text-sm placeholder:text-muted-foreground/60 box-border"
                />
              </div>
            </div>
          </div>

          {/* 2. ORDER NOW BUTTON — RIGHT AFTER ADDRESS SECTION (AS REQUESTED) */}
          <div className="bg-card border border-gold/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-md overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-1 mb-3 text-xs sm:text-sm pb-2.5 border-b border-border/50">
              <span className="text-muted-foreground">মোট পরিশোধযোগ্য মূল্য:</span>
              <span className="text-base sm:text-xl font-bold text-primary whitespace-nowrap">{formatBDT(total)}</span>
            </div>

            <button
              disabled={submitting}
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground py-3.5 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-bold text-[13px] sm:text-base shadow-lg transition-all active:scale-[0.99] cursor-pointer disabled:opacity-50"
            >
              {submitting && <Spinner className="w-4 h-4" />}
              <span className="truncate">{submitting ? "অর্ডার পাঠানো হচ্ছে…" : `অর্ডার নিশ্চিত করুন — ${formatBDT(total)}`}</span>
            </button>

            <p className="text-center text-[11px] sm:text-xs text-muted-foreground mt-2.5" style={{ fontFamily: "'Tiro Bangla', serif" }}>
              🎉 কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই · সম্পূর্ণ ক্যাশ অন ডেলিভারি
            </p>
          </div>

          {/* 3. SLOGANS / TRUST GUARANTEES — AFTER THE ORDER BUTTON (AS REQUESTED) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
            <div className="p-3 sm:p-3.5 rounded-xl bg-section-a/60 border border-border/70 flex items-center gap-2.5">
              <Banknote className="w-5 h-5 text-gold shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-foreground">ক্যাশ অন ডেলিভারি</p>
                <p className="text-[11px] text-muted-foreground">পণ্য পেয়ে মূল্য পরিশোধ</p>
              </div>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-section-a/60 border border-border/70 flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-gold shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-foreground">{content?.checkout_perk_1_title || "১০০% আসল পণ্য"}</p>
                <p className="text-[11px] text-muted-foreground">{content?.checkout_perk_1_desc || "যাচাইকৃত কোয়ালিটি"}</p>
              </div>
            </div>
            <div className="p-3 sm:p-3.5 rounded-xl bg-section-a/60 border border-border/70 flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-gold shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-foreground">{content?.checkout_perk_2_title || "নিরাপদ ডেলিভারি"}</p>
                <p className="text-[11px] text-muted-foreground">{content?.checkout_perk_2_desc || "বাবল-র‍্যাপ প্রোটেকশন"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Desktop Order Summary Column */}
        <div className="lg:col-span-5 min-w-0">
          <aside className="bg-card p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gold/40 shadow-sm lg:sticky lg:top-24 overflow-hidden">
            <span className="block text-[10px] uppercase tracking-[0.24em] text-gold mb-1 font-semibold">
              অর্ডার বিবরণী
            </span>
            <h2
              className="text-xl sm:text-2xl font-bold text-foreground"
              style={{ fontFamily: "'Tiro Bangla', serif" }}
            >
              নির্বাচিত পণ্যসমূহ
            </h2>
            <div className="mt-2.5 h-px w-10 bg-gold/60" />

            <ul className="mt-4 space-y-3 max-h-72 overflow-y-auto pr-1 divide-y divide-border/40">
              {items.map((i) => (
                <li key={i.id} className="pt-2.5 first:pt-0 flex justify-between items-center gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {i.image_url ? (
                      <img
                        src={i.image_url}
                        alt={i.name}
                        className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg object-cover shrink-0 border border-border/60"
                      />
                    ) : (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <ShoppingBag className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate text-[11px] sm:text-sm">{i.name}</p>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                        {i.quantity} × {formatBDT(i.price)}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-foreground shrink-0 text-right whitespace-nowrap text-[11px] sm:text-sm">
                    {formatBDT(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="border-t border-border my-4" />
            <dl className="space-y-2 text-xs sm:text-sm">
              <div className="flex justify-between gap-2">
                <dt className="text-muted-foreground">সাবটোটাল</dt>
                <dd className="font-medium whitespace-nowrap">{formatBDT(subtotal)}</dd>
              </div>
              <div className="flex flex-wrap justify-between items-center gap-1">
                <dt className="text-muted-foreground">
                  ডেলিভারি চার্জ ({zone === "inside" ? "ঢাকা সিটি" : "ঢাকার বাইরে"})
                </dt>
                <dd className="font-medium whitespace-nowrap">{formatBDT(deliveryFee)}</dd>
              </div>
            </dl>

            <div className="border-t border-gold/30 my-4" />
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-display text-sm sm:text-lg text-foreground">সর্বমোট মূল্য</span>
              <span className="text-base sm:text-2xl font-bold text-primary whitespace-nowrap">
                {formatBDT(total)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              * কোনো অগ্রিম পেমেন্টের প্রয়োজন নেই, ডেলিভারির সময় মূল্য পরিশোধ করবেন।
            </p>

            {/* Desktop Order Button */}
            <button
              disabled={submitting}
              type="submit"
              className="hidden lg:inline-flex mt-5 w-full items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-gold hover:text-gold-foreground py-3.5 rounded-full font-bold text-sm disabled:opacity-50 transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              {submitting && <Spinner className="w-4 h-4" />}
              {submitting ? "অর্ডার পাঠানো হচ্ছে…" : `অর্ডার নিশ্চিত করুন — ${formatBDT(total)}`}
            </button>
          </aside>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.18em] text-gold mb-1.5 font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full max-w-full h-11 sm:h-12 px-3.5 rounded-xl border border-input bg-background text-foreground text-base sm:text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-gold focus:border-gold transition-colors box-border"
      />
    </div>
  );
}
