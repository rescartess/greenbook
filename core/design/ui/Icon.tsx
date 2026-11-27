import type { IconName } from "@/core/config/features";

type Props = { name: IconName | "moon" | "sun"; size?: number; className?: string };

/** Simple stroke icons. Add new ones here so every screen draws them the same way. */
export function Icon({ name, size = 20, className }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
    className: className ? `fp-icon ${className}` : "fp-icon",
  };
  switch (name) {
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="2" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="2" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="2" />
        </svg>
      );
    case "tests":
      return (
        <svg {...common}>
          <rect x="4.5" y="3.5" width="15" height="17" rx="3" />
          <path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4" />
        </svg>
      );
    case "topics":
      return (
        <svg {...common}>
          <path d="M12 3.5l8.5 4.5-8.5 4.5-8.5-4.5z" />
          <path d="M3.5 12l8.5 4.5 8.5-4.5" />
          <path d="M3.5 16l8.5 4.5 8.5-4.5" />
        </svg>
      );
    case "calendar":
      return (
        <svg {...common}>
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      );
    case "results":
      return (
        <svg {...common}>
          <path d="M4 20h16" />
          <path d="M7 16v-5M12 16V6M17 16v-8" />
        </svg>
      );
    case "bookmark":
      return (
        <svg {...common}>
          <path d="M6 20.5V4.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v16l-6-4z" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        </svg>
      );
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
        </svg>
      );
  }
}
