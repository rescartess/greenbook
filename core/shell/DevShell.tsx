import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Shell } from "./Shell";
import { SideNav } from "./SideNav";

/** Local-only frame for page previews with made-up data (/dev/...). Hidden in production. */
export function DevShell({ children }: { children: ReactNode }) {
  if (process.env.NODE_ENV === "production") notFound();
  return <Shell nav={<SideNav user={{ name: "Aziza Karimova", initials: "AK", isAdmin: false }} badges={{ english: { mistakes: 12 } }} />}>{children}</Shell>;
}
