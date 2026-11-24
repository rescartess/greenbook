import { redirect } from "next/navigation";
import { requireSubject } from "@/core/config/subjects";

export default async function Page({ params }: PageProps<"/[subject]">) {
  redirect(`/${requireSubject((await params).subject)}/dashboard`);
}
