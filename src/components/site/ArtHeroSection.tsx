import { HeroSlider } from "./HeroSlider";
import { ART_HERO_SLIDES } from "@/data/artCatalog";

export function ArtHeroSection() {
  return (
    <section className="container mx-auto px-4 sm:px-6 max-w-7xl pt-3 pb-6 sm:pb-8">
      <div className="rounded-2xl overflow-hidden shadow-sm border border-border/70 bg-card">
        <HeroSlider
          slides={ART_HERO_SLIDES}
          autoPlayMs={4500}
          ctaHidden={true}
        />
      </div>
    </section>
  );
}
