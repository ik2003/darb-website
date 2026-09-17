"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { fleet, type Car } from "@/data/fleet";
import { bookingLink } from "@/lib/whatsapp";
import { PricePerDay, priceSpoken } from "@/lib/price";
import { scrollToTarget, syncScrollMetrics } from "@/lib/scroll";
import SpecIcon from "./SpecIcon";

/* Lazily loaded and only mounted once the trigger is first pressed, so the
   grid's JS and its one-image-per-car set cost nothing on initial page load. */
const FleetGrid = dynamic(() => import("./FleetGrid"), { ssr: false });

const GRID_ID = "fleet-grid";

const BG_MS = 900;
const AUTO_MS = 5000;

// Two image sets, never interchangeable:
//   /fleet/cards/{slug}-{640,896}.webp  portrait 3:4 finished composite — CARD only
//   /fleet/bg/{slug}-section.webp       wide 16:9 landscape, no vehicle — SECTION only
const cardSrc = (image: string, w: 640 | 896) => `${image}-${w}.webp`;
const sectionBg = (slug: string) => `/fleet/bg/${slug}-section.webp`;
/* 1920 is desktop-only. These sit behind a 4px blur, a 45% ink wash and a
   vignette, so a 960 source is visually identical — and a phone has no
   business pulling 1920px of backdrop. */
const sectionBgSet = (slug: string) =>
  `/fleet/bg/${slug}-section-960.webp 960w, /fleet/bg/${slug}-section.webp 1920w`;

/* ------------------------------ ring geometry ------------------------------
   Keyed by |distance from centre|. Five visible positions on desktop, three on
   mobile.

   `x` is a FRACTION OF THE CENTRE CARD'S WIDTH, not a gap — so the cards
   overlap by the same proportion at every viewport size. The overlap is the
   composition; do not convert these back into a spacing value.

   `y` is a flat pixel drop that builds the shallow arc. It sits to the LEFT of
   scale() in the transform list, so it is applied after scaling and 26px is a
   true 26px on screen regardless of the card's scale. */
type Ring = {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  blur: number;
  rot: number;
  z: number;
};

const DESKTOP_RINGS: Ring[] = [
  { x: 0, y: 0, scale: 1, opacity: 1, blur: 0, rot: 0, z: 40 },
  { x: 0.62, y: 26, scale: 0.78, opacity: 0.9, blur: 1, rot: 18, z: 30 },
  { x: 1.12, y: 44, scale: 0.6, opacity: 0.45, blur: 3, rot: 26, z: 20 },
];
const DESKTOP_BEYOND: Ring = { x: 1.6, y: 44, scale: 0.5, opacity: 0, blur: 3, rot: 26, z: 10 };

/* Five cards do not fit on a phone OR on a tablet in portrait. Both use three
   positions; ±2 is hidden outright, and y is 18px rather than 26px so the arc
   stays proportional to the smaller card. Blur is 2px on mobile/tablet (lower
   than desktop's 3px to avoid GPU jank on mobile GPUs). */
const NARROW_RINGS: Ring[] = [
  { x: 0, y: 0, scale: 1, opacity: 1, blur: 0, rot: 0, z: 40 },
  { x: 0.62, y: 26, scale: 0.72, opacity: 0.5, blur: 2, rot: 12, z: 30 },
];
const NARROW_BEYOND: Ring = { x: 1.12, y: 44, scale: 0.5, opacity: 0, blur: 2, rot: 12, z: 10 };

/* THREE tiers, not two. A 768px tablet in portrait is neither a phone nor a
   desktop: at five positions the centre card was only 60% of the viewport and
   the outer pair sat almost entirely off-screen. Tablet gets the narrow ring
   with its own card width (see the 768-1023 block in globals.css). */
export type Tier = "mobile" | "tablet" | "desktop";

const RINGS: Record<Tier, Ring[]> = {
  mobile: NARROW_RINGS,
  tablet: NARROW_RINGS,
  desktop: DESKTOP_RINGS,
};
const BEYOND: Record<Tier, Ring> = {
  mobile: NARROW_BEYOND,
  tablet: NARROW_BEYOND,
  desktop: DESKTOP_BEYOND,
};

const ringFor = (abs: number, tier: Tier): Ring => RINGS[tier][abs] ?? BEYOND[tier];

