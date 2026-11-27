import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/inter";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "@fontsource-variable/roboto";
import "@fontsource-variable/noto-serif";
import "@fontsource-variable/noto-serif/wght-italic.css";
import "./globals.css";
import { THEME_SCRIPT } from "@/core/layout";

const SITE = "https://www.quantumtest.xyz";
const DESCRIPTION =
  "QuantumTest: free SAT practice with a Bluebook-style test screen. Adaptive full tests, practice by topic, every mistake saved.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "QuantumTest, free SAT practice", template: "%s | QuantumTest" },
  description: DESCRIPTION,
  applicationName: "QuantumTest",
  keywords: ["QuantumTest", "Quantum Test", "SAT practice", "free SAT practice test", "Bluebook practice", "digital SAT"],
};

/** Tells Google the site's name, so results show "QuantumTest". */
const SITE_JSON_LD = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "QuantumTest",
  alternateName: ["Quantum Test", "quantumtest.xyz"],
  url: `${SITE}/`,
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1716" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
