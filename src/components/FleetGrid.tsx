"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { fleet, type Car } from "@/data/fleet";
import { PricePerDay, priceSpoken } from "@/lib/price";
import SpecIcon from "./SpecIcon";

/* Ordinary page content that unfolds in the document flow — NOT a dialog.
   No portal, no backdrop, no focus trap, no body scroll lock, no Escape
   handler: none of those apply to an in-flow disclosure, so none of them
   exist here.

   Loaded lazily (next/dynamic, ssr:false) and only mounted after the first
   open, so neither this module nor the grid images (one per car) cost anything on
   initial page load. It stays mounted afterwards. */

const STAGGER_MS = 35;
const STAGGER_CAP_MS = 450;
const CARDS_START_MS = 220; // cards begin while the container is still expanding

type SortKey = "price" | "size" | "seats";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "price", label: "Price" },
  { key: "size", label: "Size" },
  { key: "seats", label: "Seats" },
];

const SIZE_RANK: Record<Car["category"], number> = { Compact: 0, Sedan: 1, SUV: 2 };

type Entry = { car: Car; index: number };

/* index is the car's position in `fleet` — the carousel's own index space — so
   a click hands the carousel the right car whatever the sort order. */
function sortEntries(key: SortKey): Entry[] {
  const entries: Entry[] = fleet.map((car, index) => ({ car, index }));
  const compare: Record<SortKey, (a: Entry, b: Entry) => number> = {
    // pricePerDay 0 means "Price on request" — last in a cheapest-first list.
    price: (a, b) =>
      (a.car.pricePerDay > 0 ? a.car.pricePerDay : Infinity) -
      (b.car.pricePerDay > 0 ? b.car.pricePerDay : Infinity),
    size: (a, b) =>
      SIZE_RANK[a.car.category] - SIZE_RANK[b.car.category] ||
      a.car.luggage - b.car.luggage,
    seats: (a, b) => b.car.seats - a.car.seats, // capacity first
  };
  // Original index as the tiebreak keeps the sort stable.
  return entries.sort((a, b) => compare[key](a, b) || a.index - b.index);
}

/* --------------------------------- card ---------------------------------- */

function CompactCard({
  car,
  delayMs,
  innerRef,
  tabbable,
}: {
  car: Car;
  delayMs: number;
  innerRef: (el: HTMLAnchorElement | null) => void;
  tabbable: boolean;
}) {
  return (
    /* A real link to the car's own indexable route — crawlable, middle-
       clickable, and it survives with JS disabled. */
    <Link
      ref={innerRef}
      href={`/fleet/${car.slug}`}
      tabIndex={tabbable ? 0 : -1}
      aria-label={`${car.name}, ${car.journey}, ${priceSpoken(car)}. View details.`}
      style={{ animationDelay: `${delayMs}ms` }}
      className="fleet-grid-card relative block w-full overflow-hidden rounded-sm border border-bone/10 text-left"
    >
      {/* 640 variant only — the 896x1200 art is far too heavy for a grid cell */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`${car.image}-640.webp`}
        alt={`${car.name} photographed in Jordan`}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* same scrim pair as the carousel card, so text stays legible */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(17,17,16,0.75) 0%, rgba(17,17,16,0.35) 18%, transparent 34%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 44%, rgba(17,17,16,0.5) 62%, rgba(17,17,16,0.88) 82%, #111110 100%)",
        }}
      />

      <div
        className="relative flex h-full flex-col justify-between p-3.5"
        style={{
          textShadow: "0 2px 24px rgba(17,17,16,0.85), 0 1px 4px rgba(17,17,16,0.6)",
        }}
      >
        <p className="text-[12px] uppercase tracking-[0.1em] text-bone/70">{car.journey}</p>

        <div>
          <h3
            className="font-display truncate leading-tight text-bone"
            style={{ fontSize: "clamp(1rem, 1.4vw, 1.25rem)" }}
          >
            {car.name}
          </h3>
          <p className="mt-0.5 text-[15px] text-bone">
            <PricePerDay car={car} />
          </p>
          <ul className="mt-2 flex items-center gap-3 text-[12px] text-bone/70">
            <li className="flex items-center gap-1">
              <SpecIcon kind="gearbox" className="h-[13px] w-[13px]" />
              {car.transmission === "Automatic" ? "Auto" : "Manual"}
            </li>
            <li className="flex items-center gap-1">
              <SpecIcon kind="seats" className="h-[13px] w-[13px]" />
              {car.seats}
            </li>
            <li className="flex items-center gap-1">
              <SpecIcon kind="luggage" className="h-[13px] w-[13px]" />
              {car.luggage}
            </li>
          </ul>
        </div>
      </div>
    </Link>
  );
}

