/* ==========================================================================
   EVERY ANSWER BELOW IS AN UNVERIFIED FIRST DRAFT.

   These are written from ordinary Jordanian rental practice, not from Darb's
   actual policies. They state things about deposits, insurance excess, age
   limits and cross-border rules that only the business can confirm, and
   getting any of them wrong is a customer dispute waiting to happen. Correct
   them before launch and clear the `todo` flags.

   No FAQPage JSON-LD is emitted yet, deliberately: publishing draft policy as
   structured data would put unverified claims into search results, where they
   are far harder to walk back than on the page itself. Add it once the copy is
   signed off — the markup is trivial and this section is already shaped for it.
   ========================================================================== */

type Item = { q: string; a: string; todo: boolean };

const FAQ: Item[] = [
  {
    q: "Do I need an International Driving Permit?",
    a: "No. Any valid driving licence is accepted.",
    todo: false,
  },
  {
    q: "What insurance is included, and what is the excess?",
    a: "Every rental includes third-party liability and collision damage waiver as standard. The waiver carries an excess, which is the maximum you would pay toward damage to the car. Tyres, glass, the underbody and the interior are typically excluded from the waiver.",
    todo: true,
  },
  {
    q: "What is the minimum age to rent?",
    a: "18 years old.",
    todo: false,
  },
  {
    q: "Is there a deposit?",
    a: "Yes — a 200 JOD refundable insurance deposit. It is returned 3 days after you hand the car back.",
    todo: false,
  },
  {
    q: "What is the fuel policy?",
    a: "Cars are supplied with a full tank and should be returned full. If the car comes back short, we charge for the missing fuel plus a small refuelling fee. Diesel and petrol models are labelled at handover — please check before filling.",
    todo: true,
  },
  {
    q: "Is there a mileage limit?",
    a: "Daily rentals include a generous daily allowance, which is ample for Amman and day trips. Longer bookings are usually unlimited. If you are planning Amman to Aqaba and back in a short rental, tell us when booking and we will confirm the allowance.",
    todo: true,
  },
  {
    q: "Can I drive to Petra and Wadi Rum?",
    a: "Yes, and many of our customers do. The Desert Highway to both is paved and in good condition, and every car in the fleet is suitable for it. The final tracks inside Wadi Rum itself are soft sand and are not covered by your insurance — leave the car at the visitor centre and travel in with a local 4x4.",
    todo: true,
  },
  {
    q: "Do you deliver to the airport or my hotel?",
    a: "Both, at no extra charge within Amman. We meet arrivals at Queen Alia International Airport and deliver to hotels across the city. Send us your flight number and we will track the arrival, so a delayed landing does not cost you the booking.",
    todo: true,
  },
  {
    q: "Can I take the car across the border?",
    a: "Cross-border travel is not permitted as standard, and insurance does not extend beyond Jordan. If you need to reach Saudi Arabia or elsewhere, ask us before booking — some arrangements can be made in advance with additional paperwork and cover.",
    todo: true,
  },
];

/* Build-time warning, mirroring the pattern fleet.ts used for missing prices:
   surfaces the unverified answers in the terminal on every build so they
   cannot quietly ship. Remove with the todo flags. */
const unverified = FAQ.filter((f) => f.todo).length;
if (unverified > 0) {
  console.warn(
    `[faq] ${unverified}/${FAQ.length} answers are unverified first drafts — confirm with the client before launch.`
  );
}

export default function Faq() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative bg-bone px-6 py-24 text-ink md:px-10 md:py-32"
    >
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-[12px] uppercase tracking-[0.3em] text-sand">Questions</p>
        <h2
          id="faq-heading"
          className="font-display mt-4 text-ink"
          style={{ fontSize: "clamp(2.25rem, 6vw, 4rem)", lineHeight: 0.95, letterSpacing: "-0.02em" }}
        >
          Before you book.
        </h2>

        {/* Native <details>. No library, no JS, no animation — it works with
            JavaScript disabled, it is keyboard operable for free, and the
            answers are in the DOM for crawlers whether open or closed. */}
        <div className="mt-14">
          {FAQ.map((item) => (
            <details key={item.q} className="faq-item">
              <summary className="faq-summary">
                <h3 className="faq-question">{item.q}</h3>
              </summary>
              <p className="faq-answer">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
