import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { OptimizedImage } from "@/components/site/OptimizedImage";
import { siteContentOptions } from "@/lib/queries";
import { activeMenuTreeOptions } from "@/lib/menu-categories";

type Cat = { name: string; img: string; target: string | null };

export function CategoriesSection() {
  const { data: content } = useQuery(siteContentOptions());
  const { data: menuTree } = useQuery(activeMenuTreeOptions());

  // Prefer admin-overridden category_N_* content when provided; otherwise
  // derive from the real menu_categories (panjabi/koti/paijama/shirt).
  const overrides: (Cat | null)[] = [1, 2, 3, 4].map((n) => {
    const img = content?.[`category_${n}_image`]?.trim();
    const label = content?.[`category_${n}_label`]?.trim();
    const target = content?.[`category_${n}_target`]?.trim();
    if (img || label) {
      return { name: label || "", img: img || "", target: target || null };
    }
    return null;
  });

  const fromMenu: Cat[] = (menuTree ?? []).slice(0, 4).map((c) => ({
    name: c.label,
    img: (c as any).icon || "",
    target: c.slug,
  }));

  const categories: Cat[] = overrides.map((o, i) => o ?? fromMenu[i]).filter(Boolean) as Cat[];

  const kicker = content?.categories_kicker?.trim() || "Our Collection";
  const heading = content?.categories_heading?.trim() || "Shop by category";

  if (categories.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-10 md:py-20">
        <div className="mb-6 md:mb-10 text-center md:text-left">
          <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-gold">
            {kicker}
          </span>
          <h2 className="font-display text-[1.4rem] md:text-3xl text-foreground mt-2 md:mt-3 leading-[1.15]">
            {heading}
          </h2>
          <div className="mt-4 md:mt-5 mx-auto md:mx-0 h-px w-16 bg-gold/60" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
          {categories.map((c, i) => (
            <CategoryCard key={i} {...c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ name, img, target }: Cat) {
  return (
    <Link
      to="/products"
      search={{ category: target, q: "" }}
      className="group block relative overflow-hidden rounded-lg md:rounded-xl border border-gold/25 hover:border-gold/60 transition-colors bg-card"
    >
      <div className="relative w-full aspect-[4/5] overflow-hidden">
        {img ? (
          <OptimizedImage
            src={img}
            alt={name}
            width={520}
            height={650}
            sizes="(min-width: 768px) 24vw, 50vw"
            className="w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
        ) : (
          <div className="w-full h-full bg-secondary" />
        )}
        {/* Editorial dark gradient for label legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-deep/85 via-emerald-deep/25 to-transparent" />
        {/* Gold hairline inner frame */}
        <div className="pointer-events-none absolute inset-2 md:inset-3 border border-gold/25 group-hover:border-gold/60 transition-colors" />

        <div className="absolute inset-x-0 bottom-0 p-4 md:p-6 text-center">
          <h3 className="font-display text-white text-lg md:text-2xl leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
            {name}
          </h3>
          <div className="mx-auto mt-2 h-px w-8 md:w-10 bg-gold/80 transition-all duration-300 group-hover:w-14 md:group-hover:w-20" />
          <span className="mt-2 inline-block text-[10px] md:text-[11px] uppercase tracking-[0.25em] text-white/85">
            Shop now
          </span>
        </div>
      </div>
    </Link>
  );
}
