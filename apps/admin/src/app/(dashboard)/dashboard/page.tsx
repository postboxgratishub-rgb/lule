import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, School, UserPlus, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { SchoolDistributionChart } from "@/components/dashboard/school-distribution-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { compactNumber, formatDate, initials } from "@/lib/format";
import { getAdminOverview, getRecentStudents } from "@/lib/admin-data";

export const metadata: Metadata = { title: "Overview" };
export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const [overview, recentStudents, params] = await Promise.all([
    getAdminOverview(),
    getRecentStudents(),
    searchParams,
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Phase 1 overview"
        title="Learning community"
        description="A live view of registered students and participating schools. Activity and challenge analytics will appear when those modules are enabled."
        actions={
          <Link href="/schools" className="button-secondary">
            Manage schools
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      {params.passwordUpdated === "1" && (
        <div className="mb-5 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm font-medium text-brand-900" role="status">
          Your password has been updated.
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-label="Key statistics">
        <StatCard
          label="Total students"
          value={compactNumber(overview.total_students)}
          hint="Registered student profiles"
          icon={UsersRound}
        />
        <StatCard
          label="Total schools"
          value={compactNumber(overview.total_schools)}
          hint="Schools in the programme"
          icon={School}
        />
        <StatCard
          label="New this week"
          value={compactNumber(overview.new_students_last_7_days)}
          hint="Students registered in the last 7 days"
          icon={UserPlus}
        />
      </section>

      <section className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,.75fr)]">
        <article className="panel min-w-0 overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="font-bold text-ink-950">Student distribution</h2>
              <p className="mt-1 text-xs text-ink-500">Registered students by school</p>
            </div>
            <Link href="/schools" className="text-xs font-bold text-brand-700 hover:underline">
              View schools
            </Link>
          </div>
          {overview.students_by_school.length ? (
            <div className="px-2 py-4 sm:px-5">
              <SchoolDistributionChart data={overview.students_by_school} />
            </div>
          ) : (
            <EmptyState
              title="No distribution data yet"
              description="Add a school and assign registered students to see the distribution."
              action={
                <Link href="/schools" className="button-secondary">
                  Add a school
                </Link>
              }
            />
          )}
        </article>

        <article className="panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-5">
            <div>
              <h2 className="font-bold text-ink-950">Recently registered</h2>
              <p className="mt-1 text-xs text-ink-500">Newest student profiles</p>
            </div>
            <Link href="/students" className="text-xs font-bold text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          {recentStudents.length ? (
            <ul className="divide-y divide-slate-100">
              {recentStudents.map((student) => (
                <li key={student.id}>
                  <Link
                    href={`/students/${student.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 transition hover:bg-slate-50"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs font-bold text-ink-700">
                      {initials(student.full_name)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-950">
                        {student.full_name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-ink-500">
                        {student.school?.name ?? "School not assigned"}
                      </span>
                    </span>
                    <span className="hidden text-[11px] text-ink-500 sm:block xl:hidden 2xl:block">
                      {formatDate(student.created_at)}
                    </span>
                    <ArrowRight className="size-4 shrink-0 text-slate-400" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No students yet"
              description="New student registrations will appear here automatically."
            />
          )}
        </article>
      </section>
    </>
  );
}
