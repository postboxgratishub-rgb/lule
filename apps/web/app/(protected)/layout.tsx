import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { StudentShell } from "@/components/layout/student-shell";
import { getCurrentStudent } from "@/lib/data/current-student";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const student = await getCurrentStudent();
  if (!student) redirect("/login");
  if (student.profile && student.profile.role !== "student") {
    redirect("/access-denied");
  }

  return (
    <StudentShell
      name={student.profile?.full_name ?? null}
      email={student.authEmail}
    >
      {children}
    </StudentShell>
  );
}
