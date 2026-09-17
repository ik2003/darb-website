import { WHATSAPP_PRIMARY, WHATSAPP_SECONDARY } from "@/data/site";

/* Both numbers live in src/data/site.ts and are read only from here. Nothing
   else in the app should build a wa.me URL or reference a raw number. */

/** The booking enquiry, prefilled so the visitor does not start from a blank
 *  chat and we get the fields we always end up asking for anyway. */
const bookingMessage = (carName?: string) =>
  [
    `Hi Darb! I'd like to rent${carName ? ` the ${carName}` : " a car"}.`,
    "",
    "Pickup date:",
    "Return date:",
    "Pickup location:",
    "Name:",
  ].join("\n");

const link = (number: string, message: string) =>
  `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

/**
 * The booking CTA link — PRIMARY number.
 * Used by the hero, every carousel card, and the vehicle detail page.
 */
export function bookingLink(carName?: string) {
  return link(WHATSAPP_PRIMARY, bookingMessage(carName));
}

/**
 * The alternate line — SECONDARY number. Contact section only.
 *
 * Deliberately a general enquiry rather than a booking: this number is the
 * fallback for someone who could not reach the primary, so the message should
 * not pretend to be a structured booking form.
 */
export function enquiryLink() {
  return link(WHATSAPP_SECONDARY, "Hi Darb! I have a question.");
}
