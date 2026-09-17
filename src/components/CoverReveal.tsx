"use client";

import { useEffect, useRef, useState } from "react";
import { bookingLink } from "@/lib/whatsapp";
import { getLenis, scrollToTarget } from "@/lib/scroll";

/* ============================ cover-reveal hero ============================
   One implementation, two frame sets. Phones and desktops run the SAME scrub,
   the same beat logic and the same markup — only the config below differs —
   so a fix to one can never silently miss the other.

   Layout is NOT in the config. It lives in globals.css (.cr-*) behind the same
   768px breakpoint the mode store uses, which is what lets the server render
   one static markup that already looks right on either device before the
   client has decided which sequence to run. */

export type Beat = "covered" | "lifting" | "revealed";
export type BeatRange = { key: Beat; from: number; to: number };

export type RevealConfig = {
  /** 1-based frame index -> URL */
  frame: (i: number) => string;
  count: number;
  /** pin distance in viewport heights */
  scrollVh: number;
  /** source frame width, so the canvas never allocates past what it can show */
  sourceWidth: number;
  /** parallel fetches while preloading */
  lanes: number;
  /** at or below this viewport aspect, fit the frame to WIDTH and anchor it to
      the bottom instead of cover-cropping. Must match the CSS media query. */
  widthFitMaxAspect?: number;
  beats: readonly BeatRange[];
};

const pad2 = (i: number) => String(i).padStart(2, "0");

/* --------------------------------- MOBILE ---------------------------------
   16 frames, 4fps, 1080x1920, from assets/hero-mobile-source.mp4. 788KB.
   Beats read off the frames and confirmed on enlarged crops:
     01-05 cover fully draped · 06 hem first rises · 08 headlights light ·
     13 cover still across the roof · 14 roof and windscreen clear */
export const MOBILE: RevealConfig = {
  frame: (i) => `/hero/mobile/frame-${pad2(i)}.webp`,
  count: 16,
  scrollVh: 1.4,
  sourceWidth: 1080,
  lanes: 4,
  beats: [
    { key: "covered", from: 1, to: 5 },
    { key: "lifting", from: 6, to: 13 },
    { key: "revealed", from: 14, to: 16 },
  ],
};

/* --------------------------------- DESKTOP --------------------------------
   32 frames, 8fps, 1920x1080, from assets/hero-desktop-cover.mp4. 2.74MB.
   Beats read off a 32-frame contact sheet, then confirmed on enlarged crops of
   the car band (03-10) and of the roofline itself (27-31):
     01-03 cover fully draped, hem on the floor
     04    hem lifts, a light gap opens beneath it
     07    number plate appears under the hem
     10    fog lights and headlights come on
     29    a lip of cover still lies across the top of the windscreen
     30    roof clear, roof rails visible — the car reads complete
   As on mobile, the headlights are lit long before the car is uncovered (10
   vs 30); REVEALED follows the brief's "fully uncovered" definition. */
export const DESKTOP: RevealConfig = {
  frame: (i) => `/hero/desktop/frame-${pad2(i)}.webp`,
  count: 32,
  scrollVh: 2.0,
  sourceWidth: 1920,
  lanes: 6,
  /* At 4:3 and taller (tablets, a 1024x768 window) cover-cropping scales the
     frame to height and trims the sides, so the car fills the middle and there
     is no clean wall left for the copy — measured: headline and CTA both on the
     car at 1024x768. Fitting to width and sitting the frame on the bottom opens
     a band of dark wall above it instead. Mirrors .cr-poster in globals.css. */
  widthFitMaxAspect: 1.4,
  beats: [
    { key: "covered", from: 1, to: 3 },
    { key: "lifting", from: 4, to: 29 },
    { key: "revealed", from: 30, to: 32 },
  ],
};

const ramp = (v: number, a: number, b: number) =>
  a === b ? (v >= b ? 1 : 0) : Math.min(1, Math.max(0, (v - a) / (b - a)));

/* Replays the existing heroWord reveal (blur clearing, letter-spacing
   contracting, word rising). Removing the class and forcing a reflow before
   re-adding is what restarts a CSS animation. */
function playWords(root: HTMLElement | null) {
  if (!root) return;
  root.querySelectorAll<HTMLElement>("[data-word]").forEach((w, i) => {
    w.classList.remove("hero-word");
    void w.offsetWidth;
    w.style.animationDelay = `${i * 0.1}s`;
    w.classList.add("hero-word");
  });
}

