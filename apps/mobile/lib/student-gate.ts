export type StudentGateState =
  | "loading"
  | "unauthenticated"
  | "error"
  | "unauthorized"
  | "authorized";

export function resolveStudentGate({
  authLoading,
  hasSession,
  profileLoading,
  profileError,
  role,
}: {
  authLoading: boolean;
  hasSession: boolean;
  profileLoading: boolean;
  profileError: boolean;
  role: unknown;
}): StudentGateState {
  if (authLoading) return "loading";
  if (!hasSession) return "unauthenticated";
  if (profileLoading) return "loading";
  if (profileError || role === null || role === undefined) return "error";
  if (role !== "student") return "unauthorized";
  return "authorized";
}
