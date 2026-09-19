import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { OptimizedImage } from "@/components/site/OptimizedImage";

export type HeroSlide = {
  image: string;
  title1?: string;
  title2?: string;
  description?: string;
  featuredTitle?: string;
  featuredDescription?: string;
  categoryName?: string;
  href?: string;
};

type Props = {
  slides: HeroSlide[];
  onActiveChange?: (index: number) => void;
  autoPlayMs?: number;
  transitionMs?: number;
  ctaLabel?: string;
  ctaHref?: string;
  ctaHidden?: boolean;
  aspectRatioClass?: string;
};

const RESUME_DELAY = 3000;
const SWIPE_THRESHOLD = 40;

export function HeroSlider({
  slides,
  onActiveChange,
  autoPlayMs = 3000,
  transitionMs = 500,
  ctaLabel,
  ctaHref,
  ctaHidden = false,
  aspectRatioClass,
}: Props) {
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragDx, setDragDx] = useState(0);
  const dragStartX = useRef<number | null>(null);
  const dragStartY = useRef<number | null>(null);
  const activePointerId = useRef<number | null>(null);
  const draggedRef = useRef(false);
  const axisLockRef = useRef<"none" | "x" | "y">("none");
  const resumeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(0);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  useEffect(() => {
    if (count <= 1 || paused) return;
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) return;
    }
    const id = setInterval(() => {
      setActive((i) => (i + 1) % count);
    }, autoPlayMs);
    return () => clearInterval(id);
  }, [count, paused, autoPlayMs]);

  const scheduleResume = useCallback(() => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
    resumeTimer.current = setTimeout(() => setPaused(false), RESUME_DELAY);
  }, []);

  const goTo = useCallback(
    (i: number) => {
      if (count === 0) return;
      setActive(((i % count) + count) % count);
    },
    [count],
  );

  const resetDragState = useCallback(() => {
    dragStartX.current = null;
    dragStartY.current = null;
    activePointerId.current = null;
    axisLockRef.current = "none";
    setDragDx(0);
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (count <= 1) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // If a previous drag is somehow still tracked, clear it first.
    if (activePointerId.current !== null) resetDragState();
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    activePointerId.current = e.pointerId;
    draggedRef.current = false;
    axisLockRef.current = "none";
    setPaused(true);
  };

  // Window-level move/up listeners so events aren't lost when the pointer
  // moves over child elements (Links, overlays) that intercept events, or
  // when React re-renders during the drag.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (activePointerId.current === null || e.pointerId !== activePointerId.current) return;
      if (dragStartX.current == null || dragStartY.current == null) return;
      const dx = e.clientX - dragStartX.current;
      const dy = e.clientY - dragStartY.current;
      if (axisLockRef.current === "none") {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          axisLockRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }
      }
      if (axisLockRef.current === "y") return; // let the page scroll vertically
      if (Math.abs(dx) > 6) draggedRef.current = true;
      setDragDx(dx);
    };
    const onUp = (e: PointerEvent) => {
      if (activePointerId.current === null || e.pointerId !== activePointerId.current) return;
      const dx =
        dragStartX.current != null && axisLockRef.current !== "y"
          ? e.clientX - dragStartX.current
          : 0;
      resetDragState();
      if (Math.abs(dx) > SWIPE_THRESHOLD) {
        goTo(activeRef.current + (dx < 0 ? 1 : -1));
      }
      scheduleResume();
      // Keep draggedRef true briefly to swallow the click that follows.
      setTimeout(() => {
        draggedRef.current = false;
      }, 0);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("pointercancel", onUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [goTo, resetDragState, scheduleResume]);

  useEffect(() => () => {
    if (resumeTimer.current) clearTimeout(resumeTimer.current);
  }, []);

  if (count === 0) return null;
  const current = slides[active];
  const buttonLabel = (ctaLabel && ctaLabel.trim()) || "Shop Now";
  const buttonHref = (ctaHref && ctaHref.trim()) || "/products";

  const cancelIfDragged = (e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const hasAnyFeaturedText = slides.some((s) => Boolean(s.featuredTitle && s.featuredTitle.trim()));

  return (
    <div
      className="relative animate-in fade-in zoom-in-95 duration-700 touch-pan-y select-none group"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        if (activePointerId.current === null) setPaused(false);
      }}
      onPointerDownCapture={onPointerDown}
      onDragStart={(e) => e.preventDefault()}
      style={{ touchAction: "pan-y" }}
    >
      <div
        className={`${aspectRatioClass || "aspect-[1024/409]"} w-full overflow-hidden relative touch-pan-y select-none cursor-grab active:cursor-grabbing bg-muted/20`}
      >
        {slides.map((s, i) => {
          const img = (
            <OptimizedImage
              src={s.image}
              alt={s.title2 || s.featuredTitle || "Ibn Mobarak Art Gallery Banner"}
              width={1024}
              height={409}
              priority={i === 0}
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="w-full h-full object-cover object-center pointer-events-none"
            />
          );
          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                opacity: i === active ? 1 : 0,
                transform:
                  i === active && dragDx ? `translateX(${dragDx}px)` : undefined,
                transition: dragDx
                  ? "none"
                  : `opacity ${transitionMs}ms ease-out, transform ${transitionMs}ms ease-out`,
                pointerEvents: i === active ? "auto" : "none",
              }}
              aria-hidden={i !== active}
            >
              <Link
                to={s.href || "/products"}
                search={s.categoryName ? { category: s.categoryName, q: "" } : undefined}
                onClick={cancelIfDragged}
                className="block w-full h-full cursor-pointer"
                draggable={false}
              >
                {img}
              </Link>
            </div>
          );
        })}
      </div>

      {/* Editorial overlay — only rendered if slides have explicit text */}
      {hasAnyFeaturedText && (
        <>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-transparent pointer-events-none" />
          <div className="absolute inset-0 flex items-end justify-start pointer-events-none">
            {slides.map((s, i) => {
              const isActive = i === active;
              if (!s.featuredTitle) return null;
              return (
                <div
                  key={i}
                  className={`${i === 0 ? "" : "absolute inset-0 flex items-end justify-start"} pl-5 pr-5 pb-10 sm:px-0 sm:pl-10 md:pl-16 lg:pl-24 sm:pb-14 md:pb-16 lg:pb-20`}
                  style={{
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? "translateY(0)" : "translateY(8px)",
                    transition: `opacity ${transitionMs}ms ease-out, transform ${transitionMs}ms ease-out`,
                    pointerEvents: "none",
                  }}
                  aria-hidden={!isActive}
                >
                  <div className="w-full text-left sm:max-w-md md:max-w-xl lg:max-w-2xl">
                    {s.categoryName && (
                      <span className="inline-block text-[10px] md:text-[11px] uppercase tracking-[0.32em] text-accent mb-3 md:mb-5 font-semibold">
                        {s.categoryName}
                      </span>
                    )}
                    <h2 className="font-display text-white leading-[1.05] text-[30px] xs:text-[34px] sm:text-5xl md:text-6xl lg:text-[4.5rem] break-words drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)]">
                      {s.featuredTitle}
                    </h2>
                    <div className="mt-4 md:mt-5 h-px w-14 md:w-20 bg-accent" />
                    {s.featuredDescription && (
                      <p className="hidden sm:block mt-4 md:mt-5 text-white/90 text-sm md:text-base leading-relaxed max-w-md drop-shadow-[0_1px_6px_rgba(0,0,0,0.4)]">
                        {s.featuredDescription}
                      </p>
                    )}

                    <div className="mt-5 md:mt-8 flex items-center gap-4 md:gap-6 justify-start">
                      {!ctaHidden && (
                        <a
                          href={buttonHref}
                          onClick={cancelIfDragged}
                          draggable={false}
                          style={{ pointerEvents: isActive ? "auto" : "none" }}
                          className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-6 md:px-7 py-2.5 md:py-3 text-[12px] md:text-sm font-semibold uppercase tracking-[0.14em] rounded-full hover:bg-accent/90 hover:-translate-y-0.5 transition-all shadow-[0_8px_30px_-6px_rgba(0,0,0,0.55)]"
                        >
                          {buttonLabel} <ArrowRight className="w-4 h-4" />
                        </a>
                      )}
                      <Link
                        to="/products"
                        search={{ q: "" }}
                        onClick={cancelIfDragged}
                        draggable={false}
                        style={{ pointerEvents: isActive ? "auto" : "none" }}
                        className="hidden sm:inline-flex text-[11px] uppercase tracking-[0.24em] text-white/85 hover:text-gold transition-colors border-b border-transparent hover:border-gold pb-0.5"
                      >
                        View all
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Navigation Arrows */}
      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous slide"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goTo(active - 1);
              setPaused(true);
              scheduleResume();
            }}
            className="absolute left-2.5 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-border/60 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
          <button
            type="button"
            aria-label="Next slide"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goTo(active + 1);
              setPaused(true);
              scheduleResume();
            }}
            className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/80 hover:bg-background text-foreground shadow-md backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 border border-border/60 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
          </button>
        </>
      )}

      {/* Slide indicators (dots) */}
      {count > 1 && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-3 sm:bottom-4 flex items-center gap-1.5 z-20 bg-background/60 backdrop-blur-xs px-2.5 py-1 rounded-full border border-border/40 shadow-xs">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                goTo(i);
                setPaused(true);
                scheduleResume();
              }}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                i === active ? "w-6 bg-primary" : "w-2 bg-foreground/30 hover:bg-foreground/60"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
