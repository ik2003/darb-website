"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CarImage } from "@/data/fleet";
import { TORN_CLIP_H, TORN_CLIP_V, TORN_EDGE_H, TORN_EDGE_V } from "@/lib/tornEdge";

const DUR = 600;
/* Two curves that must never be swapped: going outside is a rotation, going
   inside is a jump. Sharing an easing would flatten that distinction. */
const EASE_SLIDE = "cubic-bezier(0.16, 1, 0.3, 1)";
const EASE_PUSH_OUT = "cubic-bezier(0.7, 0, 0.84, 0)";

const DRAG_COMMIT = 0.18; // fraction of width that commits a swipe

export default function CarGallery({ images }: { images: CarImage[] }) {
  const multi = images.length > 1;
  const [current, setCurrent] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const busy = useRef(false);
  const drag = useRef({ on: false, startX: 0, dx: 0, dir: 0, preview: false });

  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const wrap = useCallback((i: number) => ((i % images.length) + images.length) % images.length, [
    images.length,
  ]);

  const clearInline = (el: HTMLElement | null) => {
    if (!el) return;
    el.style.removeProperty("transform");
    el.style.removeProperty("opacity");
    el.style.removeProperty("z-index");
  };

  /** Move to `next`. `fromPx` lets a released drag continue from where the
   *  finger left off instead of snapping back to zero first. */
  const goTo = useCallback(
    (next: number, dirHint?: number, fromPx = 0) => {
      const n = wrap(next);
      if (busy.current || n === current || !multi) return;
      const from = slideRefs.current[current];
      const to = slideRefs.current[n];
      const width = boxRef.current?.clientWidth ?? 1;
      const dir = dirHint ?? (n > current ? 1 : -1); // 1 = forward/left

      if (!from || !to || reduced) {
        setCurrent(n);
        return;
      }

      // Going INTO an interior shot is a push-through, not a slide.
      const push = images[n].kind === "interior";
      busy.current = true;

      from.style.opacity = "1";
      from.style.zIndex = "2";
      to.style.opacity = "1";
      to.style.zIndex = "3";

      const opts = { duration: DUR, fill: "forwards" as const };
      const a1 = push
        ? from.animate(
            [
              { transform: "scale(1)", opacity: 1 },
              { transform: "scale(2.4)", opacity: 0 },
            ],
            { ...opts, easing: EASE_PUSH_OUT }
          )
        : from.animate(
            [
              { transform: `translateX(${fromPx}px)` },
              { transform: `translateX(${-dir * width}px)` },
            ],
            { ...opts, easing: EASE_SLIDE }
          );
      const a2 = push
        ? to.animate(
            [
              { transform: "scale(0.82)", opacity: 0 },
              { transform: "scale(1)", opacity: 1 },
            ],
            { ...opts, easing: EASE_SLIDE }
          )
        : to.animate(
            [
              { transform: `translateX(${dir * width + fromPx}px)` },
              { transform: "translateX(0px)" },
            ],
            { ...opts, easing: EASE_SLIDE }
          );

      Promise.all([a1.finished, a2.finished])
        .catch(() => {})
        .finally(() => {
          setCurrent(n);
          // Next frame: React has flipped data-active, so dropping the
          // forwards-filled animation cannot flash the old slide.
          requestAnimationFrame(() => {
            a1.cancel();
            a2.cancel();
            clearInline(from);
            clearInline(to);
            busy.current = false;
          });
        });
    },
    [current, images, multi, reduced, wrap]
  );

  /* ---- pointer drag: live follow for slides, threshold for push ---- */
  const onPointerDown = (e: React.PointerEvent) => {
    if (!multi || busy.current) return;
    drag.current = { on: true, startX: e.clientX, dx: 0, dir: 0, preview: false };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.on || busy.current) return;
    d.dx = e.clientX - d.startX;
    if (Math.abs(d.dx) < 2) return;
    const dir = d.dx < 0 ? 1 : -1;
    const neighbour = wrap(current + dir);
    d.dir = dir;
    // An interior target has no drag analogue — a push-through cannot be
    // scrubbed. Track the distance for the threshold, but do not preview.
    d.preview = images[neighbour].kind !== "interior" && !reduced;
    if (!d.preview) return;
    const width = boxRef.current?.clientWidth ?? 1;
    const cur = slideRefs.current[current];
    const nb = slideRefs.current[neighbour];
    if (cur) cur.style.transform = `translateX(${d.dx}px)`;
    if (nb) {
      nb.style.opacity = "1";
      nb.style.zIndex = "3";
      nb.style.transform = `translateX(${dir * width + d.dx}px)`;
    }
  };

  const onPointerUp = () => {
    const d = drag.current;
    if (!d.on) return;
    d.on = false;
    const width = boxRef.current?.clientWidth ?? 1;
    const committed = Math.abs(d.dx) > width * DRAG_COMMIT;
    const dir = d.dir || (d.dx < 0 ? 1 : -1);
    const neighbour = wrap(current + dir);

    if (committed && d.dx !== 0) {
      goTo(neighbour, dir, d.preview ? d.dx : 0);
      return;
    }
    // Not far enough: spring the preview back.
    if (d.preview) {
      const cur = slideRefs.current[current];
      const nb = slideRefs.current[neighbour];
      const opts = { duration: 320, easing: EASE_SLIDE, fill: "forwards" as const };
      const back: Animation[] = [];
      if (cur)
        back.push(
          cur.animate(
            [{ transform: `translateX(${d.dx}px)` }, { transform: "translateX(0px)" }],
            opts
          )
        );
      if (nb)
        back.push(
          nb.animate(
            [
              { transform: `translateX(${dir * width + d.dx}px)` },
              { transform: `translateX(${dir * width}px)` },
            ],
            opts
          )
        );
      Promise.all(back.map((a) => a.finished))
        .catch(() => {})
        .finally(() => {
          back.forEach((a) => a.cancel());
          clearInline(cur);
          clearInline(nb);
        });
    }
    d.dx = 0;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!multi) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(current + 1, 1);
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(current - 1, -1);
    }
  };

  const progress = multi ? (current + 1) / images.length : 1;

  return (
    <div className="relative flex flex-col lg:h-full lg:w-[55%]">
      {/* clip-path + highlight geometry. objectBoundingBox units, so one path
          serves every viewport with no re-export. */}
      <svg aria-hidden="true" className="pointer-events-none absolute h-0 w-0">
        <defs>
          <clipPath id="torn-v" clipPathUnits="objectBoundingBox">
            <path d={TORN_CLIP_V} />
          </clipPath>
          <clipPath id="torn-h" clipPathUnits="objectBoundingBox">
            <path d={TORN_CLIP_H} />
          </clipPath>
        </defs>
      </svg>

      <div
        ref={boxRef}
        role={multi ? "group" : undefined}
        aria-roledescription={multi ? "carousel" : undefined}
        aria-label={multi ? "Vehicle gallery. Use arrow keys to browse." : undefined}
        tabIndex={multi ? 0 : -1}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`car-gallery-box relative h-[55dvh] w-full touch-pan-y select-none overflow-hidden lg:h-full ${
          multi ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        {/* The clipped stack. The highlight is drawn OUTSIDE this element —
            inside, the clip would eat half the stroke. */}
        <div className="car-torn absolute inset-0">
          {images.map((img, i) => (
            <div
              key={img.src + i}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="car-slide absolute inset-0"
              data-active={i === current ? "true" : "false"}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                srcSet={img.srcSet}
                /* Below 1024 the image is full-bleed; above it, 55% of the
                   viewport. Without this a 390px phone would pull the 896. */
                sizes="(min-width: 1024px) 55vw, 100vw"
                alt={img.alt}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                className="h-full w-full object-cover"
              />
            </div>
          ))}
        </div>

        {/* Torn-edge highlight: a stroked copy of the same path, catching light
            like a torn paper fibre. non-scaling-stroke keeps it hairline-thin
            even though the viewBox is stretched by preserveAspectRatio=none. */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1 1"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 h-full w-full"
        >
          <path
            d={TORN_EDGE_H}
            className="lg:hidden"
            fill="none"
            stroke="var(--color-bone)"
            strokeWidth={1.25}
            strokeOpacity={0.55}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={TORN_EDGE_V}
            className="hidden lg:block"
            fill="none"
            stroke="var(--color-bone)"
            strokeWidth={1.25}
            strokeOpacity={0.55}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {/* Counter + progress line. Hidden entirely for a single image —
            "01 / 01" reads as broken. */}
        {multi && (
          <div className="pointer-events-none absolute bottom-6 left-6 z-10 w-28">
            <p className="text-[13px] tracking-[0.15em] text-bone">
              {String(current + 1).padStart(2, "0")}
              <span className="text-bone/45"> / {String(images.length).padStart(2, "0")}</span>
            </p>
            <div className="mt-2 h-px w-full bg-bone/25">
              <div
                className="h-px bg-clay transition-[width] duration-500 ease-out"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Dots: absolute at the image's right edge on desktop, in flow beneath
          it on mobile — one element, repositioned, so there is only ever one
          set of controls for assistive tech. */}
      {multi && (
        <div className="flex flex-row items-center justify-center gap-[14px] py-5 lg:absolute lg:right-6 lg:top-1/2 lg:z-10 lg:flex-col lg:-translate-y-1/2 lg:py-0">
          {images.map((img, i) => (
            <button
              key={img.src + i}
              type="button"
              onClick={() => goTo(i, i > current ? 1 : -1)}
              aria-label={`View image ${i + 1} of ${images.length}: ${img.alt}`}
              aria-current={i === current ? "true" : undefined}
              className="car-dot"
              data-active={i === current ? "true" : "false"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
