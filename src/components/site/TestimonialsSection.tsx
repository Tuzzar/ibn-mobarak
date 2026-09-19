import { Star } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

type Review = { img: string; n: string; c: string };

const REVIEW_BASE =
  "https://vdbkannwrsekvrdwijrx.supabase.co/storage/v1/object/public/product-images/site/";


const defaultReviews: Review[] = [
  { img: `${REVIEW_BASE}review-1.jpg`, n: "Rakib H.", c: "Jatrabari, Dhaka" },
  { img: `${REVIEW_BASE}review-2.jpg`, n: "Imran S.", c: "Chattogram" },
  { img: `${REVIEW_BASE}review-3.jpg`, n: "Sadman A.", c: "Uttara, Dhaka" },
  { img: `${REVIEW_BASE}review-4.jpg`, n: "Tanvir R.", c: "Sylhet" },
  { img: `${REVIEW_BASE}review-5.jpg`, n: "Mahmud K.", c: "Mirpur, Dhaka" },
  { img: `${REVIEW_BASE}review-6.jpg`, n: "Nabil F.", c: "Bashundhara, Dhaka" },
];

function PhotoCard({ img, n, c }: { img: string; n: string; c: string }) {
  return (
    <figure className="shrink-0 w-[72vw] sm:w-[44vw] md:w-[30vw] lg:w-[22vw] max-w-[360px] group">
      <div className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-muted shadow-card">
        {/* editorial gold frame */}
        <div className="absolute inset-0 rounded-3xl ring-1 ring-gold/20 pointer-events-none z-10" />
        <img
          src={img}
          alt={`Customer review by ${n}`}
          loading="lazy"
          width={720}
          height={900}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-105"
        />
        {/* soft top vignette */}
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-emerald-deep/20 to-transparent pointer-events-none z-10" />
        {/* bottom gradient with review content */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-emerald-deep/90 via-emerald-deep/50 to-transparent p-5 pt-28 md:p-6 md:pt-32 z-10">
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 md:w-4 md:h-4 text-gold fill-gold" />
            ))}
          </div>
          <div className="font-display text-lg md:text-xl text-white leading-tight text-balance">
            {n}
          </div>
          <div className="text-[10px] md:text-[11px] uppercase tracking-[0.22em] text-white/85 mt-1">
            {c}
          </div>
        </div>
      </div>
    </figure>
  );
}

type TestimonialsSectionProps = {
  kicker?: string;
  title?: string;
  description?: string;
  items?: Review[];
};

export function TestimonialsSection({
  kicker = "Loved By Households",
  title = "Stories from our customers",
  description = "Real photos shared by our customers.",
  items,
}: TestimonialsSectionProps = {}) {
  const reviews = items && items.length > 0 ? items : defaultReviews;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const offsetRef = useRef(0);
  const singleWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const draggedRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const activePointerRef = useRef<number | null>(null);
  const axisRef = useRef<"none" | "x" | "y">("none");
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      singleWidthRef.current = track.scrollWidth / 2;
      setReady(true);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (trackRef.current) ro.observe(trackRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [reviews.length]);

  useEffect(() => {
    if (!ready) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      if (trackRef.current) trackRef.current.style.transform = "translate3d(0,0,0)";
      return;
    }
    const SPEED = 42;
    let last = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      if (!pausedRef.current && !draggingRef.current) {
        offsetRef.current -= SPEED * dt;
      }
      const w = singleWidthRef.current;
      if (w > 0) {
        if (offsetRef.current <= -w) offsetRef.current += w;
        else if (offsetRef.current > 0) offsetRef.current -= w;
      }
      const track = trackRef.current;
      if (track) track.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (activePointerRef.current === null || e.pointerId !== activePointerRef.current) return;
      const dx = e.clientX - dragStartXRef.current;
      const dy = e.clientY - dragStartYRef.current;
      if (axisRef.current === "none") {
        if (Math.abs(dx) > 6 || Math.abs(dy) > 6) {
          axisRef.current = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }
      }
      if (axisRef.current === "y") return;
      if (Math.abs(dx) > 4) draggedRef.current = true;
      offsetRef.current = dragStartOffsetRef.current + dx;
    };
    const onUp = (e: PointerEvent) => {
      if (activePointerRef.current === null || e.pointerId !== activePointerRef.current) return;
      activePointerRef.current = null;
      draggingRef.current = false;
      axisRef.current = "none";
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
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    activePointerRef.current = e.pointerId;
    draggingRef.current = true;
    draggedRef.current = false;
    axisRef.current = "none";
    dragStartXRef.current = e.clientX;
    dragStartYRef.current = e.clientY;
    dragStartOffsetRef.current = offsetRef.current;
  };

  const swallowIfDragged = (e: React.MouseEvent) => {
    if (draggedRef.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <section className="py-16 md:py-28 overflow-hidden">
      <div className="container mx-auto px-5 sm:px-6 lg:px-8 max-w-7xl">
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="gold-rule-lg" />
            <span className="text-[11px] md:text-xs uppercase tracking-[0.28em] text-gold font-medium">
              {kicker}
            </span>
            <span className="gold-rule-lg" />
          </div>
          <h2 className="font-display text-[1.85rem] md:text-4xl lg:text-5xl text-foreground leading-[1.12] text-balance">
            {title}
          </h2>
          <p className="text-muted-foreground mt-3 md:mt-4 text-[14px] md:text-base italic text-balance">
            {description}
          </p>
        </div>
      </div>

      {/* Auto-looping + draggable photo carousel */}
      <div
        className="relative overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          if (activePointerRef.current === null) pausedRef.current = false;
        }}
        onPointerDown={onPointerDown}
        onClickCapture={swallowIfDragged}
        onDragStart={(e) => e.preventDefault()}
        style={{ touchAction: "pan-y" }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-20 md:w-40 z-20 bg-gradient-to-r from-background to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-20 md:w-40 z-20 bg-gradient-to-l from-background to-transparent"
        />
        <div ref={trackRef} className="flex gap-4 md:gap-7 w-max will-change-transform px-4 md:px-6">
          {[...reviews, ...reviews].map((r, i) => (
            <PhotoCard key={`${r.n}-${i}`} {...r} />
          ))}
        </div>
      </div>
    </section>
  );
}
