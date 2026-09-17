/* Shared by the carousel card and the compact grid card so the two variants
   can never drift apart. Pure presentation — no state, no client hooks. */
export default function SpecIcon({
  kind,
  className = "h-[15px] w-[15px]",
}: {
  kind: "gearbox" | "seats" | "luggage";
  className?: string;
}) {
  const paths = {
    gearbox: <path d="M5 5v14M12 5v7M19 5v7M5 12h14M12 12v7" strokeLinecap="round" />,
    seats: (
      <path
        d="M7 11V6a2 2 0 012-2h6a2 2 0 012 2v5M5 21v-4a3 3 0 013-3h8a3 3 0 013 3v4"
        strokeLinecap="round"
      />
    ),
    luggage: (
      <path
        d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M6 7h12a1 1 0 011 1v11a1 1 0 01-1 1H6a1 1 0 01-1-1V8a1 1 0 011-1z"
        strokeLinecap="round"
      />
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      className={className}
    >
      {paths[kind]}
    </svg>
  );
}
