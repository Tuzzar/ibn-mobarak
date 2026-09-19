import { useEffect, useState } from "react";
import { Palette, Brush } from "lucide-react";
import { useBrandLogo } from "@/lib/brand";

/**
 * Modern Artistic Page-Load Screen for Ibn Mobarak Art Gallery.
 * Features:
 * - Dynamic color-ring orbital animation (representing watercolor & paint pigments)
 * - Glassmorphic artist medallion with breathing glow
 * - Gradient flow progress bar
 * - Smooth fade & scale transitions
 */
export function SiteLoader() {
  const brand = useBrandLogo();
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    setMounted(true);
    const start = performance.now();
    const MIN_MS = 900; // brief, satisfying loading moment

    const finish = () => {
      const elapsed = performance.now() - start;
      const wait = Math.max(0, MIN_MS - elapsed);
      window.setTimeout(() => setHidden(true), wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
      const safety = window.setTimeout(finish, 3000);
      return () => {
        window.removeEventListener("load", finish);
        window.clearTimeout(safety);
      };
    }
  }, []);

  useEffect(() => {
    if (!hidden) return;
    const t = window.setTimeout(() => setGone(true), 600);
    return () => window.clearTimeout(t);
  }, [hidden]);

  if (!mounted || gone) return null;

  return (
    <div
      aria-hidden={hidden}
      role="status"
      className="fixed inset-0 z-[999] flex items-center justify-center pointer-events-none select-none transition-all duration-500 ease-out overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at 50% 45%, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)",
        opacity: hidden ? 0 : 1,
        transform: "scale(1)",
      }}
    >
      {/* Background artistic ambient color blurs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] max-w-[80vw] bg-gradient-to-tr from-accent/15 via-gold/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none animate-pulse duration-3000" />

      <div className="relative flex flex-col items-center max-w-sm px-6 text-center z-10">
        {/* Animated Medallion Container */}
        <div className="relative w-32 h-32 sm:w-36 sm:h-36 mb-6 flex items-center justify-center">
          {/* Outer Multi-color Spinning Ring */}
          <div
            className="absolute inset-0 rounded-full p-[2.5px] loader-spin"
            style={{
              background:
                "conic-gradient(from 0deg, #ea580c, #f59e0b, #2563eb, #8b5cf6, #ea580c)",
              WebkitMask:
                "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2.5px))",
              mask:
                "radial-gradient(farthest-side, transparent calc(100% - 3px), #fff calc(100% - 2.5px))",
            }}
          />

          {/* Counter-spinning subtle glow ring */}
          <div
            className="absolute -inset-1.5 rounded-full opacity-40 blur-[3px] loader-reverse-spin"
            style={{
              background:
                "conic-gradient(from 180deg, #ea580c, #f59e0b, #2563eb, #8b5cf6, #ea580c)",
            }}
          />

          {/* Orbiting Pigment Dot 1 (Coral) */}
          <div className="absolute inset-0 loader-orbit-1">
            <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-accent shadow-[0_0_12px_rgba(234,88,12,0.8)]" />
          </div>

          {/* Orbiting Pigment Dot 2 (Royal Blue) */}
          <div className="absolute inset-0 loader-orbit-2">
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)]" />
          </div>

          {/* Central Floating Logo (Transparent from Admin / SVG) */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center p-2 loader-float">
            {/* Soft subtle radial ambient glow behind transparent logo */}
            <div className="absolute inset-1 rounded-full bg-white/85 blur-sm pointer-events-none" />
            <img
              src={brand.url || "/logo.svg"}
              alt="Ibn Mobarak Art Gallery"
              className="relative w-full h-full object-contain filter drop-shadow-[0_4px_14px_rgba(0,0,0,0.08)] select-none"
              draggable={false}
            />
          </div>
        </div>

        {/* Brand Typography */}
        <div className="flex flex-col items-center gap-1.5 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[11px] uppercase tracking-[0.28em] font-semibold text-accent">
              Art & Calligraphy
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Ibn Mobarak <span className="text-primary font-normal italic">Gallery</span>
          </h2>

          <p className="text-xs text-muted-foreground tracking-wide font-medium">
            শিল্প ও নান্দনিকতার নির্ভরযোগ্য ঠিকানা
          </p>
        </div>

        {/* Shimmering Art Progress Track */}
        <div className="relative w-44 sm:w-52 h-1.5 bg-slate-200/70 rounded-full overflow-hidden shadow-inner mb-3">
          <div
            className="absolute inset-y-0 left-0 w-1/2 rounded-full loader-shimmer"
            style={{
              background:
                "linear-gradient(90deg, #ea580c 0%, #f59e0b 50%, #2563eb 100%)",
            }}
          />
        </div>

        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/90 border border-slate-200/60 text-[11px] font-medium text-muted-foreground shadow-2xs">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
          <span>ক্যানভাস প্রস্তুত হচ্ছে...</span>
        </div>
      </div>

      <style>{`
        @keyframes loader-spin-kf {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes loader-rev-spin-kf {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes loader-orbit-1-kf {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes loader-orbit-2-kf {
          0% { transform: rotate(180deg); }
          100% { transform: rotate(540deg); }
        }
        @keyframes loader-shimmer-kf {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(120%); }
          100% { transform: translateX(250%); }
        }
        @keyframes loader-float-kf {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-3px) scale(1.02); }
        }

        .loader-spin {
          animation: loader-spin-kf 3s linear infinite;
        }
        .loader-reverse-spin {
          animation: loader-rev-spin-kf 4s linear infinite;
        }
        .loader-orbit-1 {
          animation: loader-orbit-1-kf 2.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .loader-orbit-2 {
          animation: loader-orbit-2-kf 3.4s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .loader-shimmer {
          animation: loader-shimmer-kf 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
        }
        .loader-float {
          animation: loader-float-kf 2.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
