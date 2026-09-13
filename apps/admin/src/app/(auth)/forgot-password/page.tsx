import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back to sign in
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-ink-950">
          Reset your password
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-500">
          We’ll email a secure recovery link if the address belongs to an administrator.
        </p>
      </div>
      <ForgotPasswordForm />
    </>
  );
}
