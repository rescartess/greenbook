import type { Metadata, Viewport } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/source-serif-4";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "@fontsource-variable/roboto";
import "@fontsource-variable/noto-serif";
import "@fontsource-variable/noto-serif/wght-italic.css";
import "./globals.css";
import { THEME_SCRIPT } from "@/core/layout";

export const metadata: Metadata = {
  title: { default: "RainbowPrep, free SAT practice 🌈", template: "%s | RainbowPrep" },
  description: "Adaptive SAT practice tests, practice by topic and every mistake saved. Free for every student.",
};

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
      </head>
      <body>{children}</body>
    </html>
  );
}
