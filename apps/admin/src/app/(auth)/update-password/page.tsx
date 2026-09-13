import type { Metadata } from "next";

import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = { title: "Choose a new password" };

export default function UpdatePasswordPage() {
  return (
    <>
      <div className="mb-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-700">
          Account recovery
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-ink-950">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          Use a unique password you don’t use anywhere else.
        </p>
      </div>
      <UpdatePasswordForm />
    </>
  );
}
