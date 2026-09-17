import {
  ADDRESS,
  HOURS,
  WHATSAPP_PRIMARY,
  WHATSAPP_SECONDARY,
} from "@/data/site";
import { bookingLink, enquiryLink } from "@/lib/whatsapp";

/* Resolved from the Google Maps short link, not guessed:
   https://maps.app.goo.gl/cwKGFWC7r7NWtD6h6 302s to a place URL carrying
   these coordinates. Registered name on the listing is
   "شركة كهرمانة لتاجير السيارات السياحية" (Kahramana Company for Touristic
   Car Rental) — the parent company behind the Darb brand. */
const LAT = 31.9754647;
const LNG = 35.8622393;

const DIRECTIONS = `https://www.google.com/maps/dir/?api=1&destination=${LAT},${LNG}`;

/* The composite in /public/map is centred on the coordinates above, so the pin
   belongs at dead centre. Measured at render time as 50.04% / 49.99%. */
const PIN_X = "50.04%";
const PIN_Y = "49.99%";

/** Grouped for reading. The href always comes from the whatsapp helpers. */
const telLabel = (n: string) =>
  `+${n.slice(0, 3)} ${n.slice(3, 4)} ${n.slice(4, 8)} ${n.slice(8)}`;

export default function Location() {
  return (
    <section
      id="location"
      aria-labelledby="location-heading"
      className="relative bg-ink px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto w-full max-w-5xl">
        <p className="text-[12px] uppercase tracking-[0.3em] text-bone/60">
          Location
        </p>
        <h2
          id="location-heading"
          className="font-display mt-4 text-bone"
          style={{
            fontSize: "clamp(2.5rem, 7vw, 5rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          Find us
        </h2>

        {/* ---------------------------- map facade ----------------------------
            A static image, not an embed. A Google Maps iframe costs several
            hundred KB of third-party JavaScript on load; this is one
            self-hosted WebP (47KB at 640w) and a link. The plate is stitched
            from OpenStreetMap tiles at build time and tinted to the palette —
            see scratchpad/render-map.js. Attribution below is required by the
            ODbL, not decoration. */}
        <a
          href={DIRECTIONS}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open directions to Darb by Kahramanah in Amman on Google Maps"
          className="map-facade group relative mt-12 block w-full overflow-hidden rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-clay"
        >
          <div className="relative aspect-[4/3] w-full md:aspect-video">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/map/amman-1280.webp"
              srcSet="/map/amman-640.webp 640w, /map/amman-1280.webp 1280w"
              sizes="(min-width: 768px) min(64rem, 100vw), 100vw"
              alt="Map of Amman showing Darb by Kahramanah near Mecca Street in the Wadi Al-Seer district"
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover"
            />

            {/* Vignette so the pin and the label always have ground to sit on,
                whatever the crop does at a given aspect ratio. */}
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 75% 70% at 50% 50%, transparent 30%, rgba(17,17,16,0.35) 75%, rgba(17,17,16,0.7) 100%)",
              }}
            />

            {/* -------------------------- the pin -------------------------- */}
            <div
              aria-hidden="true"
              className="map-pin absolute"
              style={{ left: PIN_X, top: PIN_Y }}
            >
              <span className="map-pin-shadow" />
              <svg
                viewBox="0 0 24 24"
                className="map-pin-mark relative block h-9 w-9"
                fill="none"
              >
                <path
                  d="M12 22s7-6.36 7-12A7 7 0 0 0 5 10c0 5.64 7 12 7 12Z"
                  fill="var(--color-clay)"
                />
                <circle cx="12" cy="10" r="2.6" fill="var(--color-ink)" />
              </svg>
            </div>

            {/* "Get directions" — fades up on hover, but PERMANENTLY visible on
                touch, where there is no hover state to reveal it. */}
            <span className="map-cta absolute bottom-4 right-4 inline-flex items-center gap-2 rounded-sm bg-ink/80 px-3 py-2 text-[12px] uppercase tracking-[0.14em] text-bone backdrop-blur-sm">
              Get directions
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  d="M7 17 17 7M9 7h8v8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </a>

        {/* The link measured 82x14 in the responsive audit, under the 44px
            touch minimum. min-h-[44px] on the anchor gives it a real hit area;
            the attribution row simply sits taller, which there is room for
            beneath the map. */}
        <p className="mt-1 flex flex-wrap items-center gap-x-1 text-[12px] tracking-[0.04em] text-sand">
          <span>Map data ©</span>
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center underline underline-offset-2 hover:text-bone focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
          >
            OpenStreetMap
          </a>
          <span>contributors</span>
        </p>

        {/* --------------------------- the details --------------------------- */}
        <div className="mt-16 grid gap-12 sm:grid-cols-2">
          <div>
            <h3 className="text-[12px] uppercase tracking-[0.2em] text-sand">
              Address
            </h3>
            <div aria-hidden="true" className="my-4 h-px w-full bg-bone/15" />
            <p className="text-bone" style={{ fontSize: "clamp(1rem, 1.6vw, 1.15rem)" }}>
              {ADDRESS}
            </p>

            <h3 className="mt-10 text-[12px] uppercase tracking-[0.2em] text-sand">
              Opening hours
            </h3>
            <div aria-hidden="true" className="my-4 h-px w-full bg-bone/15" />
            <p className="text-bone" style={{ fontSize: "clamp(1rem, 1.6vw, 1.15rem)" }}>
              {HOURS}
            </p>
          </div>

          <div>
            <h3 className="text-[12px] uppercase tracking-[0.2em] text-sand">
              WhatsApp
            </h3>
            <div aria-hidden="true" className="my-4 h-px w-full bg-bone/15" />

            <ul className="space-y-3">
              <li>
                <a
                  href={bookingLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex min-h-[44px] items-center text-bone hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                  style={{ fontSize: "clamp(1rem, 1.6vw, 1.15rem)" }}
                >
                  {telLabel(WHATSAPP_PRIMARY)}
                  <span className="ml-3 text-[12px] uppercase tracking-[0.16em] text-sand">
                    Bookings
                  </span>
                </a>
              </li>
              <li>
                <a
                  href={enquiryLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap inline-flex min-h-[44px] items-center text-bone hover:text-clay focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
                  style={{ fontSize: "clamp(1rem, 1.6vw, 1.15rem)" }}
                >
                  {telLabel(WHATSAPP_SECONDARY)}
                  <span className="ml-3 text-[12px] uppercase tracking-[0.16em] text-sand">
                    Alternate
                  </span>
                </a>
              </li>
            </ul>

            <a
              href={DIRECTIONS}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex min-h-[44px] items-center bg-clay px-7 py-3 text-sm uppercase tracking-[0.12em] text-bone transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay"
            >
              Get directions
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
