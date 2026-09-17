// TODO: replace with real business details before launch.

// Absolute origin, no trailing slash. Used for canonical URLs, Open Graph
// image URLs and JSON-LD @id values — all of which must be absolute, so this
// has to be right before the site is submitted for indexing.
export const SITE_URL = "https://darb.jo"; // TODO real production domain

/* ------------------------------- WhatsApp --------------------------------
   International format: country code, no leading +, no spaces, no dashes.
   wa.me rejects anything else.

   These are the ONLY place either number appears. Every link in the app is
   built by the helpers in src/lib/whatsapp.ts, so a number change here
   propagates everywhere with no further edits. Do not inline a number at a
   call site. */

/** Bookings. Every "Book on WhatsApp" CTA on the site goes here. */
export const WHATSAPP_PRIMARY = "962796030085";

/** Alternate line. Contact section only — never a booking CTA. */
export const WHATSAPP_SECONDARY = "962796030065";

export const EMAIL = "darbcarrental@gmail.com";

/* Reordered from how it was supplied ("Mecca st, Amman, Jordan AL Harrana
   Commercial Complex") into most-specific-first, which is the order a postal
   address and schema.org both expect. The street corroborates the map pin:
   the OSM plate for these coordinates shows شارع مكة المكرمة / Mecca Street. */
export const ADDRESS =
  "Al Harrana Commercial Complex, Mecca Street, Amman, Jordan";

/** Split form, for structured data and anywhere the complex wants its own line. */
export const ADDRESS_PARTS = {
  building: "Al Harrana Commercial Complex",
  street: "Mecca Street",
  city: "Amman",
  country: "Jordan",
  countryCode: "JO",
} as const;

/* Social. The Facebook value is the /share/ link the client supplied, with
   its ?mibextid= query stripped — that parameter is a per-session referral
   token from the sender's own app, not part of the address, and publishing it
   would leak a tracking id on every page view. The share link still resolves,
   but a proper page vanity URL would be better if one exists. */
export const INSTAGRAM = "https://www.instagram.com/darbcarrental_";
export const FACEBOOK = "https://www.facebook.com/share/1VSMYZMQtY/";

/** Saturday to Thursday, 10:00-17:00. Closed Friday. */
export const HOURS = "Sat–Thu, 10:00–17:00";
