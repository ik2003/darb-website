"use client";

import { useEffect } from "react";
import { setLenis, setScrollRefresh } from "@/lib/scroll";

/* Lenis was a dependency of this project but was never initialised — see the
   note at the top of src/lib/scroll.ts, which was written in anticipation of
   exactly this. Mounting it here registers the instance with src/lib/scroll.ts, which every
   programmatic scroll in the app routes through, so the two never fight over
   window.scrollY.

   ScrollTrigger is driven from Lenis's own loop rather than the scroll event:
   without this the pinned hero scrub judders, because ScrollTrigger samples a
   scroll position that Lenis has already interpolated past. */
export default function SmoothScroll() {
  useEffect(() => {
    // Reduced motion keeps native scrolling: smoothing is itself motion.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let destroy = () => {};
    let cancelled = false;

    (async () => {
      const [{ default: Lenis }, { default: gsap }, { ScrollTrigger }] =
        await Promise.all([
          import("lenis"),
          import("gsap"),
          import("gsap/ScrollTrigger"),
        ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      /* smoothWheel only. Touch is left native: Lenis's touch smoothing fights
         the browser's own momentum on iOS and makes the fleet carousel's
         horizontal drag feel unpredictable.
         autoRaf: false ensures that Lenis only advances when ticked by GSAP,
         eliminating duplicate RAF loops and micro-judder. */
      const lenis = new Lenis({
        duration: 1.2,
        smoothWheel: true,
        autoRaf: false,
        wheelMultiplier: 0.95,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
      /* Hand the instance to the scroll helper. window.lenis is kept purely
         as a console handle for debugging; nothing in the app reads it. */
      setLenis(lenis);
      setScrollRefresh(() => ScrollTrigger.refresh());
      (window as unknown as { lenis?: unknown }).lenis = lenis;

      lenis.on("scroll", ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(500, 33);

      /* Load-bearing, not a nicety. When ScrollTrigger pins the hero it injects
         a spacer that makes the document ~6.5 viewports tall, but Lenis has
         already cached its scroll limit from the pre-pin height. Without this
         the limit stays at one viewport and the page physically cannot be
         scrolled past the hero — the pin becomes a trap. Measured: limit 1080
         vs the correct 5940. ScrollTrigger fires "refresh" on creation and on
         every resize, which is exactly when Lenis needs to re-measure. */
      const syncLimit = () => lenis.resize();
      ScrollTrigger.addEventListener("refresh", syncLimit);

      destroy = () => {
        ScrollTrigger.removeEventListener("refresh", syncLimit);
        gsap.ticker.remove(raf);
        lenis.destroy();
        setLenis(null);
        setScrollRefresh(null);
        delete (window as unknown as { lenis?: unknown }).lenis;
      };
    })();

    return () => {
      cancelled = true;
      destroy();
    };
  }, []);

  return null;
}
