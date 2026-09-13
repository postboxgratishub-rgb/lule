import type { Metadata } from "next";

import { AuthCard } from "@/components/auth/auth-card";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Create student account" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="Begin your journey"
      description="Create one student account for the website and mobile learning experience."
    >
      <RegisterForm />
    </AuthCard>
  );
}