/* Restarts the existing heroRule / heroFade animations on the lockup, so the
   hairline draws and DARB, BY KAHRAMANAH and the CTA cascade in at the moment
   of the reveal — not once at page load, where they would already have
   finished while the lockup was still invisible. */
function playLockup(root: HTMLElement | null) {
  if (!root) return;
  root.querySelectorAll<HTMLElement>("[data-lock]").forEach((el) => {
    const cls = el.dataset.lock!;
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  });
}

/* Applied only when scripting is off. Mirrors the static-hero rules in
   globals.css (.cr-* under reduced motion / data-hero-failed). */
const NOSCRIPT_CSS =
  "section[data-hero] .cr-line,section[data-hero] .cr-lockup{opacity:1!important}" +
  "section[data-hero] .cr-covered{display:none}" +
  "section[data-hero] .cr-scrim{opacity:1}";

const SHADOW = "0 2px 24px rgba(17,17,16,0.85), 0 1px 4px rgba(17,17,16,0.6)";

/* The section a visitor was linked to, if any. */
function hashTarget() {
  const id = decodeURIComponent(window.location.hash.slice(1));
  return id ? document.getElementById(id) : null;
}

/* Instant jump to the very top. Once Lenis is up it owns the scroll, and its
   immediate scrollTo sets the native position itself; before that, this goes
   through the scroll helper, which does window.scrollTo(0, 0). Either way
   src/lib/scroll.ts stays the only file with a native scroll call in it. */
function toTop() {
  const lenis = getLenis();
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else scrollToTarget(document.documentElement, { immediate: true });
}

/**
 * With a config: the pinned, scroll-scrubbed reveal.
 * With `config={null}`: the static hero — reduced motion, and the markup the
 * server ships to every client before it knows the viewport. Poster, full
 * headline, lockup and CTA; no canvas, no frames, no pin.
 */
