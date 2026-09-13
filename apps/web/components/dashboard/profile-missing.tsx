import { Alert } from "@/components/ui/alert";

export function ProfileMissing({ email }: { email: string | null }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
      <div className="grid size-14 place-items-center rounded-2xl bg-amber-100 text-2xl">
        <span aria-hidden="true">!</span>
      </div>
      <h1 className="mt-5 text-2xl font-bold text-ink">Enrollment is still syncing</h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Your secure sign-in is active{email ? ` for ${email}` : ""}, but the
        student profile has not appeared yet.
      </p>
      <div className="mt-6">
        <Alert title="What to do">
          Refresh this page in a moment. If this continues, ask your school
          administrator to confirm that your student profile was created during
          registration.
        </Alert>
      </div>
    </div>
  );
}
