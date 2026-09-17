"use client";

import { bookingLink } from "@/lib/whatsapp";
import { useInView } from "@/lib/useInView";

/* The decision point. One line, one button, nothing else — no secondary link,
   no reassurance copy, no second CTA competing with the first. Everything the
   visitor needed to decide has already been said by the time they arrive here.

   TODO: copy is mine, not yours. "The road is waiting." was chosen to close
   the loop opened by the hero's "Your Journey Starts Here." and to lean on
   what Darb means — road, path. Replace if you have a preferred line. */
const HEADLINE = ["The", "road", "is", "waiting."];
const STAGGER = 0.08;

export default function Closing() {
  const { ref, inView } = useInView<HTMLElement>(0.3);

  return (
    <section
      ref={ref}
      id="book"
      aria-labelledby="closing-heading"
      data-revealed={inView ? "true" : "false"}
      className="closing relative flex min-h-[100dvh] w-full items-center justify-center bg-ink px-6 py-24 text-center md:px-10"
    >
      <div className="mx-auto w-full max-w-4xl">
        <h2
          id="closing-heading"
          className="font-display text-bone"
          style={{
            fontSize: "clamp(2.75rem, 9vw, 8rem)",
            lineHeight: 0.9,
            letterSpacing: "-0.02em",
          }}
        >
          {HEADLINE.map((w, i) => (
            <span
              key={w}
              className="closing-word"
              /* Margin carries the gap; the space character is emitted only so
                 textContent stays readable. A trailing space inside an
                 inline-block is trimmed by inline layout — the trap that has
                 now collapsed two headlines in this project. */
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

        <a
          href={bookingLink()}
          target="_blank"
          rel="noopener noreferrer"
          className="closing-cta mt-14 inline-flex min-h-[44px] items-center bg-clay px-10 py-4 text-sm uppercase tracking-[0.12em] text-bone transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay"
          style={{ animationDelay: `${HEADLINE.length * STAGGER + 0.2}s` }}
        >
          Book on WhatsApp
        </a>
      </div>
    </section>
  );
}
