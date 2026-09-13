import { AdminShell } from "@/components/dashboard/admin-shell";
import { getAdminIdentity } from "@/lib/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getAdminIdentity();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