export default function CoverReveal({ config }: { config: RevealConfig | null }) {
  const [ready, setReady] = useState(false);
  // every frame failed to load: fall back to the finished still and full copy
  const [failed, setFailed] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const coveredRef = useRef<HTMLParagraphElement>(null);
  const line1Ref = useRef<HTMLSpanElement>(null);
  const line2Ref = useRef<HTMLSpanElement>(null);
  const lockupRef = useRef<HTMLDivElement>(null);

  const framesRef = useRef<(ImageBitmap | HTMLImageElement)[]>([]);
  const drawnRef = useRef(-1);
  const wantRef = useRef(-1);
  const playedRef = useRef<Record<string, boolean>>({ covered: true });

  /* ------------------------- start on frame one -------------------------- */
  useEffect(() => {
    // arrived via a link to a section ("Back to the fleet" is /#fleet): leave it
    if (hashTarget()) return;
    toTop();
  }, []);

  /* ---------------- preload, THEN pin — never the other way --------------- */
  useEffect(() => {
    if (!config) return;

    const canvas = canvasRef.current;
    const pin = pinRef.current;
    const section = sectionRef.current;
    if (!canvas || !pin || !section) return;

    let cancelled = false;
    let kill = () => {};

    /* Deliberate input from the visitor while the frames download. If they
       have scrolled, they meant it, and nothing below yanks them back up. */
    /* Input only — never a bare scroll event, which cannot tell a person from
       a script. That covers every way a person scrolls: wheel and trackpad,
       touch, keyboard, and the scrollbar (a scrollbar press reaches the page
       as pointerdown in Chrome — measured). */
    let userScrolled = false;
    const markIntent = () => {
      userScrolled = true;
    };
    const INTENT = ["wheel", "touchmove", "keydown", "pointerdown"] as const;
    INTENT.forEach((t) => window.addEventListener(t, markIntent, { passive: true }));

    const beat = (k: Beat) => config.beats.find((b) => b.key === k)!;
    const COVERED = beat("covered");
    const LIFTING = beat("lifting");
    const REVEALED = beat("revealed");
    const COUNT = config.count;

    const supportsBitmap = typeof createImageBitmap === "function";
    const load = (i: number): Promise<ImageBitmap | HTMLImageElement> =>
      supportsBitmap
        ? fetch(config.frame(i))
            .then((r) => r.blob())
            .then((b) => createImageBitmap(b))
        : new Promise((res, rej) => {
            const img = new Image();
            img.onload = () => res(img);
            img.onerror = rej;
            img.src = config.frame(i);
          });

    const preload = async () => {
      const out: (ImageBitmap | HTMLImageElement)[] = new Array(COUNT);
      let next = 0;
      await Promise.all(
        Array.from({ length: config.lanes }, async () => {
          while (!cancelled) {
            const i = next++;
            if (i >= COUNT) return;
            try {
              out[i] = await load(i + 1);
            } catch {
              /* a hole must not block the scrub; the painter holds the last
                 frame it successfully drew */
            }
          }
        })
      );
      return out;
    };

    /* Created ONCE. alpha:false lets the compositor skip blending the canvas
       against what is behind it; desynchronized:true lets it present without
       waiting in lockstep with the rest of the frame. */
    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    }) as CanvasRenderingContext2D | null;
    if (!ctx) return;

    /* object-cover: fill the canvas, preserve aspect ratio, centre-crop.
       Except on low-aspect desktop viewports, where the frame is fitted to
       width and sits on the bottom edge (see widthFitMaxAspect). */
    const paint = (index: number) => {
      const frame = framesRef.current[index - 1];
      if (!frame) return false;
      const cw = canvas.width;
      const ch = canvas.height;
      const fitWidth =
        config.widthFitMaxAspect !== undefined && cw / ch <= config.widthFitMaxAspect;
      const s = fitWidth
        ? cw / frame.width
        : Math.max(cw / frame.width, ch / frame.height);
      const w = frame.width * s;
      const h = frame.height * s;
      if (fitWidth) {
        // alpha:false canvases clear to pure black; the band must be ink
        ctx.fillStyle = "#111110";
        ctx.fillRect(0, 0, cw, ch);
      }
      ctx.drawImage(frame, (cw - w) / 2, fitWidth ? ch - h : (ch - h) / 2, w, h);
      return true;
    };

    const resize = () => {
      const r = pin.getBoundingClientRect();
      /* Capped at 2, and never past the source's own resolution: a 1920
         frame on a 2x laptop gains nothing from a 3840px backing store, it
         only quadruples the fill cost per scrubbed frame. */
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        2,
        Math.max(1, config.sourceWidth / Math.max(1, r.width))
      );
      canvas.width = Math.max(1, Math.round(r.width * dpr));
      canvas.height = Math.max(1, Math.round(r.height * dpr));
      const cur = drawnRef.current > 0 ? drawnRef.current : 1;
      paint(cur); // geometry changed, repaint unconditionally
      drawnRef.current = cur;
    };

    const applyOverlays = (f: number) => {
      // scrim strengthens as the frame brightens
      if (scrimRef.current) {
        scrimRef.current.style.opacity = String(
          0.25 + 0.75 * ramp(f, LIFTING.from, REVEALED.from)
        );
      }

      /* "Something is waiting." is FULLY up on frame 1 — where a visitor who
         has not scrolled sits — and leaves as the lift bites. */
      const coveredOp = 1 - ramp(f, COVERED.to - 1, LIFTING.from + 1);
      if (coveredRef.current) coveredRef.current.style.opacity = String(coveredOp);

      // "Your Journey" enters with the lift and STAYS for the rest
      const l1 = ramp(f, LIFTING.from, LIFTING.from + 2);
      /* "Starts Here." is a hard step on the first fully-revealed frame. That
         single sync is the point of the sequence, so it does not ease in. */
      const l2 = ramp(f, REVEALED.from, REVEALED.from);
      if (line1Ref.current) line1Ref.current.style.opacity = String(l1);
      if (line2Ref.current) line2Ref.current.style.opacity = String(l2);

      const lock = f >= REVEALED.from ? 1 : 0;
      if (lockupRef.current) lockupRef.current.style.opacity = String(lock);

      const fire = (
        key: string,
        on: boolean,
        el: HTMLElement | null,
        play: (el: HTMLElement | null) => void
      ) => {
        if (on && !playedRef.current[key]) {
          playedRef.current[key] = true;
          play(el);
        } else if (!on) {
          playedRef.current[key] = false;
        }
      };
      fire("covered", coveredOp > 0.5, coveredRef.current, playWords);
      fire("l1", f >= LIFTING.from, line1Ref.current, playWords);
      fire("l2", f >= REVEALED.from, line2Ref.current, playWords);
      fire("lock", f >= REVEALED.from, lockupRef.current, playLockup);
    };

    (async () => {
      /* Frames and GSAP load side by side; the pin waits for BOTH. It is never
         created, and so never measured, while the frames are still arriving. */
      const [frames, { default: gsap }, { ScrollTrigger }] = await Promise.all([
        preload(),
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);
      framesRef.current = frames;

      /* Guard for anything that ran DURING the preload. Lenis coming up, a
         resize, or another section re-syncing metrics may already have called
         ScrollTrigger.refresh(), and ScrollTrigger records the scroll position
         at every refresh and restores it at the end of the next one. Clearing
         that memory stops a stale position being put back into the new pin.
         Passing "manual" matters as well: after EVERY refresh ScrollTrigger
         re-applies the scrollRestoration value it saw at startup.
         Unless the visitor scrolled on purpose: top, create, refresh, then
         Lenis re-measures — in that order, in one synchronous block. */
      /* Nothing came down at all (offline mid-load, a blocked CDN): no pin,
         no canvas — the finished still with the full headline and CTA. */
      if (!frames.some(Boolean)) {
        setFailed(true);
        return;
      }

      const target = hashTarget();
      const mayReset = () => !userScrolled && !target;
      if (mayReset()) toTop();
      ScrollTrigger.clearScrollMemory("manual");

      /* Steps 4 to 7 — create, Lenis re-measure, refresh, final reset — run in
         ONE synchronous block with no await between them. Every automatic
         ScrollTrigger refresh (resize, load, visibilitychange) is dispatched
         from the event loop, so none can land in the middle of this block:
         that is the guard. The pin is measured once, against the finished
         document, and nothing re-measures it half-built. */

      const st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: () => `+=${window.innerHeight * config.scrollVh}`,
        pin,
        pinSpacing: true,
        /* 0.6, not `true`: ScrollTrigger eases its own progress toward the
           scroll position, so coarse wheel and touch deltas stop snapping the
           sequence frame to frame. The value that settled the judder. */
        scrub: 0.6,
        invalidateOnRefresh: true,
      });
      getLenis()?.resize();
      ScrollTrigger.refresh();
      // refresh can itself move the scroll position: settle it one last time
      if (mayReset()) toTop();

      // the pin spacer moved every section below it: land the deep link again
      if (target) scrollToTarget(target, { immediate: true });

      resize();
      window.addEventListener("resize", resize);

      /* Draw from the ticker, NOT from onUpdate. Scroll events arrive in
         bursts and can land several times between paints — or not at all
         while the scrub is still easing toward its target. Reading progress
         once per frame matches the draw to the display, not to the input. */
      const tick = () => {
        /* SAFETY NET. Until the visitor has scrolled for real, frame one and
           frame one's copy are all there is, whatever progress claims. A
           visitor who has not scrolled must never see anything else. */
        const i = userScrolled
          ? Math.min(COUNT, Math.max(1, Math.round(st.progress * (COUNT - 1)) + 1))
          : 1;
        if (i === wantRef.current) return;
        wantRef.current = i;
        if (i === drawnRef.current) return;
        if (!paint(i)) return; // frame missing: hold the last good one
        drawnRef.current = i;
        applyOverlays(i);
      };

      gsap.ticker.add(tick);
      drawnRef.current = -1;
      wantRef.current = -1;
      tick();
      // only now — pin measured, current frame painted — does the canvas show
      setReady(true);

      kill = () => {
        gsap.ticker.remove(tick);
        window.removeEventListener("resize", resize);
        st.kill();
      };
    })();

    return () => {
      cancelled = true;
      INTENT.forEach((t) => window.removeEventListener(t, markIntent));
      kill();
    };
  }, [config]);

  const running = !!config && !failed;

  /* -------------------------------- render ------------------------------- */
  return (
    <section
      ref={sectionRef}
      className="relative"
      aria-label="Darb"
      data-hero=""
      data-hero-failed={failed ? "" : undefined}
    >
      <div ref={pinRef} className="relative h-[100dvh] w-full overflow-hidden bg-ink">
        {/* Poster: what is on screen before the frames arrive. It is FRAME ONE,
            the covered car — the same image the sequence then starts on — so a
            slow load looks like the start of the reveal, never its end. (It used
            to be the final frame with the full headline, which on a slow
            connection read as the sequence having already played.)
            Reduced motion never runs the sequence, so it gets the finished still.
            <picture> lets the browser pick exactly one of the four. */}
        <picture>
          <source
            media="(prefers-reduced-motion: reduce) and (max-width: 767px)"
            srcSet="/hero/mobile-still.webp"
          />
          <source media="(prefers-reduced-motion: reduce)" srcSet="/hero/desktop-still.webp" />
          <source media="(max-width: 767px)" srcSet="/hero/mobile/frame-01.webp" />
          <img
            src="/hero/desktop/frame-01.webp"
            alt="A Darb rental car in the Darb garage in Amman."
            className="cr-poster absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        </picture>

        {/* No JavaScript means no sequence: show the finished still and copy. */}
        <noscript>
          <picture>
            <source media="(max-width: 767px)" srcSet="/hero/mobile-still.webp" />
            <img
              src="/hero/desktop-still.webp"
              alt=""
              className="cr-poster absolute inset-0 h-full w-full object-cover"
            />
          </picture>
          <style>{NOSCRIPT_CSS}</style>
        </noscript>

        {failed && (
          <picture>
            <source media="(max-width: 767px)" srcSet="/hero/mobile-still.webp" />
            <img
              src="/hero/desktop-still.webp"
              alt=""
              className="cr-poster absolute inset-0 h-full w-full object-cover"
            />
          </picture>
        )}

        {running && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 h-full w-full transition-opacity duration-500"
            style={{ opacity: ready ? 1 : 0 }}
          />
        )}

        {/* Top-down scrim. Stacks with the text-shadow rather than replacing
            it. Its starting strength is frame one's (globals.css, .cr-scrim);
            the static hero takes it to full; per-frame once the sequence runs. */}
        <div
          ref={scrimRef}
          aria-hidden="true"
          className="cr-scrim absolute inset-0"
          style={{
            background: "linear-gradient(180deg, rgba(17,17,16,0.6) 0%, rgba(17,17,16,0) 45%)",
          }}
        />

        {/* Width-fit layouts only (display:none elsewhere, see globals.css):
            feathers the frame's top edge into the ink band above it. */}
        <div aria-hidden="true" className="cr-seam" />

        <div className="cr-copy">
          {/* Rendered by the server too, so frame one's copy is on screen from
              the first paint rather than appearing only once the client has
              chosen a sequence. Hidden by CSS wherever the static hero applies
              (reduced motion, no JS, failed load). Opacity is CSS until the
              sequence runs, then per-frame inline. */}
          <p
            ref={coveredRef}
            className="cr-covered font-display italic whitespace-nowrap text-bone"
            style={{ textShadow: SHADOW }}
          >
            <span data-word="" className="hero-word">
              Something is waiting.
            </span>
          </p>

          {/* Exactly two lines, always. Each line is its own nowrap element, so
              no viewport width and no mid-animation letter-spacing can push a
              word onto a new row. The gap is an explicit 0.28em margin, never a
              space character: a trailing space inside an inline-block is
              trimmed by inline layout. The sr-only spaces are there only so
              assistive tech reads "Your Journey Starts Here." as words. */}
          <h1 className="cr-headline font-display text-bone" style={{ textShadow: SHADOW }}>
            <span ref={line1Ref} data-line="" className="mh-beat cr-line">
              <span data-word="" className="inline-block" style={{ marginRight: "0.28em" }}>
                {"Your"}
              </span>
              <span className="sr-only"> </span>
              <span data-word="" className="inline-block">
                {"Journey"}
              </span>
            </span>
            <span className="sr-only"> </span>
            <span ref={line2Ref} data-line="" className="mh-beat cr-line">
              <span data-word="" className="inline-block" style={{ marginRight: "0.28em" }}>
                {"Starts"}
              </span>
              <span className="sr-only"> </span>
              <span data-word="" className="inline-block">
                {"Here."}
              </span>
            </span>
          </h1>

          <div ref={lockupRef} className="mh-beat cr-lockup flex flex-col">
            <div aria-hidden="true" data-lock="hero-rule" className="hero-rule cr-rule h-px bg-bone/40" />
            <p
              data-lock="hero-brand"
              className="hero-brand cr-darb font-display text-xl tracking-[0.55em] text-bone"
              style={{ animationDelay: "0.15s" }}
            >
              DARB
            </p>
            <p
              data-lock="hero-brand"
              className="hero-brand cr-by font-body tracking-[0.32em] text-bone/70"
              style={{ animationDelay: "0.25s" }}
            >
              BY KAHRAMANAH
            </p>
            <a
              href={bookingLink()}
              target="_blank"
              rel="noopener noreferrer"
              data-lock="hero-brand"
              className="hero-brand cr-cta inline-flex min-h-[44px] items-center px-8 py-3 font-body text-sm uppercase tracking-[0.12em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay"
              style={{ animationDelay: "0.4s" }}
            >
              Book on WhatsApp
            </a>
          </div>
        </div>

        <button
          type="button"
          aria-label="Scroll to the fleet"
          onClick={() => scrollToTarget("#fleet")}
          className="absolute bottom-6 left-1/2 z-10 grid h-11 w-11 -translate-x-1/2 cursor-pointer place-items-center rounded-full text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
        >
          <svg
            aria-hidden="true"
            className="scroll-cue-float h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