/** How many neighbours each tier actually paints. */
const ringDepth = (tier: Tier) => (tier === "desktop" ? 2 : 1);

/* The ring is endless. Each card's position is derived fresh every render from
   its offset to the current centre, wrapped to the SHORTEST way round — so
   stepping from the last car to the first moves one place forward, never
   n - 1 places back. Nothing
   animates a container scroll or a shared translateX; that is precisely what
   produces the long rewind.

   The wrap discontinuity lands at ±n/2 (n = fleet.length), which must stay
   outside the visible ring (±2). True for any n > 4, so it holds with a
   comfortable margin for the fleet as it stands, and the cards that flip sign at the seam are visibility:hidden, so
   the jump is never seen. */
const wrappedOffset = (index: number, current: number, n: number) => {
  const o = (index - current + n) % n;
  return o > n / 2 ? o - n : o;
};

const wrapIndex = (i: number, n: number) => ((i % n) + n) % n;

/* ---------------------------------- icons --------------------------------- */

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-5 w-5"
    >
      <path
        d={dir === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ----------------------------------- card ---------------------------------- */

function CoverflowCard({
  car,
  d,
  tier,
  reduced,
  loaded,
  animKey,
  onSelect,
  dragPx,
}: {
  car: Car;
  d: number; // signed distance from centre
  tier: Tier;
  reduced: boolean;
  loaded: boolean;
  animKey: number;
  onSelect?: () => void;
  dragPx: number;
}) {
  const abs = Math.abs(d);
  const centre = d === 0;
  const dir = Math.sign(d); // -1 left, +1 right
  const ring = ringFor(abs, tier);
  /* Off-ring cards are visibility:hidden, not merely opacity:0 — that both
     hides the seam flip at ±n/2 and removes them (and the link inside) from
     the tab order and hit-testing entirely. */
  const offRing = ring.opacity === 0;
  const cardRef = useRef<HTMLDivElement>(null);

  // Hold a GPU layer only while the card is actually moving, then release it.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || abs > 2) return;
    el.style.willChange = "transform, opacity";
    const clear = () => {
      el.style.willChange = "";
    };
    el.addEventListener("transitionend", clear);
    const safety = setTimeout(clear, 1400);
    return () => {
      el.removeEventListener("transitionend", clear);
      clearTimeout(safety);
      clear();
    };
  }, [d, abs]);

  /* Reduced motion is resolved here rather than in a CSS override: the live
     values below are inline, so a stylesheet rule would need !important on
     every property to win. One source of truth is cheaper to reason about. */
  const style: React.CSSProperties = reduced
    ? {
        transform: `translate(-50%, -50%) translateX(calc(${dir * 1.15} * var(--card-w)))`,
        opacity: centre ? 1 : 0,
        filter: "none",
        zIndex: ring.z,
        visibility: centre ? "visible" : "hidden",
        pointerEvents: centre ? "auto" : "none",
      }
    : {
        // dragPx is baked into the string (not read from a var) so the
        // declaration itself changes on every drag frame and the cards
        // actually follow the pointer.
        transform:
          `translate(-50%, -50%) ` +
          `translateX(calc(${dir * ring.x} * var(--card-w) + ${dragPx}px)) ` +
          `translateY(${ring.y}px) ` +
          `rotateY(${-dir * ring.rot}deg) ` +
          `scale(${ring.scale})`,
        opacity: ring.opacity,
        filter: `blur(${ring.blur}px) saturate(${centre ? 100 : 80}%)`,
        zIndex: ring.z,
        visibility: offRing ? "hidden" : "visible",
        pointerEvents: offRing ? "none" : "auto",
        cursor: centre ? undefined : "pointer",
      };

  return (
    <div
      ref={cardRef}
      className="fleet-card"
      aria-hidden={!centre}
      data-side={abs >= 1 ? "true" : "false"}
      data-centre={centre ? "true" : "false"}
      style={style}
      onClick={onSelect}
    >
      {/* No background colour: the card ratio now matches the source, so the
          image covers edge to edge and there is no letterbox left to disguise. */}
      <article
        className="relative flex h-full w-full flex-col overflow-hidden rounded-sm"
        style={{
          boxShadow: centre
            ? "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)"
            : "none",
        }}
      >
        {/* single background: finished composite, vehicle already in scene */}
        {loaded && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={cardSrc(car.image, 640)}
            srcSet={`${cardSrc(car.image, 640)} 640w, ${cardSrc(car.image, 896)} 896w`}
            sizes="(min-width: 768px) 510px, 82vw"
            alt={`${car.name} photographed in Jordan`}
            /* sizing + object-fit live in .fleet-card-img (globals.css). cover
               is safe ONLY because the card ratio matches the source; if you
               change --card-w's multiplier, this starts cropping the car. */
            className="fleet-card-img"
            loading={centre ? "eager" : "lazy"}
            draggable={false}
          />
        )}

        {/* top scrim — journey label / model name legibility */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(17,17,16,0.75) 0%, rgba(17,17,16,0.35) 18%, transparent 34%)",
          }}
        />

        {/* bottom scrim — dissolves, never forms an edge */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, transparent 52%, rgba(17,17,16,0.5) 68%, rgba(17,17,16,0.88) 84%, #111110 100%)",
          }}
        />

        {/* text content */}
        {/* The whole card is a link to the car's page. It sits UNDER the copy
            layer in the stacking order but the copy layer passes clicks
            through (pointer-events-none), so a click anywhere on the card
            except the WhatsApp button lands here. A real anchor, so it is
            crawlable, middle-clickable and keyboard-operable. Side cards
            disable it: their job is to come to the centre, not to navigate. */}
        <Link
          href={`/fleet/${car.slug}`}
          aria-label={`View details for ${car.name}`}
          tabIndex={centre ? 0 : -1}
          aria-hidden={!centre}
          className="fleet-card-link absolute inset-0 z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          style={{ pointerEvents: centre ? "auto" : "none" }}
        />

        <div
          key={centre ? animKey : undefined}
          className={`coverflow-info pointer-events-none relative z-20 flex h-full flex-col justify-between ${centre ? "coverflow-info-in" : ""}`}
        >
          {/* top group — film-poster text shadow. Sits above the 24%-62% band
              the car occupies, so it is never clipped by the card edge. */}
          <div
            className="fleet-card-top"
            style={{
              textShadow:
                "0 2px 24px rgba(17,17,16,0.85), 0 1px 4px rgba(17,17,16,0.6)",
            }}
          >
            <p className="text-[12px] uppercase tracking-[0.18em] text-bone/75">
              {car.journey}
            </p>
            {/* must never wrap — ellipsises instead. Longest: "BYD Destroyer 05".
                Type is in .fleet-card-name: `truncate` brings overflow:hidden,
                which clips the glyphs vertically as well as horizontally, so the
                line box has to fit Instrument Serif's full ascent+descent. */}
            <h3 className="fleet-card-name font-display truncate text-bone">
              {car.name}
            </h3>
          </div>

          {/* bottom group — price starts no higher than 66% of card height */}
          <div className="fleet-card-bottom">
            <p className="fleet-card-price whitespace-nowrap text-bone">
              <PricePerDay car={car} />
            </p>

            <div aria-hidden="true" className="fleet-card-rule my-3 h-px w-full bg-bone/15" />

            <ul className="flex items-center gap-4 text-xs text-bone/80">
              <li className="flex items-center gap-1.5 [&>svg]:text-bone/70">
                <SpecIcon kind="gearbox" />
                {car.transmission === "Automatic" ? "Auto" : "Manual"}
              </li>
              <li className="flex items-center gap-1.5 [&>svg]:text-bone/70">
                <SpecIcon kind="seats" />
                {car.seats} seats
              </li>
              <li className="flex items-center gap-1.5 [&>svg]:text-bone/70">
                <SpecIcon kind="luggage" />
                {car.luggage} bags
              </li>
            </ul>

            <a
              href={bookingLink(car.name)}
              target="_blank"
              rel="noopener noreferrer"
              tabIndex={centre ? 0 : -1}
              /* the one thing above the card-wide link, and only at the centre */
              style={{ pointerEvents: centre ? "auto" : "none" }}
              className="fleet-card-btn pointer-events-auto mt-3 inline-flex w-full items-center justify-center rounded-lg bg-clay px-4 py-3 text-sm uppercase tracking-[0.12em] text-bone transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              Book on WhatsApp
            </a>

          </div>
        </div>
      </article>
    </div>
  );
}

