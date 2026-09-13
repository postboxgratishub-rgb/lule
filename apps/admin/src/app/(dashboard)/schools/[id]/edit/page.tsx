import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/page-header";
import { SchoolForm } from "@/components/schools/school-form";
import { createClient } from "@/lib/supabase/server";
import type { School } from "@/types";

export const metadata: Metadata = { title: "Edit school" };
export const dynamic = "force-dynamic";

export default async function EditSchoolPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.from("schools").select("*").eq("id", id).maybeSingle();

  if (error || !data) notFound();
  const school = data as School;

  return (
    <>
      <PageHeader
        eyebrow="School directory"
        title={`Edit ${school.name}`}
        description="Update contact and location details. Student assignments are managed from student profiles."
        actions={
          <Link href="/schools" className="button-secondary">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All schools
          </Link>
        }
      />
      <section className="panel p-5 sm:p-7">
        <SchoolForm school={school} />
      </section>
    </>
  );
}
