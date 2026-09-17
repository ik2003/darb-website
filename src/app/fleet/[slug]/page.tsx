import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fleet, galleryFor, getCar } from "@/data/fleet";
import { bookingLink } from "@/lib/whatsapp";
import { PRICE_CURRENCY, PricePerDay, hasPrice } from "@/lib/price";
import { SITE_URL } from "@/data/site";
import CarGallery from "@/components/CarGallery";
import SpecIcon from "@/components/SpecIcon";

/* A real, indexable route per car — not a dialog. Every one is prerendered
   at build time, which is the entire point of building pages here. */
export function generateStaticParams() {
  return fleet.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) return {};
  const title = `Rent a ${car.name} in Amman | Darb`;
  const url = `${SITE_URL}/fleet/${car.slug}`;
  const image = `${SITE_URL}${car.image}-896.webp`;
  return {
    title,
    description: car.description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: car.description,
      url,
      siteName: "Darb",
      type: "website",
      locale: "en_JO",
      images: [
        {
          url: image,
          width: 896,
          height: 1200,
          alt: `${car.name} available to rent from Darb in Amman, Jordan`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: car.description,
      images: [image],
    },
  };
}

/* ------------------------------- fuel icon -------------------------------- */

function FuelIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className="h-[18px] w-[18px]"
    >
      <path
        d="M5 21V5a2 2 0 012-2h5a2 2 0 012 2v16M4 21h12M14 9h2.5a1.5 1.5 0 011.5 1.5V17a1.5 1.5 0 003 0v-6l-2.5-3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const car = getCar(slug);
  if (!car) notFound();

  const images = galleryFor(car);
  const url = `${SITE_URL}/fleet/${car.slug}`;

  /* Product + Offer. The Offer is emitted ONLY with a real rate: publishing
     price 0 would tell search engines the car is free, which is worse than
     publishing no offer at all. It appears the moment pricePerDay is set. */
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: car.name,
    description: car.description,
    image: [`${SITE_URL}${car.image}-896.webp`],
    brand: { "@type": "Brand", name: car.name.split(" ")[0] },
    category: `${car.category} car rental`,
    ...(hasPrice(car) && {
      offers: {
        "@type": "Offer",
        url,
        price: car.pricePerDay,
        priceCurrency: PRICE_CURRENCY,
        availability: "https://schema.org/InStock",
        priceValidUntil: `${new Date().getFullYear() + 1}-12-31`,
        seller: { "@type": "Organization", name: "Darb" },
        eligibleDuration: {
          "@type": "QuantitativeValue",
          value: 1,
          unitCode: "DAY",
        },
      },
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Fleet", item: `${SITE_URL}/#fleet` },
      { "@type": "ListItem", position: 3, name: car.name, item: url },
    ],
  };

  const specs = [
    { icon: <SpecIcon kind="gearbox" className="h-[18px] w-[18px]" />, label: car.transmission },
    { icon: <SpecIcon kind="seats" className="h-[18px] w-[18px]" />, label: `${car.seats} seats` },
    {
      icon: <SpecIcon kind="luggage" className="h-[18px] w-[18px]" />,
      label: `${car.luggage} ${car.luggage === 1 ? "bag" : "bags"}`,
    },
    { icon: <FuelIcon />, label: car.fuel },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        // Server-rendered constant; no user input reaches this string.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      <main className="flex min-h-[100dvh] flex-col bg-ink lg:h-[100dvh] lg:flex-row lg:overflow-hidden">
        <CarGallery images={images} />

        {/* ------------------------------ panel ------------------------------ */}
        <div className="relative flex flex-1 flex-col bg-ink lg:h-full lg:w-[45%] lg:overflow-y-auto">
          <div className="flex flex-1 flex-col px-7 pb-40 pt-8 lg:px-12 lg:pb-12 lg:pt-10 xl:px-16">
            <nav aria-label="Breadcrumb" className="mb-8">
              <ol className="flex flex-wrap items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-bone/45">
                <li>
                  <Link href="/" className="car-crumb tap hover:text-bone">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li>
                  <Link href="/#fleet" className="car-crumb tap hover:text-bone">
                    Fleet
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="text-bone/80" aria-current="page">
                  {car.name}
                </li>
              </ol>
            </nav>

            <Link
              href="/#fleet"
              className="car-back tap mb-10 inline-flex items-center gap-2 self-start text-[12px] uppercase tracking-[0.12em] text-bone/70 hover:text-bone"
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
              Back to the fleet
            </Link>

            <p className="text-[12px] uppercase tracking-[0.22em] text-clay">{car.journey}</p>

            <h1
              className="font-display mt-3 text-bone"
              style={{
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                lineHeight: 1.02,
                letterSpacing: "-0.02em",
                paddingBottom: "0.06em",
              }}
            >
              {car.name}
            </h1>

            <p
              className="mt-4 text-bone"
              style={{ fontSize: "clamp(1.5rem, 2.5vw, 2rem)" }}
            >
              <PricePerDay car={car} />
            </p>

            {/* Panel-width hairline — bone, never clay. */}
            <div aria-hidden="true" className="my-8 h-px w-full bg-bone/15" />

            <ul className="grid grid-cols-4 gap-4">
              {specs.map((s) => (
                <li key={s.label} className="flex flex-col items-start gap-2 text-bone/70">
                  <span className="text-bone/70">{s.icon}</span>
                  <span className="text-[12px]">{s.label}</span>
                </li>
              ))}
            </ul>

            <p
              className="mt-9 max-w-prose text-bone/70"
              style={{ fontSize: "15px", lineHeight: 1.8 }}
            >
              {car.description}
            </p>

            {/* Desktop: in flow at the end of the panel. */}
            <a
              href={bookingLink(car.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="car-book hidden w-full items-center justify-center rounded-lg bg-clay py-4 text-sm uppercase tracking-[0.12em] text-bone transition-opacity hover:opacity-90 lg:mt-10 lg:inline-flex"
            >
              Book on WhatsApp
            </a>
          </div>

          {/* Mobile: pinned to the bottom of the viewport, above the home
              indicator. The panel carries pb-40 so nothing hides behind it. */}
          <div className="car-book-dock fixed inset-x-0 bottom-0 z-20 bg-ink/95 px-7 pt-3 backdrop-blur-sm lg:hidden">
            <a
              href={bookingLink(car.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="car-book inline-flex w-full items-center justify-center rounded-lg bg-clay py-4 text-sm uppercase tracking-[0.12em] text-bone"
            >
              Book on WhatsApp
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
