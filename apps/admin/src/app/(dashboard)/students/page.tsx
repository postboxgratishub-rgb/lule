import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { formatDate, initials } from "@/lib/format";
import { DEFAULT_PAGE_SIZE, getPageRange, getTotalPages, parsePositiveInteger, sanitizeSearchTerm } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import type { ProfileWithSchool } from "@/types";

export const metadata: Metadata = { title: "Students" };
export const dynamic = "force-dynamic";

interface StudentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const params = await searchParams;
  const page = parsePositiveInteger(params.page);
  const search = sanitizeSearchTerm(params.q);
  const requestedSchool = Array.isArray(params.school) ? params.school[0] : params.school;
  const schoolFilter = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(requestedSchool ?? "")
    ? requestedSchool
    : undefined;
  const { from, to } = getPageRange(page, DEFAULT_PAGE_SIZE);
  const supabase = await createClient();

  let studentsQuery = supabase
    .from("profiles")
    .select(
      "id, auth_user_id, full_name, email, phone, role, school_id, class_name, section, roll_number, date_of_birth, avatar_url, created_at, updated_at, school:schools!profiles_school_id_fkey(id, name, code)",
      { count: "exact" },
    )
    .eq("role", "student")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (search) {
    studentsQuery = studentsQuery.or(
      `full_name.ilike.%${search}%,email.ilike.%${search}%,roll_number.ilike.%${search}%`,
    );
  }
  if (schoolFilter) studentsQuery = studentsQuery.eq("school_id", schoolFilter);

  const [studentsResult, schoolsResult] = await Promise.all([
    studentsQuery,
    supabase.from("schools").select("id, name, code").order("name"),
  ]);

  if (studentsResult.error || schoolsResult.error) {
    throw new Error("Unable to load the student directory.");
  }

  const students = (studentsResult.data ?? []) as unknown as ProfileWithSchool[];
  const total = studentsResult.count ?? 0;
  const totalPages = getTotalPages(total, DEFAULT_PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Students"
        description="Search registered student profiles and review their school and cohort details."
      />

      <section className="panel overflow-hidden" aria-labelledby="student-list-title">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 lg:flex-row lg:items-center">
          <div>
            <h2 id="student-list-title" className="font-bold text-ink-950">
              Student directory
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              {total.toLocaleString("en-IN")} registered student{total === 1 ? "" : "s"}
            </p>
          </div>
          <form action="/students" className="grid gap-2 sm:grid-cols-[minmax(220px,1fr)_220px_auto]" role="search">
            <label className="relative block">
              <span className="sr-only">Search students</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                name="q"
                defaultValue={search}
                className="field-input min-h-10 py-2 pl-9"
                placeholder="Name, email or roll number"
              />
            </label>
            <label>
              <span className="sr-only">Filter by school</span>
              <select
                name="school"
                defaultValue={schoolFilter ?? ""}
                className="field-input min-h-10 py-2"
              >
                <option value="">All schools</option>
                {(schoolsResult.data ?? []).map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </label>
            <button className="button-secondary" type="submit">
              Filter
            </button>
          </form>
        </div>

        {students.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  <th className="table-cell">Student</th>
                  <th className="table-cell">School</th>
                  <th className="table-cell">Class / section</th>
                  <th className="table-cell">Roll number</th>
                  <th className="table-cell">Registered</th>
                  <th className="table-cell text-right"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map((student) => (
                  <tr key={student.id} className="transition hover:bg-slate-50/70">
                    <td className="table-cell">
                      <div className="flex items-center gap-3">
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-xs font-bold text-brand-800">
                          {initials(student.full_name)}
                        </span>
                        <span className="min-w-0">
                          <Link href={`/students/${student.id}`} className="block font-semibold text-ink-950 hover:text-brand-700 hover:underline">
                            {student.full_name}
                          </Link>
                          <span className="mt-0.5 block text-xs text-ink-500">{student.email ?? "No email"}</span>
                        </span>
                      </div>
                    </td>
                    <td className="table-cell text-ink-700">
                      {student.school?.name ?? (
                        <span className="text-amber-700">Not assigned</span>
                      )}
                    </td>
                    <td className="table-cell text-ink-700">
                      {[student.class_name, student.section].filter(Boolean).join(" / ") || "—"}
                    </td>
                    <td className="table-cell text-ink-700">{student.roll_number ?? "—"}</td>
                    <td className="table-cell text-ink-500">{formatDate(student.created_at)}</td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/students/${student.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline"
                      >
                        View
                        <ArrowRight className="size-3.5" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={search || schoolFilter ? "No matching students" : "No students yet"}
            description={
              search || schoolFilter
                ? "Adjust the search or school filter and try again."
                : "Student registrations will appear here automatically."
            }
            action={
              search || schoolFilter ? (
                <Link href="/students" className="button-secondary">
                  Clear filters
                </Link>
              ) : undefined
            }
          />
        )}
        <Pagination
          pathname="/students"
          page={Math.min(page, totalPages)}
          totalPages={totalPages}
          query={{ q: search || undefined, school: schoolFilter }}
        />
      </section>
    </>
  );
}
