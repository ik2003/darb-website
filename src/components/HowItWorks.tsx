"use client";

import { useEffect, useRef } from "react";
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
  const lineRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const reduced = useReducedMotion();

  /* Scroll-linked progress line. Direct DOM update via rAF throttled scroll
     event ensures zero React re-render overhead while scrolling smoothly. */
  useEffect(() => {
    const el = ref.current;
    const line = lineRef.current;
    const list = listRef.current;
    if (!el || !line || !list) return;

    if (reduced) {
      line.style.transform = "scaleY(1)";
      const steps = list.querySelectorAll<HTMLLIElement>(".timeline-step");
      steps.forEach((s) => (s.dataset.active = "true"));
      return;
    }

    let raf = 0;
    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const start = window.innerHeight * 0.75;
      const end = window.innerHeight * 0.4;
      const total = r.height + (start - end);
      const travelled = start - r.top;
      const p = Math.max(0, Math.min(1, travelled / total));

      line.style.transform = `scaleY(${p})`;
      const steps = list.querySelectorAll<HTMLLIElement>(".timeline-step");
      steps.forEach((s, i) => {
        const active = p >= (i + 0.5) / STEPS.length;
        s.dataset.active = active ? "true" : "false";
      });
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

        <ol ref={listRef} className="timeline relative mt-16 list-none pl-12">
          {/* the track, and the clay line drawn over it */}
          <span aria-hidden="true" className="timeline-track" />
          <span
            ref={lineRef}
            aria-hidden="true"
            className="timeline-line"
            style={{ transform: reduced ? "scaleY(1)" : "scaleY(0)" }}
          />

          {STEPS.map((s, i) => (
            <li
              key={s.title}
              className="timeline-step relative pb-14 last:pb-0"
              data-active={reduced ? "true" : "false"}
            >
              <span aria-hidden="true" className="timeline-node" />
              <h3 className="font-display text-ink" style={{ fontSize: "clamp(1.35rem, 2.6vw, 1.85rem)" }}>
                {s.title}
              </h3>
              <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-sand">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
