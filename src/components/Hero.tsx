"use client";

import { useSyncExternalStore } from "react";
import CoverReveal, { DESKTOP, MOBILE } from "./CoverReveal";

/* The hero is a cover-reveal on every device. This file only decides WHICH
   frame set runs; everything else lives in CoverReveal.

   The previous desktop hero — the 92-frame four-scene journey from the garage
   through Amman to Wadi Rum — is archived intact, not deleted:
     archive/HeroJourney.tsx          the component as it last shipped
     archive/hero-journey-frames/     all 92 frames
     archive/hero-source.mp4          the original 12.9s source
     archive/hero-trimmed.mp4         the source with the aerial shot cut
   archive/ is gitignored and excluded from tsconfig. */

type Mode = "desktop" | "mobile" | "static";

/* Decided ONCE per page load and never re-evaluated: swapping frame sets
   mid-session would strand a pinned ScrollTrigger, or start a multi-megabyte
   download on a phone that merely rotated. Module scope, so even a remount
   cannot flip it; `subscribe` intentionally never fires. */
let cachedMode: Mode | null = null;

const subscribeMode = () => () => {};

const getModeSnapshot = (): Mode => {
  if (cachedMode === null) {
    // reduced motion outranks width: it gets the still at any size
    cachedMode = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ? "static"
      : window.matchMedia("(min-width: 768px)").matches
        ? "desktop"
        : "mobile";
  }
  return cachedMode;
};

/* The server renders the static hero for everyone: poster, full headline,
   lockup and CTA. It is correct on its own for crawlers and no-JS clients,
   and it is the exact load state the sequence cross-fades out of. */
const getModeServerSnapshot = (): Mode => "static";

export default function Hero() {
  const mode = useSyncExternalStore(subscribeMode, getModeSnapshot, getModeServerSnapshot);
  return (
    <CoverReveal config={mode === "desktop" ? DESKTOP : mode === "mobile" ? MOBILE : null} />
  );
}
