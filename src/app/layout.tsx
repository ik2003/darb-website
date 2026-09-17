import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import Grain from "@/components/Grain";
import SmoothScroll from "@/components/SmoothScroll";
import Navbar from "@/components/Navbar";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Darb — Premium Car Rental in Amman",
  description: "Darb is a premium car rental company in Amman, Jordan.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${instrumentSerif.variable} h-full`}>
      <head>
        {/* First thing the parser runs, before any content makes the page tall
            enough to restore into. A reload must open the hero on frame one,
            not wherever the previous visit left the scroll: the browser would
            otherwise restore a position the pinned sequence has not measured
            yet. ScrollTrigger also snapshots this value when it starts and
            re-applies it after every refresh, so it has to be set before GSAP
            loads. Links to a section (/#fleet) are unaffected. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{history.scrollRestoration=\"manual\"}catch(e){}",
          }}
        />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&display=swap"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <SmoothScroll />
        <Grain />
        <Navbar />
        {children}
      </body>
    </html>
  );
}
