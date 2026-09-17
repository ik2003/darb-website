"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

/* ------------------------------ reduced motion ---------------------------
   Read as an external store rather than in an effect. Doing it in an effect
   means a synchronous setState on mount, which the React compiler rejects as
   a cascading render — and doing it in a lazy useState initialiser would
   diverge from the server, which always renders motion-enabled markup. */
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeReduced = (onChange: () => void) => {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
};

const getReduced = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedServer = () => false;

/** True when the visitor has asked for reduced motion. */
export function useReducedMotion() {
  return useSyncExternalStore(subscribeReduced, getReduced, getReducedServer);
}

/**
 * One-shot "has this entered the viewport" flag.
 *
 * CSS cannot start an animation on scroll entry — animation-timeline is not
 * broadly supported — so the sections that reveal on scroll need an observer.
 * This is that observer, in one place, rather than a third hand-rolled copy.
 *
 * One-shot by design: it disconnects on first intersection, so a reveal never
 * replays when the user scrolls back up. Under reduced motion it reports true
 * without observing anything, so the content is simply present.
 */
export function useInView<T extends HTMLElement>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || reduced || seen) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setSeen(true);
            io.disconnect();
          }
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, reduced, seen]);

  return { ref, inView: reduced || seen, reduced };
}
