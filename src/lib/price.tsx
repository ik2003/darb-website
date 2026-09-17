import type { Car } from "@/data/fleet";

/* THE one place a daily rate becomes text. Four components used to each carry
   their own copy of `${car.pricePerDay} JOD`, which is how the detail page
   ended up saying "/ DAY" while the card said "/ day". Import from here; do
   not re-derive the string locally.

   Every car in the fleet has a real rate, so the zero fallback below is
   currently unreachable. It stays because the alternative failure — a new car
   added with pricePerDay unset rendering as "0 JOD / day" — is worse than the
   honest string. Guard structured data with `hasPrice` instead: a price of 0
   in JSON-LD tells search engines the car is free. */

export const PRICE_CURRENCY = "JOD";
export const PRICE_UNAVAILABLE = "Price on request";

/** True when this car has a real rate to show. */
export const hasPrice = (car: Car) => car.pricePerDay > 0;

/** "35 JOD" — amount only, no period. */
const amount = (car: Car) => `${car.pricePerDay} ${PRICE_CURRENCY}`;

/** "35 JOD / day" — the canonical written form, for visible plain text. */
export const priceLabel = (car: Car) =>
  hasPrice(car) ? `${amount(car)} / day` : PRICE_UNAVAILABLE;

/** "35 JOD per day" — spoken form, for aria-labels and live regions where
    a screen reader would otherwise read the slash as "slash". */
export const priceSpoken = (car: Car) =>
  hasPrice(car) ? `${amount(car)} per day` : PRICE_UNAVAILABLE.toLowerCase();

/** The rendered form: amount at full prominence, "/ day" at 60% and dimmed.
    Sizing comes from whatever class the parent sets — this owns the content
    and the internal proportion, never the absolute size. */
export function PricePerDay({ car }: { car: Car }) {
  if (!hasPrice(car)) return <span className="text-bone">{PRICE_UNAVAILABLE}</span>;
  return (
    <>
      {amount(car)}
      <span className="text-[0.6em] text-bone/60"> / day</span>
    </>
  );
}
