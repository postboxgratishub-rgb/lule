import Link from "next/link";

import { logoutAction } from "@/app/auth-actions";
import { AuthCard } from "@/components/auth/auth-card";
import { buttonClassName } from "@/components/ui/button";

export default function AccessDeniedPage() {
  return (
    <AuthCard
      title="Student access only"
      description="This website is reserved for student accounts. Administrative accounts should use the admin dashboard."
    >
      <div className="space-y-3">
        <Link href="/" className={buttonClassName("secondary", "w-full")}>
          Return home
        </Link>
        <form action={logoutAction}>
          <button className={buttonClassName("quiet", "w-full")} type="submit">
            Sign out and use another account
          </button>
        </form>
      </div>
    </AuthCard>
  );
}
