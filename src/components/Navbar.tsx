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
          setScrolled(window.scrollY > 25);
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
        scrollToTarget(el, { offset: -60 });
      }
    }
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setMobileOpen(false);
    scrollToTarget(document.documentElement, { immediate: false });
  };

  return (
    <header className="fixed top-3 sm:top-5 inset-x-0 z-40 px-3 sm:px-6 pointer-events-none">
      <div className="mx-auto max-w-4xl w-full">
        {/* Main Pill Bar - Always maintains its crisp pill shape */}
        <nav
          aria-label="Main Navigation"
          className={`pointer-events-auto w-full rounded-full transition-all duration-300 flex items-center justify-between px-3.5 sm:px-6 py-1.5 sm:py-2 ${
            scrolled
              ? "bg-[#111110]/35 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.15)]"
              : "bg-white/[0.04] backdrop-blur-md border border-white/[0.14] shadow-[0_4px_24px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.12)]"
          }`}
        >
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={handleLogoClick}
            className="group flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay rounded-full py-0.5"
            aria-label="Darb Homepage"
          >
            <span className="font-display text-lg sm:text-2xl font-bold tracking-tight text-bone transition-colors group-hover:text-white drop-shadow-sm">
              DARB
            </span>
            <span className="text-[10px] sm:text-[11px] tracking-[0.22em] text-sand/90 uppercase pt-0.5 border-l border-white/20 pl-2">
              درب
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 bg-white/[0.04] p-1 rounded-full border border-white/10 backdrop-blur-sm">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="px-4 py-1.5 rounded-full text-[13px] tracking-wide text-bone/80 hover:text-white hover:bg-white/10 transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Action CTA & Mobile Button */}
          <div className="flex items-center gap-2">
            <a
              href={bookingLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 bg-clay/90 hover:bg-clay text-bone font-medium text-[11px] sm:text-[12px] uppercase tracking-[0.12em] px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-[0_2px_12px_rgba(196,85,45,0.35)] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay"
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

            {/* Mobile Hamburger Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-full bg-white/[0.08] hover:bg-white/[0.15] active:bg-white/[0.2] text-bone border border-white/15 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-clay"
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
                  strokeLinecap="round"
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
                  strokeLinecap="round"
                  className="w-4 h-4"
                >
                  <line x1="4" y1="7" x2="20" y2="7" />
                  <line x1="4" y1="17" x2="20" y2="17" />
                </svg>
              )}
            </button>
          </div>
        </nav>

        {/* Mobile Dropdown Panel - Detached glass card, pure ultra-sheer glassmorphic style */}
        {mobileOpen && (
          <div className="pointer-events-auto md:hidden mt-2 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/15 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.1)] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl text-[15px] font-medium tracking-wide text-bone/90 hover:text-white hover:bg-white/[0.08] active:bg-white/[0.14] transition-colors"
                >
                  <span>{link.label}</span>
                  <span className="text-sand text-xs font-sans">→</span>
                </a>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-white/10">
              <a
                href={bookingLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="w-full flex items-center justify-center gap-2 bg-clay/90 hover:bg-clay text-bone font-medium text-xs uppercase tracking-[0.14em] py-3 rounded-xl shadow-lg transition-all active:scale-[0.99]"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
                <span>Book on WhatsApp</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
