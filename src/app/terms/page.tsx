import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions | Darb by Kahramanah",
  description: "Rental terms and conditions for Darb by Kahramanah car rental, Amman, Jordan.",
};

/* A reading page, not a cinematic one: no motion, no client code.

   The wording below is the rental contract's own text and must stay exactly
   as supplied. Nothing is paraphrased, softened or added — change it only when
   the signed Arabic contract changes. Kept as data rather than JSX so the
   apostrophes stay literal characters. */

type Section = {
  title: string;
  /** paragraphs, in order, before any list */
  body?: string[];
  /** a lead-in sentence followed by bullet points */
  list?: { lead: string; items: string[] };
};

const INTRO =
  "These terms form part of the rental agreement signed at our office. The Arabic text of the signed contract is the legally binding version.";

const SECTIONS: Section[] = [
  {
    title: "1. The Agreement",
    body: [
      "The facts mentioned overleaf are part of this contract. The renter agrees to pay the cost of rental as stipulated in the rental agreement. This contract is a complete and indivisible whole.",
    ],
  },
  {
    title: "2. Use of the Vehicle",
    list: {
      lead: "The vehicle shall not be used:",
      items: [
        "To transport goods in violation of Jordanian law.",
        "To carry passengers or property for hire or reward.",
        "To tow any vehicle or trailer.",
        "In motor sport events such as racing, rallying or speed testing.",
        "By any person driving while unfit through drink, medication or drugs.",
        "By any person other than the named renter.",
      ],
    },
  },
  {
    title: "3. In Case of Accident",
    list: {
      lead: "The lessee undertakes to:",
      items: [
        "Report the accident to the lessor immediately.",
        "Report to the police and obtain an official accident report from the nearest security centre.",
        "Pay the first 350 JOD of the accident as the non-waivable excess (accident file opening).",
        "Pay the original daily rental rate for every day the vehicle is off the road while under repair.",
        "Pay the entire charges of the accident and all resulting damages if no official police report is obtained. Without a police report, the lessee bears full liability for any material or legal damages, and repairs are at the lessee's expense.",
      ],
    },
  },
  {
    title: "4. Damage and Maintenance",
    body: [
      "The lessee is liable for all repair costs for damage resulting from misuse of the vehicle. The lessee is responsible for any engine failure or other damage resulting from neglecting to check oil and water levels during the rental period.",
    ],
  },
  {
    title: "5. Termination",
    body: [
      "The lessor has the right to terminate the contract and recover the vehicle in the event of non-payment or misuse of the vehicle.",
    ],
  },
  {
    title: "6. Compensation",
    body: [
      "The lessee shall compensate for all damage caused to the vehicle and for any damage caused to third parties, including any resultant loss in value.",
    ],
  },
  {
    title: "7. Damaged or Missing Parts",
    body: [
      "The lessee shall pay the value of damaged or missing parts as assessed by an expert appointed by both parties or by the company's parts officer.",
    ],
  },
  {
    title: "8. Repair Period",
    body: ["The rental contract remains valid for as long as the vehicle requires repair."],
  },
  {
    title: "9. Governing Language and Law",
    body: [
      "This rental contract is written in Arabic, and the Arabic text is the legally binding version. It is governed by and interpreted under the laws of Jordan. The courts of the department where the vehicle is registered have exclusive jurisdiction over any dispute arising from the interpretation or implementation of this contract.",
    ],
  },
  {
    title: "10. Legal Action",
    body: [
      "The lessor is entitled to pursue the lessee in court for any financial claim arising from this contract without the need to serve prior judicial notice.",
    ],
  },
  {
    title: "11. Return of the Vehicle",
    body: [
      "The lessee agrees to return the vehicle personally to the lessor's office on or by the date specified in the rental agreement, in the same condition in which it was received.",
    ],
  },
  {
    title: "12. Fuel",
    body: ["The lessor is not responsible for the cost of fuel during the rental period."],
  },
  {
    title: "13. Oil and Water Levels",
    body: [
      "The rental is for the customer's account. The lessee must regularly check oil and water levels and obtain a receipt to claim reimbursement.",
    ],
  },
  {
    title: "14. Limitation of Liability",
    body: [
      "The lessor is not liable for injury or property damage caused by a manufacturing defect or prior faulty repairs, and is not responsible for any loss or damage suffered by the lessee as a result of a sudden fault occurring in the vehicle.",
    ],
  },
  {
    title: "15. Total Loss",
    body: ["In the event the vehicle is written off, the lessee shall pay 10% of the value of the vehicle."],
  },
  {
    title: "Declaration",
    body: [
      "The renter declares that, after personal inspection, the vehicle described in this contract has been received free from apparent or latent defects, usable and in good condition. The renter undertakes to return it in the condition in which it was received, and to leave their passport with the lessor's office until the settlement of all financial and other obligations arising from this contract. The renter declares having read and understood all articles of this contract on both sides, having signed it of their own free will without coercion, and waives the right to oppose it or to claim that the passport was withheld. The passport is held not as a deposit but as security for the renter's obligations towards the lessor until final settlement.",
    ],
  },
];

const slug = (title: string) =>
  title
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export default function TermsPage() {
  return (
    <main className="flex-1 bg-ink px-6 pb-24 pt-10 md:px-10 md:pb-32 md:pt-14">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          href="/"
          className="car-back tap inline-flex min-h-[44px] items-center gap-2 text-[12px] uppercase tracking-[0.12em] text-bone/70 hover:text-bone"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-4 w-4"
          >
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Darb by Kahramanah
        </Link>

        <article className="mt-12 max-w-[70ch] md:mt-16">
          <header>
            <h1
              className="font-display text-bone"
              style={{
                fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                paddingBottom: "0.06em",
              }}
            >
              Terms &amp; Conditions
            </h1>
            <p className="mt-5 text-[16px] leading-[1.75] text-sand md:text-[17px]">{INTRO}</p>
          </header>

          <div aria-hidden="true" className="mt-12 h-px w-full bg-bone/15" />

          {SECTIONS.map((section) => {
            const id = slug(section.title);
            return (
              <section key={id} aria-labelledby={id} className="mt-12">
                <h2
                  id={id}
                  className="font-display text-bone"
                  style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", lineHeight: 1.2 }}
                >
                  {section.title}
                </h2>
                <div className="mt-4 space-y-4 text-[16px] leading-[1.8] text-bone/80 md:text-[17px]">
                  {section.body?.map((p) => <p key={p}>{p}</p>)}
                  {section.list && (
                    <>
                      <p>{section.list.lead}</p>
                      <ul className="list-disc space-y-2 pl-5 marker:text-sand">
                        {section.list.items.map((item) => (
                          <li key={item} className="pl-1">
                            {item}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </section>
            );
          })}
        </article>
      </div>
    </main>
  );
}