/* --------------------------------- section --------------------------------- */

export default function FleetCoverflow() {
  const [active, setActive] = useState(0);
  const [interacted, setInteracted] = useState(false);
  const [inView, setInView] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [reduced, setReduced] = useState(false);
  const [tier, setTier] = useState<Tier>("desktop");
  const [slideW, setSlideW] = useState(400);
  const [dragPx, setDragPx] = useState(0);
  /* Must be state, not the ref below: the ref drives no re-render, so after
     the first interaction (when markInteracted stops changing anything)
     data-dragging would stay stale for the first move frame and the cards
     would transition-smear instead of tracking the pointer. */
  const [dragging, setDragging] = useState(false);
  const [bgStack, setBgStack] = useState([{ slug: fleet[0].slug, key: 0 }]);
  /* gridMounted latches true on the first open and never goes back — that is
     what makes reopening instant. gridOpen drives the fade. openCount re-keys
     the grid so the stagger replays on every open. */
  const [gridMounted, setGridMounted] = useState(false);
  const [gridOpen, setGridOpen] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const viewAllRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  /* Mirrors `reduced` so the scroll callbacks read the current value without
     being re-created (and re-binding) on every media-query change. */
  const reducedRef = useRef(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const bgKey = useRef(0);
  /* A press that travels less than TAP_SLOP px and lasts under TAP_MS is a
     click, not a drag. Anything more suppresses the click that follows, so a
     swipe never opens WhatsApp or a car page. */
  const TAP_SLOP = 6;
  const TAP_MS = 500;
  const suppressClick = useRef(false);

  const drag = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastT: number;
    startT: number;
    on: boolean;
    moved: boolean;
  }>({ startX: 0, startY: 0, lastX: 0, lastT: 0, startT: 0, on: false, moved: false });

  const markInteracted = useCallback(() => setInteracted(true), []);

  /* Both wrap rather than clamp — the ring has no first or last car. */
  const go = useCallback((next: number) => {
    setActive(wrapIndex(next, fleet.length));
  }, []);

  const step = useCallback(
    (delta: number) => {
      markInteracted();
      setActive((a) => wrapIndex(a + delta, fleet.length));
    },
    [markInteracted]
  );

  const openGrid = useCallback(() => {
    markInteracted();
    setGridMounted(true);
    setGridOpen(true);
    setOpenCount((c) => c + 1);

    /* The scroll is NOT queued here. On the first open this module is still
       being fetched, so 120ms later the page has not grown by a single pixel
       and scrollIntoView clamps to the old scroll height — it silently does
       nothing. FleetGrid calls onGridOpened once the row transition is
       actually under way; the delay is measured from there. */
  }, [markInteracted]);

  /* 120ms after the unfold visibly starts, so the motion reads before the page
     moves under it. */
  const onGridOpened = useCallback(() => {
    window.setTimeout(() => {
      /* -32px so the grid's top edge sits 2rem below the viewport top. This
         used to come from scroll-margin-top on .fleet-grid-anchor, but that
         property is only honoured by native scrollIntoView — once Lenis took
         over the scrolling it was silently ignored and the grid landed flush
         against the top edge. The offset has to be explicit now. */
      scrollToTarget(gridRef.current, { offset: -32, duration: 1.6 });
    }, 120);
  }, []);

  const closeGrid = useCallback(() => {
    setGridOpen(false);
    viewAllRef.current?.focus({ preventScroll: true });
    /* 80ms behind the collapse so the two read as one movement rather than a
       jump that happens to coincide with a transition. Lands back on the
       section rather than stranding the user in whitespace. */
    window.setTimeout(() => {
      scrollToTarget(sectionRef.current);
    }, 80);
  }, []);

  /* THE fix for the scroll lock-up inside the open grid.

     The grid does not reach its final height at any single moment we could
     hang a timeout on: grid-template-rows animates 0fr -> 1fr over 700ms, and
     the cards settle after that. Lenis caches its scroll limit and does not
     notice — its ResizeObserver watches documentElement, whose border box is
     the viewport, not the scroll height. So the limit stays at the pre-open
     value and Lenis refuses to scroll past it. Wheel and touch both go through
     Lenis and lock up; the native scrollbar still works, because it bypasses
     Lenis entirely.

     Observing the wrapper catches every one of those growth steps, and the
     debounce collapses the ~40 resize callbacks of an animating transition
     into a single re-measure once the height actually settles. */
  useEffect(() => {
    const el = gridRef.current;
    if (!el || !gridMounted) return;
    if (typeof ResizeObserver === "undefined") return;

    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(syncScrollMetrics, 120);
    });
    ro.observe(el);

    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [gridMounted]);

  const toggleGrid = useCallback(() => {
    if (gridOpen) closeGrid();
    else openGrid();
  }, [gridOpen, openGrid, closeGrid]);

  /* media + visibility environment */
  useEffect(() => {
    const mqMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    /* Two queries, three tiers. These MUST stay in step with the matching
       breakpoints in globals.css (.fleet-stage) — the ring count is decided
       here, the card width there, and disagreeing would show as cards sized
       for one tier arranged for another. */
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqTablet = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const syncMotion = () => {
      setReduced(mqMotion.matches);
      reducedRef.current = mqMotion.matches;
    };
    const syncTier = () => {
      setTier(mqMobile.matches ? "mobile" : mqTablet.matches ? "tablet" : "desktop");
      // Gates the neighbour images: the server cannot know the tier, so it
      // emits only the centre card and the ring fills in once we do.
      setMounted(true);
    };
    syncMotion();
    syncTier();
    mqMotion.addEventListener("change", syncMotion);
    mqMobile.addEventListener("change", syncTier);
    mqTablet.addEventListener("change", syncTier);

    const onVis = () => setPageVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);

    // Card geometry is pure CSS (height clamp + derived width). We only measure
    // the rendered card width to size the drag threshold.
    const measure = () => {
      const w = stageRef.current?.querySelector(".fleet-card")?.clientWidth ?? 0;
      if (w > 0) setSlideW(w);
    };
    measure();
    window.addEventListener("resize", measure);

    let ro: ResizeObserver | undefined;
    if (stageRef.current && "ResizeObserver" in window) {
      ro = new ResizeObserver(measure);
      ro.observe(stageRef.current);
    }

    const el = sectionRef.current;
    let io: IntersectionObserver | undefined;
    if (el) {
      io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
        threshold: 0.3,
      });
      io.observe(el);
    }
    return () => {
      mqMotion.removeEventListener("change", syncMotion);
      mqMobile.removeEventListener("change", syncTier);
      mqTablet.removeEventListener("change", syncTier);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("resize", measure);
      ro?.disconnect();
      io?.disconnect();
    };
  }, []);

  /* auto-advance: stops permanently after first interaction */
  useEffect(() => {
    if (interacted || reduced || !inView || !pageVisible) return;
    const id = setInterval(() => setActive((a) => (a + 1) % fleet.length), AUTO_MS);
    return () => clearInterval(id);
  }, [interacted, reduced, inView, pageVisible]);

  /* background crossfade queue */
  useEffect(() => {
    const slug = fleet[active].slug;
    setBgStack((stack) => {
      if (stack[stack.length - 1]?.slug === slug) return stack;
      bgKey.current += 1;
      return [...stack.slice(-1), { slug, key: bgKey.current }];
    });
    const t = setTimeout(() => setBgStack((s) => s.slice(-1)), BG_MS + 80);
    return () => clearTimeout(t);
  }, [active]);

  /* keyboard */
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  };

  /* Pointer drag with momentum — this is what carries swipe on touch.
     Deliberately NO setPointerCapture: capturing retargets pointerup, and
     with it the click, to the capturing element. That is what stopped the
     WhatsApp button and the card link from ever seeing a click — measured:
     pointerdown landed on the anchor, pointerup and click on .fleet-stage.
     The move and release are tracked on window instead, so a drag that
     leaves the carousel still works. */
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    markInteracted();
    suppressClick.current = false;
    const d = drag.current;
    d.startX = e.clientX;
    d.startY = e.clientY;
    d.lastX = e.clientX;
    d.lastT = performance.now();
    d.startT = d.lastT;
    d.on = true;
    d.moved = false;
    setDragging(true);

    const move = (ev: PointerEvent) => {
      if (!d.on) return;
      if (
        Math.abs(ev.clientX - d.startX) > TAP_SLOP ||
        Math.abs(ev.clientY - d.startY) > TAP_SLOP
      ) {
        d.moved = true;
      }
      d.lastX = ev.clientX;
      d.lastT = performance.now();
      setDragPx(ev.clientX - d.startX);
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!d.on) return;
      d.on = false;
      setDragging(false);
      const dx = ev.clientX - d.startX;
      const dt = Math.max(1, performance.now() - d.lastT);
      const vx = (ev.clientX - d.lastX) / dt; // px per ms at release
      setDragPx(0);
      // a drag, or a long press: the click that follows is not a click
      suppressClick.current = d.moved || performance.now() - d.startT > TAP_MS;
      if (dx < -slideW * 0.22 || vx < -0.45) go(active + 1);
      else if (dx > slideW * 0.22 || vx > 0.45) go(active - 1);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  /* Capture phase, so it runs before the link, the button and the
     click-to-centre handler — and only ever cancels a click that a drag
     produced. Clicks are never blocked outright. */
  const onClickCapture = (e: React.MouseEvent) => {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  // Card position/size lives in CSS (.fleet-stage / .fleet-card). slideW is
  // only the measured card width, used for the drag threshold.
  const activeCar = fleet[active];

  const arrowBase =
    "fleet-arrow absolute top-1/2 z-50 grid h-11 w-11 -translate-y-1/2 place-items-center " +
    "rounded-full border border-bone/20 bg-ink/40 text-bone/80 backdrop-blur-sm " +
    // focus ring lives in .fleet-arrow:focus-visible (globals.css) so the clay
    // survives — the utility shorthand resets outline-color to currentColor.
    "transition duration-300 hover:border-bone/40 hover:bg-ink/60 hover:text-bone " +
    "disabled:pointer-events-none disabled:opacity-20";

  return (
    <section
      id="fleet"
      ref={sectionRef}
      aria-label="Darb rental fleet"
      /* SECTION RULE, PERMANENT: no full-width horizontal rules anywhere in
         this section — no border-t/border-b on the heading block or the
         carousel wrapper, no <hr>, no ::before/::after dividers, and no focus
         ring on a full-width element (that was the cause twice). Clay is only
         for buttons and focus rings — the arrow buttons are deliberately
         bone-toned, with clay reserved for their focus ring. The one permitted
         divider is the short hairline inside the card between price and
         specs, at bone/15. */
      /* NO min-height and NO overflow-hidden here: the grid below unfolds in
         the document flow, and either one would clip it mid-open. Both are
         scoped to .fleet-viewport, which is the carousel's own box. */
      className="fleet-section relative bg-ink"
      style={{ scrollMarginTop: 0 }}
    >
      {/* The carousel's viewport: this is what owns the 100dvh sizing and the
          overflow clipping (the background is scaled 1.05 and the side cards
          overhang). Keeping flex-1 on the stage inside a FIXED-height box also
          stops the stage from collapsing when the grid adds page height. */}
      <div
        aria-roledescription="carousel"
        aria-label="Darb rental fleet carousel"
        className="fleet-viewport relative flex min-h-[100dvh] flex-col overflow-hidden"
      >
      {/* ------- layer 1: 16:9 landscape section background (no vehicle) ------- */}
      <div aria-hidden="true" className="absolute inset-0">
        {bgStack.map(({ slug, key }, i) => (
          /* The wrapper carries the crossfade (opacity + 1.06→1.00 scale);
             the img carries the blur and a small static scale to hide the
             blur's edge bleed. Blurring the image beats backdrop-filter on
             an overlay, which leaves a compositing seam across the section. */
          <div
            key={key}
            className={`absolute inset-0 ${
              i === bgStack.length - 1 && bgStack.length > 1 ? "coverflow-bg-in" : ""
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sectionBg(slug)}
              srcSet={sectionBgSet(slug)}
              sizes="100vw"
              alt=""
              className="h-full w-full object-cover"
              style={{ filter: "blur(4px)", transform: "scale(1.05)" }}
            />
          </div>
        ))}
        {/* 45% ink overlay + radial vignette */}
        <div className="absolute inset-0 bg-ink/45" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(17,17,16,0.75) 100%)",
          }}
        />
        {/* Warm the two ring neighbours. The window wraps with the ring, so at
            the seam (the last car) this preloads car 1, not nothing. */}
        {[active - 1, active + 1]
          .map((i) => wrapIndex(i, fleet.length))
          .map((i) => (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={fleet[i].slug}
              src={sectionBg(fleet[i].slug)}
              srcSet={sectionBgSet(fleet[i].slug)}
              sizes="100vw"
              alt=""
              className="hidden"
            />
          ))}
      </div>

      {/* ------- layer 3: heading — centred, fixed-size flex child ------- */}
      {/* The heading labels the section; the car is the hero. */}
      <div className="relative z-40 flex w-full flex-none flex-col items-center gap-3 px-6 pt-12 text-center">
        <p className="text-[12px] uppercase tracking-[0.3em] text-bone/60">The Fleet</p>
        {/* .fleet-headline carries the gradient fill. line-height + bottom
           padding so the serif descenders are not clipped — with
           background-clip:text a clipped descender also clips the gradient. */}
        <h2
          className="fleet-headline font-display"
          style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            lineHeight: 1.05,
            letterSpacing: "-0.02em",
            paddingBottom: "0.15em",
          }}
        >
          Choose your road.
        </h2>
      </div>

      {/* ------- layer 2: coverflow — flex:1 1 auto with min-height:0 ------- */}
      <div
        role="group"
        tabIndex={0}
        aria-label={`${activeCar.name}, slide ${active + 1} of ${fleet.length}. Use arrow keys to browse.`}
        onKeyDown={onKeyDown}
        onFocus={markInteracted}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        ref={stageRef}
        /* No focus-visible:outline here — this element is full-width, so a
           ring on it draws clay lines across the section. The ring is moved
           to the centre card in globals.css (.fleet-stage:focus-visible). */
        className="fleet-stage relative z-30 mt-8 flex min-h-0 flex-1 cursor-grab touch-pan-y select-none items-center justify-center overflow-visible py-4 active:cursor-grabbing md:mt-12"
        data-dragging={dragging ? "true" : "false"}
      >
        {fleet.map((car, i) => {
          /* Position is derived fresh from the wrapped offset every render, so
             each card animates only from its own previous transform to its new
             one — one step, shortest way round, never a rewind. */
          const d = wrappedOffset(i, active, fleet.length);
          const abs = Math.abs(d);
          return (
            <CoverflowCard
              key={car.slug}
              car={car}
              d={d}
              tier={tier}
              reduced={reduced}
              loaded={abs === 0 || (mounted && abs <= ringDepth(tier))}
              animKey={active}
              dragPx={dragPx}
              onSelect={
                d === 0
                  ? undefined
                  : () => {
                      markInteracted();
                      go(i);
                    }
              }
            />
          );
        })}

        {/* Arrows live inside the stage so they track the cards' vertical
           centre, but stop pointerdown so pressing one never starts a drag. */}
        {/* Never disabled: the ring wraps, so there is always a next and a
            previous car. */}
        <button
          type="button"
          aria-label="Previous car"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => step(-1)}
          className={`${arrowBase} left-3 md:left-6`}
        >
          <Chevron dir="left" />
        </button>
        <button
          type="button"
          aria-label="Next car"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => step(1)}
          className={`${arrowBase} right-3 md:right-6`}
        >
          <Chevron dir="right" />
        </button>
      </div>

      {/* ------- layer 3: "View all" trigger — 2rem below the carousel ------- */}
      {/* Deliberately not a filled clay button: clay stays reserved for
          booking. The underline is the width of the label, not the section —
          it is not a horizontal rule. */}
      <div className="pointer-events-none relative z-40 mt-8 flex flex-none justify-center pb-10">
        <button
          ref={viewAllRef}
          type="button"
          onClick={toggleGrid}
          aria-expanded={gridOpen}
          aria-controls={GRID_ID}
          className="fleet-viewall tap pointer-events-auto inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.1em] text-bone"
        >
          {gridOpen ? "Close" : "View all cars"}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="fleet-viewall-chevron h-4 w-4"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* live region for screen readers */}
      <div aria-live="polite" className="sr-only">
        {activeCar.name}, {priceSpoken(activeCar)}
      </div>
      </div>
      {/* /.fleet-viewport — everything below unfolds in normal flow */}

      <div ref={gridRef} className="fleet-grid-anchor">
        {gridMounted && (
          <FleetGrid
            id={GRID_ID}
            open={gridOpen}
            openCount={openCount}
            onOpened={onGridOpened}
          />
        )}
      </div>
    </section>
  );
}
