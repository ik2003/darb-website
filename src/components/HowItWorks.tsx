"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/useInView";

/* Vertical timeline. The clay line is a progress indicator — an active state,
   which is what clay is for — not a divider, so it does not breach the rule
   against clay rules. It is a 2px vertical stroke, never a full-width rule. */

const STEPS = [
  {
    title: "Choose your car",
    body: "Browse the fleet and pick the model that suits your trip. Every rate is listed up front.",
  },
  {
    title: "Message us on WhatsApp",
    body: "Send the prefilled enquiry with your dates. We reply in person, not with an automated form.",
  },
  {
    title: "We deliver",
    body: "We bring the car to you — your hotel, your address, or Queen Alia International Airport on arrival.",
  },
  {
    title: "Drive",
    body: "Amman, the Dead Sea road, Petra, Wadi Rum. The car is yours for the length of the booking.",
  },
  {
    title: "Return",
    body: "Hand it back wherever suits — we collect from your hotel or meet you at the airport for your flight.",
  },
];

export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(0);
  const reduced = useReducedMotion();
  /* Fully drawn under reduced motion: the line is a wayfinding cue, so it has
     to be present even when it is not allowed to animate. */
  const progress = reduced ? 1 : scrolled;

  /* Scroll-linked rather than a per-node observer: the brief asks for a line
     that DRAWS as you scroll, which a discrete "activate on entry" observer
     cannot express. Read-only on scroll, rAF-throttled, so it never fights
     Lenis for the scroll position. */
  useEffect(() => {
    const el = ref.current;
    if (!el || reduced) return;

    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      /* 0 when the section's top reaches the viewport's lower third, 1 when
         its bottom passes the middle. Keeps the draw inside the stretch where
         the timeline is actually on screen. */
      const start = window.innerHeight * 0.75;
      const end = window.innerHeight * 0.4;
      const total = r.height + (start - end);
      const travelled = start - r.top;
      setScrolled(Math.max(0, Math.min(1, travelled / total)));
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced]);

  return (
    <section
      ref={ref}
      id="how-it-works"
      aria-labelledby="how-heading"
      className="relative bg-bone px-6 py-24 text-ink md:px-10 md:py-32"
    >
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[12px] uppercase tracking-[0.3em] text-sand">How it works</p>
        <h2
          id="how-heading"
          className="font-display mt-4 text-ink"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", lineHeight: 0.95, letterSpacing: "-0.02em" }}
        >
          Five steps, no counter.
        </h2>

        <ol className="timeline relative mt-16 list-none pl-12">
          {/* the track, and the clay line drawn over it */}
          <span aria-hidden="true" className="timeline-track" />
          <span
            aria-hidden="true"
            className="timeline-line"
            style={{ transform: `scaleY(${progress})` }}
          />

          {STEPS.map((s, i) => {
            // a node lights once the line has reached its position down the list
            const active = progress >= (i + 0.5) / STEPS.length;
            return (
              <li
                key={s.title}
                className="timeline-step relative pb-14 last:pb-0"
                data-active={active ? "true" : "false"}
              >
                <span aria-hidden="true" className="timeline-node" />
                <h3 className="font-display text-ink" style={{ fontSize: "clamp(1.35rem, 2.6vw, 1.85rem)" }}>
                  {s.title}
                </h3>
                <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-sand">{s.body}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