/* ------------------------------- expansion -------------------------------- */

export default function FleetGrid({
  id,
  open,
  openCount,
  onOpened,
}: {
  id: string;
  open: boolean;
  openCount: number;
  /* Fires once the expansion has actually STARTED — i.e. after this module has
     loaded and the row transition is underway. The section uses it to time its
     scroll, which must not run before there is any height to scroll to. */
  onOpened: () => void;
}) {
  const [sort, setSort] = useState<SortKey>("price");
  const cardRefs = useRef(new Map<string, HTMLAnchorElement>());
  const prevRects = useRef<Map<string, DOMRect> | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  /* This module is loaded on demand, so on the FIRST open it mounts with
     open=true already set. A CSS transition needs a CHANGE to animate — mount
     it at 1fr and it snaps to full height with no unfold at all. So paint one
     frame closed, then flip. Every later open is a plain prop change and needs
     no such dance. */
  const [live, setLive] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setLive(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const isOpen = open && live;

  const entries = useMemo(() => sortEntries(sort), [sort]);

  const [reduced, setReduced] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const h = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  /* Focus the first card on open. This lives HERE, not in the section: on the
     very first open this module is still being fetched, so a ref handed
     upward would still be null when the section tried to use it.
     preventScroll — the browser's scroll-into-view would fight the smooth
     scroll the section queues at the same moment. */
  useEffect(() => {
    if (!isOpen) return;
    const id = requestAnimationFrame(() => {
      gridRef.current
        ?.querySelector<HTMLAnchorElement>(".fleet-grid-card")
        ?.focus({ preventScroll: true });
      onOpened();
    });
    return () => cancelAnimationFrame(id);
  }, [isOpen, openCount, onOpened]);

  /* FLIP on sort change only — never on open, where the stagger owns the cards. */
  useLayoutEffect(() => {
    const prev = prevRects.current;
    const capture = () => {
      const m = new Map<string, DOMRect>();
      cardRefs.current.forEach((el, slug) => m.set(slug, el.getBoundingClientRect()));
      prevRects.current = m;
    };
    if (!prev || reduced || !isOpen) {
      capture();
      return;
    }
    cardRefs.current.forEach((el, slug) => {
      const was = prev.get(slug);
      if (!was) return;
      const now = el.getBoundingClientRect();
      const dx = was.left - now.left;
      const dy = was.top - now.top;
      if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return;
      el.animate(
        [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "translate(0, 0)" }],
        { duration: 400, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
    });
    capture();
  }, [sort, reduced, isOpen]);

  return (
    /* grid-template-rows 0fr -> 1fr is what animates to auto height. height:auto
       is not interpolable, so it is never used here. The direct child carries
       overflow:hidden + min-height:0, which the technique requires. */
    <div
      id={id}
      className="fleet-expand"
      data-open={isOpen ? "true" : "false"}
      aria-hidden={!isOpen}
      inert={!isOpen}
    >
      <div className="fleet-expand-clip">
        <div key={openCount} className="fleet-expand-inner mx-auto max-w-[1400px] px-8 pb-20 pt-2">
          <div className="mb-3 flex items-center gap-3" role="group" aria-label="Sort cars">
            {SORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setSort(s.key)}
                aria-pressed={sort === s.key}
                tabIndex={isOpen ? 0 : -1}
                className={`fleet-sort tap text-[12px] uppercase tracking-[0.14em] transition-colors ${
                  sort === s.key ? "text-clay" : "text-bone/60 hover:text-bone"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div ref={gridRef} className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {entries.map(({ car }, i) => (
              <CompactCard
                key={car.slug}
                car={car}
                tabbable={isOpen}
                delayMs={CARDS_START_MS + Math.min(i * STAGGER_MS, STAGGER_CAP_MS)}
                innerRef={(el) => {
                  if (el) cardRefs.current.set(car.slug, el);
                  else cardRefs.current.delete(car.slug);
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
