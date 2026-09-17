export type CarImage = {
  src: string; // full path, e.g. "/fleet/gallery/kia-sonet-interior.webp"
  alt: string; // must describe THIS view, not just the car
  kind: "exterior" | "interior";
  // Optional responsive candidates. Without these a phone downloads the
  // full-size asset for a 390px-wide slot — set them whenever a second size
  // of the same image exists.
  srcSet?: string;
};

export type Car = {
  slug: string;
  name: string;
  journey: string; // "For the desert road" — not the category
  category: "SUV" | "Sedan" | "Compact";
  pricePerDay: number; // JOD
  seats: number;
  luggage: number;
  transmission: "Automatic" | "Manual";
  fuel: string;
  year: number;
  unitsAvailable?: number; // units of this model in the 25-vehicle fleet; omit = don't show
  image: string; // base path of the card asset, e.g. "/fleet/cards/kia-sonet"
  highlights: string[]; // exactly 3 short phrases
  // Two or three sentences. Drives the /fleet/[slug] page copy AND that
  // page's meta description, so it is genuinely load-bearing for search.
  description: string;
  // ADDITIONAL views only — the card image is always shown first by
  // galleryFor(). Leave undefined until real extra photography exists;
  // a one-image gallery correctly hides its own controls.
  gallery?: CarImage[];
};

/** The full ordered gallery for a car: card image first, then any extras. */
export function galleryFor(car: Car): CarImage[] {
  return [
    {
      src: `${car.image}-896.webp`,
      // Both sizes offered so a phone takes the 640 and only a wide desktop
      // half pulls the 896.
      srcSet: `${car.image}-640.webp 640w, ${car.image}-896.webp 896w`,
      alt: `${car.name} parked on a Jordanian road, three-quarter front exterior view`,
      kind: "exterior",
    },
    ...(car.gallery ?? []),
  ];
}

export const getCar = (slug: string): Car | undefined =>
  fleet.find((c) => c.slug === slug);

