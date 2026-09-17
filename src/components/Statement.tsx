"use client";

import { useEffect, useRef } from "react";

/* The breath between the hero and the fleet — the two loudest moments on the
   page. Bone on a page that is otherwise ink, so the cut from the hero is the
   loudest thing about it. Deliberately holds one line, one sub-line and a
   great deal of nothing: anything added here costs the contrast its effect. */

const HEADLINE = ["Not", "just", "a", "rental."];
const SUB = "An experience built around comfort, freedom, and the open road.";

/** 80ms between words, per the brief. */
const STAGGER = 0.08;

export default function Statement() {
  const ref = useRef<HTMLElement>(null);

  /* CSS alone cannot start an animation on viewport entry — animation-timeline
     is not broadly supported yet — so a one-shot IntersectionObserver flips a
     data attribute and the stylesheet does the rest. It disconnects on first
     fire: this reveal should never replay on the way back up. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced motion is handled in CSS; reveal immediately and skip observing.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.revealed = "true";
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.dataset.revealed = "true";
            io.disconnect();
          }
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="statement"
      aria-labelledby="statement-heading"
      data-revealed="false"
      className="statement relative flex min-h-[90dvh] w-full items-center bg-bone px-6 py-32 md:px-10 md:py-40"
    >
      <div className="mx-auto w-full max-w-5xl">
        <h2
          id="statement-heading"
          className="font-display italic text-ink"
          style={{
            fontSize: "clamp(2.5rem, 8vw, 7rem)",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
          }}
        >
          {HEADLINE.map((w, i) => (
            <span
              key={w}
              className="statement-word"
              /* The visible gap is this margin, NOT the space character below.
                 These spans are inline-block, and inline layout trims a
                 trailing space inside one — the same thing that collapsed the
                 hero headline into "YourJourney". The space is still emitted
                 so h2.textContent stays "Not just a rental." for screen
                 readers and crawlers; it just contributes no width. */
              style={{
                animationDelay: `${i * STAGGER}s`,
                marginRight: i < HEADLINE.length - 1 ? "0.28em" : undefined,
              }}
            >
              {w}
              {i < HEADLINE.length - 1 ? " " : ""}
            </span>
          ))}
        </h2>

        {/* Sub-line fades as one unit once the last word has landed. Staggering
            a twelve-word sentence would read as a ticker, not a breath. */}
        <p
          className="statement-sub mt-10 max-w-xl text-sand"
          style={{
            fontSize: "clamp(0.95rem, 1.5vw, 1.15rem)",
            lineHeight: 1.6,
            animationDelay: `${HEADLINE.length * STAGGER + 0.15}s`,
          }}
        >
          {SUB}
        </p>
      </div>
    </section>
  );
}
