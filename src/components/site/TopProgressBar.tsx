import { useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";

/**
 * Lightweight top progress bar shown during route transitions.
 * Subtle, premium, GPU-friendly (transform/opacity only).
 */
export function TopProgressBar() {
  const isLoading = useRouterState({
    select: (s) => s.status === "pending" || s.isLoading || s.isTransitioning,
  });

  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf: number;
    let timeout: ReturnType<typeof setTimeout>;
    if (isLoading) {
      setVisible(true);
      setProgress(8);
      let p = 8;
      const tick = () => {
        // ease toward 90%
        p += (90 - p) * 0.08;
        setProgress(p);
        raf = window.requestAnimationFrame(tick);
      };
      raf = window.requestAnimationFrame(tick);
    } else if (visible) {
      setProgress(100);
      timeout = setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 280);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (timeout) clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  return (
    <div
      aria-hidden
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] pointer-events-none"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 250ms ease-out" }}
    >
      <div
        className="h-full bg-gradient-to-r from-primary via-gold to-primary origin-left"
        style={{
          transform: `scaleX(${progress / 100})`,
          transition: "transform 200ms ease-out",
          boxShadow: "0 0 8px color-mix(in oklab, var(--primary) 50%, transparent)",
        }}
      />
    </div>
  );
}
