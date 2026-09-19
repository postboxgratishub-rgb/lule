import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, Pencil, Search, UsersRound } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { Pagination } from "@/components/dashboard/pagination";
import { DeleteSchoolButton } from "@/components/schools/delete-school-button";
import { SchoolForm } from "@/components/schools/school-form";
import { getPageRange, getTotalPages, parsePositiveInteger, sanitizeSearchTerm } from "@/lib/pagination";
import { createClient } from "@/lib/supabase/server";
import type { SchoolSummary } from "@/types";

export const metadata: Metadata = { title: "Schools" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

interface SchoolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SchoolsPage({ searchParams }: SchoolsPageProps) {
  const params = await searchParams;
  const page = parsePositiveInteger(params.page);
  const search = sanitizeSearchTerm(params.q);
  const { from, to } = getPageRange(page, PAGE_SIZE);
  const supabase = await createClient();

  let query = supabase
    .from("schools")
    .select(
      "id, name, code, block_name, address, city, state, contact_name, contact_phone, created_at, updated_at, profiles(count)",
      { count: "exact" },
    )
    .order("name")
    .range(from, to);

  if (search) {
    query = query.or(
      `name.ilike.%${search}%,code.ilike.%${search}%,block_name.ilike.%${search}%`,
    );
  }
  const { data, count, error } = await query;
  if (error) throw new Error("Unable to load schools.");

  const schools: SchoolSummary[] = (data ?? []).map((school) => ({
    id: school.id,
    name: school.name,
    code: school.code,
    block_name: school.block_name,
    address: school.address,
    city: school.city,
    state: school.state,
    contact_name: school.contact_name,
    contact_phone: school.contact_phone,
    created_at: school.created_at,
    updated_at: school.updated_at,
    student_count:
      Array.isArray(school.profiles) && school.profiles[0]
        ? Number(school.profiles[0].count ?? 0)
        : 0,
  }));
  const totalPages = getTotalPages(count ?? 0, PAGE_SIZE);

  return (
    <>
      <PageHeader
        eyebrow="Directory"
        title="Schools"
        description="Create and maintain the schools participating in the learning programme."
      />

      <section className="panel mb-6 p-5 sm:p-6" aria-labelledby="add-school-title">
        <div className="mb-5">
          <h2 id="add-school-title" className="font-bold text-ink-950">
            Add a school
          </h2>
          <p className="mt-1 text-xs leading-5 text-ink-500">
            Codes are unique and used to identify schools consistently.
          </p>
        </div>
        <SchoolForm />
      </section>

      <section className="panel overflow-hidden" aria-labelledby="school-list-title">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-center">
          <div>
            <h2 id="school-list-title" className="font-bold text-ink-950">
              School directory
            </h2>
            <p className="mt-1 text-xs text-ink-500">
              {(count ?? 0).toLocaleString("en-IN")} school{count === 1 ? "" : "s"}
            </p>
          </div>
          <form action="/schools" className="flex w-full gap-2 sm:w-auto" role="search">
            <label className="sr-only" htmlFor="school-search">
              Search schools
            </label>
            <div className="relative min-w-0 flex-1 sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                id="school-search"
                name="q"
                defaultValue={search}
                className="field-input min-h-10 py-2 pl-9"
                placeholder="Name, code or block"
              />
            </div>
            <button className="button-secondary" type="submit">
              Search
            </button>
          </form>
        </div>

        {schools.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] border-collapse text-left">
              <thead className="bg-slate-50/80">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-ink-500">
                  <th className="table-cell">School</th>
                  <th className="table-cell">Block / location</th>
                  <th className="table-cell">Contact</th>
                  <th className="table-cell text-right">Students</th>
                  <th className="table-cell text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schools.map((school) => (
                  <tr key={school.id} className="transition hover:bg-slate-50/70">
                    <td className="table-cell">
                      <p className="font-semibold text-ink-950">{school.name}</p>
                      <span className="mt-1 inline-flex rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-ink-700">
                        {school.code}
                      </span>
                    </td>
                    <td className="table-cell text-ink-500">
                      <p className="font-semibold text-ink-700">
                        {school.block_name ?? "Block not provided"}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1.5 text-xs">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {[school.city, school.state].filter(Boolean).join(", ") || "Not provided"}
                      </span>
                    </td>
                    <td className="table-cell">
                      <p className="text-ink-700">{school.contact_name ?? "—"}</p>
                      <p className="mt-1 text-xs text-ink-500">{school.contact_phone ?? ""}</p>
                    </td>
                    <td className="table-cell text-right">
                      <Link
                        href={`/students?school=${school.id}`}
                        className="inline-flex items-center gap-1.5 font-semibold text-brand-700 hover:underline"
                      >
                        <UsersRound className="size-3.5" aria-hidden="true" />
                        {school.student_count.toLocaleString("en-IN")}
                      </Link>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-start justify-end gap-4">
                        <Link
                          href={`/schools/${school.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:underline"
                        >
                          <Pencil className="size-3.5" aria-hidden="true" />
                          Edit
                        </Link>
                        <DeleteSchoolButton id={school.id} name={school.name} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title={search ? "No matching schools" : "No schools yet"}
            description={
              search
                ? "Try another school name, code, or block."
                : "Use the form above to add the first participating school."
            }
            action={
              search ? (
                <Link href="/schools" className="button-secondary">
                  Clear search
                </Link>
              ) : undefined
            }
          />
        )}
        <Pagination
          pathname="/schools"
          page={Math.min(page, totalPages)}
          totalPages={totalPages}
          query={{ q: search || undefined }}
        />
      </section>
    </>
  );
}
