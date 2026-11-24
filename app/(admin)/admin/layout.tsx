import type { Metadata } from "next";
import { AdminShell } from "@/features/admin";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | GreenBook admin" }, robots: { index: false } };

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <AdminShell>{children}</AdminShell>;
}
