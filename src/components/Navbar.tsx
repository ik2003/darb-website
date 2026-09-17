"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { bookingLink } from "@/lib/whatsapp";
import { scrollToTarget } from "@/lib/scroll";

const NAV_LINKS = [
  { label: "Fleet", href: "#fleet" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "FAQ", href: "#faq" },
  { label: "Location", href: "#location" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrolled(window.scrollY > 30);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      setMobileOpen(false);
      const el = document.querySelector(href);
      if (el) {
        scrollToTarget(el, { offset: -40 });
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileOpen(false);
    scrollToTarget(document.documentElement, { immediate: false });
  };

  return (
    <header className="fixed top-4 sm:top-6 inset-x-0 z-40 px-4 sm:px-6 pointer-events-none">
      <nav
        aria-label="Main Navigation"
        className={`pointer-events-auto mx-auto max-w-4xl w-full rounded-full transition-all duration-500 ${
          scrolled
            ? "bg-[#111110]/85 backdrop-blur-xl border border-bone/20 shadow-[0_12px_40px_rgba(0,0,0,0.5),0_1px_0_rgba(237,230,218,0.12)_inset] py-2 px-4 sm:px-6"
            : "bg-[#111110]/65 backdrop-blur-md border border-bone/12 shadow-[0_8px_30px_rgba(0,0,0,0.35),0_1px_0_rgba(237,230,218,0.08)_inset] py-2.5 px-4 sm:px-6"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="group flex items-center gap-2.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay rounded-full"
            aria-label="Darb Homepage"
          >
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-bone transition-colors group-hover:text-white">
              DARB
            </span>
            <span className="text-[10px] tracking-[0.25em] text-sand uppercase pt-0.5 border-l border-bone/15 pl-2">
              درب
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-bone/[0.04] p-1 rounded-full border border-bone/10">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-4 py-1.5 rounded-full text-[13px] tracking-wide text-bone/75 hover:text-bone hover:bg-bone/10 transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Action CTA Button & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a
              href={bookingLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-clay hover:bg-[#d86034] text-bone font-medium text-[11px] sm:text-[12px] uppercase tracking-[0.14em] px-3.5 sm:px-4 py-2 rounded-full shadow-[0_2px_14px_rgba(196,85,45,0.38)] transition-all duration-300 hover:scale-[1.03] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-3.5 h-3.5"
              >
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>Book</span>
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-bone/[0.07] hover:bg-bone/[0.12] text-bone border border-bone/15 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay"
              aria-expanded={mobileOpen}
              aria-label="Toggle navigation menu"
            >
              {mobileOpen ? (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="w-4 h-4"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileOpen && (
          <div className="md:hidden mt-3 pt-3 pb-2 border-t border-bone/10 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-3.5 py-2 rounded-xl text-sm font-medium tracking-wide text-bone/80 hover:text-bone hover:bg-bone/10 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </nav>
    </header>
  );
}
