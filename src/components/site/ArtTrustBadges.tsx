import { Truck, BadgeCheck, ShieldCheck, Headphones } from "lucide-react";
import { TRUST_BADGES } from "@/data/artCatalog";

const ICONS: Record<string, any> = {
  Truck,
  BadgeCheck,
  ShieldCheck,
  Headphones,
};

export function ArtTrustBadges() {
  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl pb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 p-4 md:p-6 rounded-2xl bg-card border border-border/80 shadow-xs">
        {TRUST_BADGES.map((b, i) => {
          const IconComponent = ICONS[b.icon] || BadgeCheck;
          return (
            <div
              key={i}
              className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconComponent className="w-5 h-5 text-primary" strokeWidth={2} />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-xs md:text-sm text-foreground leading-tight">
                  {b.title}
                </h4>
                <p className="text-[11px] md:text-xs text-muted-foreground mt-0.5 leading-snug">
                  {b.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
