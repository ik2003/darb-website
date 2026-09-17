/* Torn-paper edge, as an SVG clip-path.

   NOT a PNG mask and NOT a jagged CSS border: a clip-path in
   objectBoundingBox units is resolution-independent, so the same path stays
   crisp at 390px and at 2560px with no extra assets and no re-export.

   The jitter is generated once at module load from a FIXED seed. It must be
   deterministic — Math.random() here would give the server a different edge
   from the browser and hydration would tear. */

const seeded = (seed: number) => () => {
  // LCG (Numerical Recipes). Cheap, stable, good enough for paper fibre.
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

/** Offsets from the base position along the edge, in bounding-box units. */
function jitter(steps: number, amp: number, seed: number): number[] {
  const rnd = seeded(seed);
  const out: number[] = [];
  for (let i = 0; i <= steps; i++) {
    // A constant small tremor, plus an occasional longer fibre pulling
    // inward — torn paper is irregular in scale, not only in position.
    const tremor = (rnd() - 0.5) * amp;
    const fibre = rnd() < 0.16 ? -rnd() * amp * 1.9 : 0;
    out.push(tremor + fibre);
  }
  // Pin both ends flush so the edge meets the corners cleanly.
  out[0] = 0;
  out[steps] = 0;
  return out;
}

const f = (n: number) => n.toFixed(4);

/* Vertical edge (desktop): down the right side of the left half.
   0.012 of a 55vw half is ~12.7px at 1920 and ~9px at 1366. 48 steps over a
   1080px height is ~22px between points — comfortably wider than the
   amplitude, which is what reads as a tear rather than a sawtooth. */
const V_STEPS = 48;
const V_BASE = 0.988;
const V_PTS: [number, number][] = jitter(V_STEPS, 0.012, 20260811).map((d, i) => [
  V_BASE + d,
  i / V_STEPS,
]);

/* Horizontal edge (mobile): along the bottom of the 55vh image.
   0.026 of ~464px is ~12px. FEWER steps than the vertical edge on purpose:
   the mobile edge spans only ~390px, so 48 points would sit 8px apart and a
   ±12px amplitude would comb it into a sawtooth. 28 keeps the same
   spacing-to-amplitude ratio the vertical edge has. */
const H_STEPS = 28;
const H_BASE = 0.985;
const H_PTS: [number, number][] = jitter(H_STEPS, 0.026, 77712025).map((d, i) => [
  i / H_STEPS,
  H_BASE + d,
]);

const poly = (pts: [number, number][], cmd = "L") =>
  pts.map(([x, y]) => `${cmd}${f(x)},${f(y)}`).join(" ");

/** The torn edge alone — stroked to give it the lit paper highlight. */
export const TORN_EDGE_V = `M${f(V_PTS[0][0])},${f(V_PTS[0][1])} ${poly(V_PTS.slice(1))}`;
export const TORN_EDGE_H = `M${f(H_PTS[0][0])},${f(H_PTS[0][1])} ${poly(H_PTS.slice(1))}`;

/** Closed shapes for the clipPath: the half, bounded by its torn edge. */
export const TORN_CLIP_V = `M0,0 ${poly(V_PTS)} L0,1 Z`;
export const TORN_CLIP_H = `M0,0 L1,0 ${poly([...H_PTS].reverse())} L0,0 Z`;
