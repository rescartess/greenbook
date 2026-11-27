import type { Metadata } from "next";
import { LoginPage } from "@/features/auth";

export const metadata: Metadata = { title: "Log in", alternates: { canonical: "/login" } };

export default function Page() {
  return <LoginPage />;
}
