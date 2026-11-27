import type { Metadata } from "next";
import { Suspense } from "react";
import { requireSubject } from "@/core/config/subjects";
import { StudentPage } from "@/features/dashboard";

export const metadata: Metadata = { title: "Student", robots: { index: false } };

export default function Page({ params }: PageProps<"/[subject]/students/[id]">) {
  return (
    <Suspense>
      {params.then(({ subject, id }) => (
        <StudentPage subject={requireSubject(subject)} id={id} />
      ))}
    </Suspense>
  );
}
