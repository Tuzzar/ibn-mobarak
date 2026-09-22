import { Link } from "@tanstack/react-router";
import { Store, ArrowRight, Palette } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { siteContentOptions } from "@/lib/queries";

type Props = {
  variant?: "default" | "compact";
  className?: string;
};

export function VisitMainSiteCard({ variant = "default", className = "" }: Props) {
  const { data: c } = useQuery(siteContentOptions());
  const eyebrow = c?.landing_visit_eyebrow?.trim() || "Explore More";
  const headline = c?.landing_visit_headline?.trim() || "আমাদের মেইন সাইট থেকে ঘুরে আসুন";
  const description =
    c?.landing_visit_description?.trim() ||
    "আরো অনেক আর্ট সামগ্রী, অফার ও বিশেষ কালেকশন দেখতে আমাদের মূল ওয়েবসাইট ভিজিট করুন। একই বিশ্বাস, একই মান — পুরো রেঞ্জ এক জায়গায়।";
  const button = c?.landing_visit_button?.trim() || "মেইন সাইটে যান";

  if (variant === "compact") {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-accent/5 p-5 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-sm text-foreground leading-tight">
              আরো পণ্য দেখতে চান?
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {headline}
            </div>
          </div>
          <Link
            to="/"
            className="shrink-0 inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition"
          >
            Visit <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className={`max-w-3xl mx-auto px-4 ${className}`}>
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-background to-accent/10 p-6 md:p-10 text-center shadow-sm">
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-accent/10 blur-2xl pointer-events-none" />

        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest">
            <Palette className="w-3.5 h-3.5" /> {eyebrow}
          </div>
          <h3 className="font-display text-2xl md:text-3xl mt-4 text-foreground">
            {headline}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-xl mx-auto whitespace-pre-line">
            {description}
          </p>

          <Link
            to="/"
            className="mt-6 inline-flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition shadow-md"
          >
            <Store className="w-4 h-4" /> {button}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
