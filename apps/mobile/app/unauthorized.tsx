import { router } from "expo-router";
import { CenteredState, PrimaryButton } from "@/components/ui";
import { useAuth } from "@/lib/auth-context";

export default function UnauthorizedScreen() {
  const { signOut } = useAuth();
  async function switchAccount() { await signOut(); router.replace("/login"); }
  return <CenteredState title="Student app only" detail="This account is not a student account. Administrators should use the secure admin dashboard." action={<PrimaryButton onPress={() => void switchAccount()}>Use another account</PrimaryButton>} />;
}
