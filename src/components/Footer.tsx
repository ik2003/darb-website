"use client";

import {
  ADDRESS,
  EMAIL,
  FACEBOOK,
  HOURS,
  INSTAGRAM,
  WHATSAPP_PRIMARY,
  WHATSAPP_SECONDARY,
} from "@/data/site";
import Link from "next/link";
import { bookingLink, enquiryLink } from "@/lib/whatsapp";
import { scrollToTarget } from "@/lib/scroll";

/* Calm by design. The drama is over by the time anyone reaches this — the
   footer's job is to be findable, not to perform. */

const SECTIONS = [
  { label: "The fleet", href: "#fleet" },
  { label: "How it works", href: "#how-it-works" },
  // HIDDEN with the reviews section itself (see src/app/page.tsx). Uncomment
  // this line when <Reviews /> goes back in, or the link scrolls to nothing.
  // { label: "Reviews", href: "#reviews" },
  { label: "Questions", href: "#faq" },
  { label: "Find us", href: "#location" },
];

const telLabel = (n: string) =>
  `+${n.slice(0, 3)} ${n.slice(3, 4)} ${n.slice(4, 8)} ${n.slice(8)}`;

export default function Footer() {
  /* Real hrefs so the links are crawlable and middle-clickable, but the click
     is intercepted and handed to the scroll helper. A native anchor jump would
     set window.scrollY directly and Lenis would fight it on the next frame —
     the same class of bug that made the view-all grid snap instead of glide. */
  const go = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    // let modified clicks (new tab, etc.) behave normally
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    scrollToTarget(href);
  };

  return (
    <footer id="footer" className="site-footer px-6 py-20 md:px-10 md:py-24">
      <div className="mx-auto w-full max-w-5xl">
        <div className="grid gap-14 md:grid-cols-[1.2fr_1fr_1fr]">
          {/* ------------------------------ lockup ------------------------------ */}
          <div>
            <p className="font-display text-xl tracking-[0.55em] text-bone">DARB</p>
            <p className="mt-2 text-[12px] tracking-[0.32em] text-bone/50">
              BY KAHRAMANAH
            </p>
            <p className="mt-6 max-w-xs text-[13px] leading-relaxed text-sand">
              Premium car rental in Amman, Jordan. Delivered to your hotel or to
              Queen Alia International Airport.
            </p>
          </div>

          {/* ------------------------------ contact ----------------------------- */}
          <div>
            <h2 className="text-[12px] uppercase tracking-[0.2em] text-sand">Contact</h2>
            <div aria-hidden="true" className="my-4 h-px w-full bg-bone/15" />
            <ul className="space-y-2 text-[14px]">
              <li>
                <a
                  href={bookingLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex min-h-[44px] items-center text-bone/85 hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  {telLabel(WHATSAPP_PRIMARY)}
                  <span className="ml-2 text-[12px] uppercase tracking-[0.14em] text-sand">
                    Bookings
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={enquiryLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex min-h-[44px] items-center text-bone/85 hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  {telLabel(WHATSAPP_SECONDARY)}
                  <span className="ml-2 text-[12px] uppercase tracking-[0.14em] text-sand">
                    Alternate
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${EMAIL}`}
                  className="tap inline-flex min-h-[44px] items-center text-bone/85 hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  {EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={INSTAGRAM}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex min-h-[44px] items-center text-bone/85 hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={FACEBOOK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex min-h-[44px] items-center text-bone/85 hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                >
                  Facebook
                </a>
              </li>
            </ul>
          </div>

          {/* ------------------------------ sections ---------------------------- */}
          <div>
            <h2 className="text-[12px] uppercase tracking-[0.2em] text-sand">Sections</h2>
            <div aria-hidden="true" className="my-4 h-px w-full bg-bone/15" />
            <ul className="space-y-2 text-[14px]">
              {SECTIONS.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    onClick={go(s.href)}
                    className="tap inline-flex min-h-[44px] items-center text-bone/85 hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ------------------------------- meta row ------------------------------ */}
        <div aria-hidden="true" className="mt-16 h-px w-full bg-bone/15" />

        <div className="mt-8 flex flex-col gap-4 text-[12px] text-sand sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1 sm:flex-row sm:gap-6">
            <span>{ADDRESS}</span>
            <span>{HOURS}</span>
          </div>
          {/* Static export: the SSR HTML carries the BUILD year while the
              client renders the CURRENT one, so these disagree across a New
              Year boundary. Suppressed rather than frozen — the year should
              still be right for anyone loading a stale build in January. */}
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-6">
            <Link
              href="/terms"
              className="tap inline-flex min-h-[44px] items-center hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              Terms &amp; Conditions
            </Link>
            <p suppressHydrationWarning>
              © {new Date().getFullYear()} Darb by Kahramanah
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
