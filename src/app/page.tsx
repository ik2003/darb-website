import Hero from "@/components/Hero";
import Statement from "@/components/Statement";
import FleetCoverflow from "@/components/FleetCoverflow";
import Numbers from "@/components/Numbers";
import HowItWorks from "@/components/HowItWorks";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- kept for the commented-out <Reviews /> below
import Reviews from "@/components/Reviews";
import Faq from "@/components/Faq";
import Location from "@/components/Location";
import Closing from "@/components/Closing";
import Footer from "@/components/Footer";

// force rebuild
export default function Home() {
  return (
    <>
      <Hero />
      <Statement />
      <FleetCoverflow />
      <Numbers />
      <HowItWorks />
      {/* HIDDEN: the reviews are placeholders until the client supplies real
          ones. To restore the section, uncomment the line below. */}
      {/* <Reviews /> */}
      <Faq />
      <Location />
      <Closing />
      <Footer />
    </>
  );
}
