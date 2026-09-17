import type Lenis from "lenis";

/* THE single entry point for programmatic scrolling.
   Nothing outside this file may call scrollIntoView() or window.scrollTo() —
   a native smooth scroll and Lenis both try to own window.scrollY on the same
   frames, and the result is a fight that resolves as a snap.

   The one native call that remains lives here, in the reduced-motion / no-Lenis
   branch. It is an INSTANT positional set, not a smooth scroll, so there is
   nothing for Lenis to fight even if it were running. */

/* Module-level, not context and not a store: the Lenis instance is a single
   long-lived object owned by SmoothScroll, and every consumer wants the same
   one. A provider would add a tree dependency for a value that never changes
   identity while mounted. */
let instance: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  instance = l;
};

export const getLenis = () => instance;

/* ScrollTrigger.refresh, handed over by SmoothScroll so that callers can
   re-measure without importing GSAP and dragging it into their bundle. */
let refreshScrollTrigger: (() => void) | null = null;
export const setScrollRefresh = (fn: (() => void) | null) => {
  refreshScrollTrigger = fn;
};

/**
 * Re-measure everything that depends on document height.
 *
 * Lenis caches its scroll limit and does NOT reliably notice the page getting
 * taller: its ResizeObserver watches documentElement, whose border box is the
 * viewport, not the scroll height. So when content grows — the fleet grid
 * unfolding, ScrollTrigger's pin spacer appearing — the cached limit stays at
 * the old value and Lenis simply refuses to scroll past it. Wheel and touch
 * both go through Lenis, so they lock up; dragging the native scrollbar still
 * works, because that bypasses Lenis entirely. That asymmetry is the signature
 * of this bug.
 */
export function syncScrollMetrics() {
  instance?.resize();
  refreshScrollTrigger?.();
}

/** 1.2s reads as deliberate without stalling the user. */
const DURATION = 1.2;

/* easeOutExpo: almost all the distance is covered early, then it settles.
   That is what makes a long travel feel cinematic rather than slow — the
   user sees immediate response and a soft landing. */
const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export type ScrollOptions = {
  /** px added to the destination. Negative leaves a gap above the target. */
  offset?: number;
  /** seconds; overrides the default glide length */
  duration?: number;
  /** skip the glide and land immediately, even with motion enabled */
  immediate?: boolean;
  /** called once the glide finishes (or immediately when jumping) */
  onComplete?: () => void;
};

/**
 * Scroll to an element or selector.
 *
 * Routes through Lenis whenever it is running. Under prefers-reduced-motion
 * Lenis is deliberately never mounted (smoothing is itself motion), so this
 * jumps instantly instead.
 */
export function scrollToTarget(
  target: Element | string | null,
  { offset = 0, duration = DURATION, immediate = false, onComplete }: ScrollOptions = {}
) {
  if (typeof window === "undefined") return;

  const el =
    typeof target === "string" ? document.querySelector(target) : target;
  if (!el) return;

  const reduced = prefersReduced();
  const lenis = instance;

  if (lenis && !reduced && !immediate) {
    /* Recompute the scroll limit before targeting. Lenis caches it, and the
       two things this app scrolls to both change document height moments
       before the scroll runs: ScrollTrigger's pin spacer on mount, and the
       fleet grid unfolding on click. Against a stale limit Lenis clamps the
       destination to the OLD maximum and lands short — measured earlier in
       this project as limit 1080 when the true maximum was 5940. */
    syncScrollMetrics();
    lenis.scrollTo(el as HTMLElement, {
      offset,
      duration,
      easing: easeOutExpo,
      onComplete,
    });
    return;
  }

  /* Reduced motion, an explicit immediate:true, or Lenis not mounted yet.
     Instant, and deliberately not `behavior: "smooth"` — see the top of this
     file. Measure AFTER re-syncing, or a stale limit truncates the target. */
  syncScrollMetrics();
  const top = el.getBoundingClientRect().top + window.scrollY + offset;
  if (lenis) {
    /* Keep Lenis's internal position in step, otherwise its next frame snaps
       the page back to where it thought it was. */
    lenis.scrollTo(top, { immediate: true });
  } else {
    window.scrollTo({ top, behavior: "auto" });
  }
  onComplete?.();
}