export const fleet: Car[] = [
  {
    slug: "kia-sonet",
    image: "/fleet/cards/kia-sonet",
    name: "Kia Sonet",
    journey: "For the desert road",
    category: "SUV",
    pricePerDay: 35,
    seats: 5,
    luggage: 2,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2024, // TODO confirm model year
    highlights: ["Compact SUV comfort", "Confident on rough roads", "Roof rails for luggage"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "A compact SUV with the ground clearance for the tracks around Wadi Rum and a footprint small enough for Jabal Amman. Five seats, roof rails for whatever does not fit inside, and an automatic gearbox that makes the climb out of the valley effortless.",
  },
  {
    slug: "changan-cs15",
    image: "/fleet/cards/changan-cs15",
    name: "Changan CS15",
    journey: "For the mountain roads",
    category: "SUV",
    pricePerDay: 20,
    seats: 5,
    luggage: 2,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2023, // TODO confirm model year
    highlights: ["Compact crossover", "Higher seating position", "Easy in city traffic"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "A compact crossover built for the switchbacks down to the Jordan Valley. The higher seating position gives you the view over the barriers, and the short wheelbase turns inside most Amman traffic.",
  },
  {
    slug: "byd-destroyer-05",
    image: "/fleet/cards/byd-destroyer-05",
    name: "BYD Destroyer 05",
    journey: "Electric, for the city",
    category: "Sedan",
    pricePerDay: 30,
    seats: 5,
    luggage: 3,
    transmission: "Automatic",
    fuel: "Hybrid", // TODO confirm trim
    year: 2025,
    highlights: ["Plug-in hybrid drivetrain", "Low running cost", "Newest arrival in the fleet"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "The newest arrival in the fleet: a plug-in hybrid that runs near-silent on short city trips and switches to petrol without you noticing. Running costs over a week are the lowest we offer, and the cabin feels a segment above its rate.",
  },
  {
    slug: "byd-qin-plus",
    image: "/fleet/cards/byd-qin-plus",
    name: "BYD Qin Plus",
    journey: "Electric, for long trips",
    category: "Sedan",
    pricePerDay: 30,
    seats: 5,
    luggage: 3,
    transmission: "Automatic",
    fuel: "Hybrid", // TODO confirm trim
    year: 2025,
    highlights: ["Very low fuel use", "Quiet at city speeds", "Modern cabin tech"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "A plug-in hybrid sedan tuned for distance — Amman to Aqaba on remarkably little fuel. Quiet at city speeds, settled at highway ones, with the most modern cabin tech in the fleet.",
  },
  {
    slug: "hyundai-elantra",
    image: "/fleet/cards/hyundai-elantra",
    name: "Hyundai Elantra",
    journey: "For long journeys",
    category: "Sedan",
    pricePerDay: 30,
    seats: 5,
    luggage: 3,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2025,
    highlights: ["Newest sedan in the fleet", "Comfortable on long drives", "Large trunk"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "Our newest sedan, and the one we hand over most often for long drives. Comfortable for four adults over several hours, with a trunk that takes three large cases without argument.",
  },
  {
    slug: "mg5",
    image: "/fleet/cards/mg5",
    name: "MG5",
    journey: "For the Dead Sea road",
    category: "Sedan",
    pricePerDay: 20,
    seats: 5,
    luggage: 3,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2023,
    highlights: ["Spacious rear seats", "Good fuel economy", "Modern styling"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "A roomy sedan for the descent to the Dead Sea and the long climb back. Generous rear seats, modern styling, and fuel economy that holds up when the road turns uphill.",
  },
  {
    slug: "changan-eado",
    image: "/fleet/cards/changan-eado",
    name: "Changan Eado",
    journey: "For the open road",
    category: "Sedan",
    pricePerDay: 20,
    seats: 5,
    luggage: 3,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2023,
    highlights: ["Smooth on the highway", "Roomy cabin", "Strong value"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "A smooth highway sedan with a cabin roomier than its rate suggests. It settles at Desert Highway speeds and stays quiet, which is most of what you want from a car for the open road.",
  },
  {
    slug: "kia-k3",
    image: "/fleet/cards/kia-k3",
    name: "Kia K3",
    journey: "For the evening",
    category: "Sedan",
    pricePerDay: 25,
    seats: 5,
    luggage: 3,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2024, // TODO confirm model year
    highlights: ["Quiet cabin", "Smooth highway ride", "Big trunk"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "A quiet, well-finished sedan that suits an evening in Amman as easily as an early run to the airport. Smooth on the highway, with a trunk big enough not to think about.",
  },
  {
    slug: "nissan-sunny",
    image: "/fleet/cards/nissan-sunny",
    name: "Nissan Sunny",
    journey: "For arrivals",
    category: "Sedan",
    pricePerDay: 20,
    seats: 5,
    luggage: 3,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2023, // fleet also includes 2020 units
    highlights: ["Reliable and efficient", "Easy to drive", "Low rental cost"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "The car we most often send to Queen Alia at odd hours: reliable, efficient, and easy to drive straight off a long flight. One of the lowest rates in the fleet over a longer stay.",
  },
  {
    slug: "kia-pegas-gl",
    image: "/fleet/cards/kia-pegas-gl",
    name: "Kia Pegas GL",
    journey: "For everyday driving",
    category: "Sedan",
    pricePerDay: 20,
    seats: 5,
    luggage: 3,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2020,
    highlights: ["Simple and dependable", "Good value for longer rentals", "Easy to park"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "A simple, dependable sedan and the best value we have for longer rentals. Easy to park, cheap to run, and it does everything most trips actually ask for.",
  },
  {
    slug: "kia-picanto",
    image: "/fleet/cards/kia-picanto",
    name: "Kia Picanto",
    journey: "For the city",
    category: "Compact",
    pricePerDay: 15,
    seats: 4,
    luggage: 1,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2023,
    highlights: ["Easiest to park", "Cheapest on fuel", "Perfect for downtown Amman"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "The easiest car we rent to park in downtown Amman, and the cheapest on fuel. Four seats and a single case — ideal for a couple staying in the city.",
  },
  {
    slug: "jetour-x70",
    image: "/fleet/cards/jetour-x70",
    name: "Jetour X70",
    journey: "For the whole family",
    category: "SUV",
    pricePerDay: 45,
    seats: 7,
    // ESTIMATE — verify against the actual vehicle. Conservative real-world
    // figure from the published ~430L boot with the third row in use.
    luggage: 3,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2027,
    highlights: ["Seven seats", "1.5L turbo", "Room for the whole family"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "Seven seats for the trips the whole family comes on, with room for three bags and an automatic gearbox that keeps a full car unhurried. A 1.5-litre turbo carries everyone out of Amman and down the long roads south without strain.",
  },
  {
    slug: "jetour-dashing",
    image: "/fleet/cards/jetour-dashing",
    name: "Jetour Dashing",
    journey: "For the mountain roads",
    category: "SUV",
    pricePerDay: 40,
    seats: 5,
    // ESTIMATE — verify against the actual vehicle. Conservative real-world
    // figure from the published 486L boot.
    luggage: 4,
    transmission: "Automatic",
    fuel: "Petrol",
    year: 2027,
    highlights: ["1.5L turbo", "Large boot for its size", "Comfortable on long drives"],
    // TODO: confirm copy with client — written from the specs above, not supplied.
    description:
      "A five-seat SUV with a 1.5-litre turbo for the switchbacks and the long climbs between Amman, the Dead Sea and Petra. The boot is large for its size — four bags — and it stays comfortable however long the drive.",
  },
];
