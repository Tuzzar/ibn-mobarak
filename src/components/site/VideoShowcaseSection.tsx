import { useState, useRef, useEffect, useMemo } from "react";
import { Play, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { siteContentOptions } from "@/lib/queries";
import { extractYouTubeId } from "@/routes/admin.site-content";

// ─── Fallback defaults (used when no admin value is set) ───
const FALLBACK_VIDEO_ID = "dQw4w9WgXcQ";
const FALLBACK_LABEL = "Inside The Studio";
const FALLBACK_HEADING = "See the craft come to life";
const FALLBACK_DESCRIPTION =
  "Watch how each Ibn Mobarak Art Gallery gift is designed, crafted, wrapped, and delivered with care across Bangladesh.";
// ───────────────────────────────────────────────────────────

export function VideoShowcaseSection() {
  const { data: content } = useQuery(siteContentOptions());

  const label = content?.video_section_label?.trim() || FALLBACK_LABEL;
  const heading = content?.video_section_heading?.trim() || FALLBACK_HEADING;
  const description =
    content?.video_section_description?.trim() || FALLBACK_DESCRIPTION;

  const videoId = useMemo(() => {
    const raw = content?.video_section_video_url?.trim();
    return (raw && extractYouTubeId(raw)) || FALLBACK_VIDEO_ID;
  }, [content?.video_section_video_url]);

  const iframeSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1`;

  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userClicked, setUserClicked] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  // Lazy-load: observe when section enters viewport
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handlePlay = () => {
    setUserClicked(true);
    setIsLoading(true);
  };

  return (
    <section ref={sectionRef} className="border-y border-border bg-section-b">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl py-10 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left — text */}
          <div className="order-1 lg:order-1">
            <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-gold">
              {label}
            </span>
            <h2 className="font-display text-[1.6rem] sm:text-[1.75rem] md:text-4xl lg:text-5xl text-primary-foreground mt-2 md:mt-3 leading-snug break-words">
              {heading}
            </h2>
            <p className="text-primary-foreground/75 mt-3 md:mt-4 text-[14px] md:text-base leading-relaxed max-w-md">
              {description}
            </p>
          </div>

          {/* Right — video */}
          <div className="order-2 lg:order-2">
            <div className="relative rounded-2xl overflow-hidden shadow-[var(--shadow-premium)] bg-card border border-border/60 group hover:shadow-[var(--shadow-card)] transition-shadow duration-500">
              <div className="aspect-video relative">
                {/* Thumbnail (shown before user clicks play) */}
                {!userClicked && (
                  <img
                    src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.src.includes("maxresdefault")) {
                        img.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
                      }
                    }}
                    alt="Video thumbnail"
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}

                {!userClicked && (
                  <button
                    onClick={handlePlay}
                    className="absolute inset-0 z-10 flex items-center justify-center bg-background/30 backdrop-blur-[1px] transition-opacity duration-300 group-hover:bg-background/20"
                    aria-label="Play video"
                  >
                    <span className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/90 text-primary-foreground flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play className="w-7 h-7 md:w-8 md:h-8 fill-current ml-1" />
                    </span>
                  </button>
                )}

                {isLoading && userClicked && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card animate-pulse">
                    <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
                    <span className="text-xs text-muted-foreground mt-3">Loading video…</span>
                  </div>
                )}

                {isVisible && userClicked && (
                  <>
                    <iframe
                      src={`${iframeSrc}&autoplay=1`}
                      title="Ibn Mobarak Art Gallery studio video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      loading="lazy"
                      className="absolute inset-0 w-full h-full border-0"
                      onLoad={() => setIsLoading(false)}
                    />
                    {/* Block clicks on YouTube branding / logo (bottom-right corner) */}
                    <div
                      className="absolute bottom-0 right-0 w-28 h-14 z-20"
                      aria-hidden="true"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
