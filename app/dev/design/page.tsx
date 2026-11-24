import type { Metadata } from "next";
import { StyleGuide } from "@/core/design/StyleGuide";

export const metadata: Metadata = { title: "Design system", robots: { index: false } };

export default function Page() {
  return <StyleGuide />;
}
