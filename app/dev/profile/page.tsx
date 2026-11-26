import type { Metadata } from "next";
import { ProfilePreview } from "@/features/profile";

export const metadata: Metadata = { title: "Profile preview", robots: { index: false } };

export default function Page() {
  return <ProfilePreview />;
}
