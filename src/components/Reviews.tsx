"use client";

import { useInView } from "@/lib/useInView";

/* TODO: REPLACE EVERY REVIEW BELOW.
   These are placeholders written to exercise the layout at realistic length —
   they are NOT real customer feedback and must not ship. Publishing invented
   testimonials as if they were real would be straightforwardly deceptive, so
   nothing here is marked up as a Review or given structured data until the
   genuine ones arrive. */
const REVIEWS = [
  {
    quote:
      "Placeholder — the car was waiting at the airport when we landed at 2am, exactly as arranged. No queue, no paperwork desk.",
    name: "Placeholder name",
    detail: "TODO — real review",
    depth: 0,
  },
  {
    quote:
      "Placeholder — we took it down to Wadi Rum and back over four days. Comfortable the whole way and the rate was what we were quoted.",
    name: "Placeholder name",
    detail: "TODO — real review",
    depth: 1,
  },
  {
    quote:
      "Placeholder — answered on WhatsApp within minutes every time. Being able to just message rather than call from abroad made it easy.",
    name: "Placeholder name",
    detail: "TODO — real review",
    depth: 2,
  },
  {
    quote:
      "Placeholder — they delivered to our hotel in Amman and collected from it a week later. Simple.",
    name: "Placeholder name",
    detail: "TODO — real review",
    depth: 1,
  },
  {
    quote:
      "Placeholder — clear about the deposit and the fuel policy before we booked, which is not something we can say about every rental.",
    name: "Placeholder name",
    detail: "TODO — real review",
    depth: 0,
  },
];

export default function Reviews() {
  const { ref, inView } = useInView<HTMLElement>(0.15);

  return (
    <section
      ref={ref}
      id="reviews"
      aria-labelledby="reviews-heading"
      data-revealed={inView ? "true" : "false"}
      className="reviews relative overflow-hidden bg-ink px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-[12px] uppercase tracking-[0.3em] text-bone/60">Reviews</p>
        <h2
          id="reviews-heading"
          className="font-display mt-4 text-bone"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", lineHeight: 0.95, letterSpacing: "-0.02em" }}
        >
          In their words.
        </h2>

        <ul className="mt-16 grid list-none gap-6 md:grid-cols-2 lg:grid-cols-3">
          {REVIEWS.map((r, i) => (
            <li
              key={i}
              className="review-card"
              data-depth={r.depth}
              style={{ ["--i" as string]: i }}
            >
              <blockquote className="text-[15px] leading-relaxed text-bone/90">
                {r.quote}
              </blockquote>
              <div aria-hidden="true" className="my-5 h-px w-full bg-bone/15" />
              <footer className="text-[12px] uppercase tracking-[0.16em] text-sand">
                {r.name} — {r.detail}
              </footer>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
