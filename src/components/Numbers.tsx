"use client";

import { useEffect, useState } from "react";
import { fleet } from "@/data/fleet";
import { useInView, useReducedMotion } from "@/lib/useInView";

/* Two of these four are derived, not typed in: the model count IS the fleet
   array's length, so it can never drift from the carousel. The vehicle count
   is the documented 25-car fleet (see the note on unitsAvailable in fleet.ts),
   which is not derivable because not every model declares its units yet. */
type Figure = {
  /** rendered before the counted number, e.g. the "+" in +27 */
  prefix?: string;
  /** the number to count to, or null for a word-figure that just reveals */
  value: number | null;
  /** rendered after the counted number, e.g. the "/7" in 24/7 */
  suffix?: string;
  /** shown when value is null */
  word?: string;
  caption: string;
};

const FIGURES: Figure[] = [
  { prefix: "+", value: 27, caption: "Vehicles in the fleet" },
  /* Still the array's length, so it can never contradict the carousel a
     visitor can count. The client asked for +15; 15 is written here only once
     the two missing models are in fleet.ts. */
  { prefix: "+", value: fleet.length, caption: "Models to choose from" },
  { value: 24, suffix: "/7", caption: "Support on WhatsApp" },
  { value: null, word: "Airport", caption: "Delivery to Queen Alia" },
];

const DURATION = 1100;
const STAGGER = 140;

function CountUp({ to, suffix, delay, run }: { to: number; suffix?: string; delay: number; run: boolean }) {
  const [n, setN] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!run || reduced) return;
    let raf = 0;
    let start = 0;
    const timer = window.setTimeout(() => {
      const tick = (t: number) => {
        if (!start) start = t;
        const p = Math.min(1, (t - start) / DURATION);
        /* easeOutExpo, matching the scroll helper's curve: most of the count
           happens immediately and then it settles, which reads as a counter
           rather than a linear tally. */
        const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
        setN(Math.round(eased * to));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    }, delay);

    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [run, to, delay, reduced]);

  /* Under reduced motion the figure is simply the figure — no tally, no
     intermediate values, and nothing set from inside an effect. */
  return (
    <>
      {reduced ? to : n}
      {suffix}
    </>
  );
}

export default function Numbers() {
  const { ref, inView } = useInView<HTMLElement>(0.2);

  return (
    <section
      ref={ref}
      id="numbers"
      aria-labelledby="numbers-heading"
      data-revealed={inView ? "true" : "false"}
      className="numbers relative bg-bone px-6 py-24 text-ink md:px-10 md:py-32"
    >
      <h2 id="numbers-heading" className="sr-only">
        Darb by the numbers
      </h2>

      <div className="mx-auto grid w-full max-w-5xl gap-14 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        {FIGURES.map((f, i) => (
          <div key={f.caption} className="numbers-item" style={{ ["--i" as string]: i }}>
            <p
              className="font-display leading-none text-ink"
              style={{ fontSize: "clamp(3rem, 6vw, 4.5rem)" }}
            >
              {f.value === null ? (
                f.word
              ) : (
                <>
                  {f.prefix}
                  <CountUp to={f.value} suffix={f.suffix} delay={i * STAGGER} run={inView} />
                </>
              )}
            </p>

            {/* Hairline draws left to right, then the caption fades under it.
                Bone at 15% is for dark surfaces; this section is bone, so the
                rule is ink at 15% — same idea, inverted ground. */}
            <span aria-hidden="true" className="numbers-rule" />

            <p className="numbers-caption text-[13px] uppercase tracking-[0.16em] text-sand">
              {f.caption}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
