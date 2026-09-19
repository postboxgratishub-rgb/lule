import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Mail, School, UserRound } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { StudentProfileForm } from "@/components/students/student-profile-form";
import { formatDate, formatDateTime, initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { ProfileWithSchool } from "@/types";

export const metadata: Metadata = { title: "Student profile" };
export const dynamic = "force-dynamic";

export default async function StudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const [studentResult, schoolsResult] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, auth_user_id, full_name, email, phone, role, school_id, class_name, section, roll_number, date_of_birth, avatar_url, created_at, updated_at, school:schools!profiles_school_id_fkey(id, name, code, block_name)",
      )
      .eq("id", id)
      .eq("role", "student")
      .maybeSingle(),
    supabase
      .from("schools")
      .select("id, name, code, block_name")
      .order("block_name", { ascending: true, nullsFirst: false })
      .order("name"),
  ]);

  if (studentResult.error || !studentResult.data) notFound();
  if (schoolsResult.error) throw new Error("Unable to load schools.");
  const student = studentResult.data as unknown as ProfileWithSchool;

  return (
    <>
      <PageHeader
        eyebrow="Student profile"
        title={student.full_name}
        description="Review and maintain this student's enrolment details."
        actions={
          <Link href="/students" className="button-secondary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All students
          </Link>
        }
      />

      <section className="mb-6 grid gap-4 lg:grid-cols-[minmax(260px,.38fr)_minmax(0,1fr)]">
        <article className="panel p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand-50 text-lg font-extrabold text-brand-800">
              {initials(student.full_name)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate font-bold text-ink-950">{student.full_name}</h2>
              <span className="mt-1 inline-flex rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-800">
                Student
              </span>
            </div>
          </div>
          <dl className="mt-6 space-y-4 border-t border-slate-100 pt-5 text-sm">
            <div className="flex gap-3">
              <Mail className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-ink-500">Email</dt>
                <dd className="mt-1 break-all text-ink-900">{student.email ?? "Not available"}</dd>
              </div>
            </div>
            <div className="flex gap-3">
              <School className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-ink-500">School</dt>
                <dd className="mt-1 text-ink-900">{student.school?.name ?? "Not assigned"}</dd>
                {student.school?.block_name ? (
                  <dd className="mt-1 text-xs text-ink-500">
                    {student.school.block_name} block
                  </dd>
                ) : null}
              </div>
            </div>
            <div className="flex gap-3">
              <UserRound className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-ink-500">Class / section / roll</dt>
                <dd className="mt-1 text-ink-900">
                  {[student.class_name, student.section, student.roll_number]
                    .filter(Boolean)
                    .join(" · ") || "Not provided"}
                </dd>
              </div>
            </div>
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-ink-500">Date of birth</dt>
                <dd className="mt-1 text-ink-900">{formatDate(student.date_of_birth)}</dd>
              </div>
            </div>
          </dl>
          <p className="mt-6 border-t border-slate-100 pt-4 text-[11px] leading-5 text-ink-500">
            Registered {formatDateTime(student.created_at)} · Updated {formatDateTime(student.updated_at)}
          </p>
        </article>

        <article className="panel p-5 sm:p-7">
          <div className="mb-6">
            <h2 className="font-bold text-ink-950">Enrolment details</h2>
            <p className="mt-1 text-xs leading-5 text-ink-500">
              Authentication email and account role are protected and cannot be changed here.
            </p>
          </div>
          <StudentProfileForm student={student} schools={schoolsResult.data ?? []} />
        </article>
      </section>
    </>
  );
}
