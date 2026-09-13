export const AUTHENTICATED_RECOVERY_PATH = "/update-password";

const PUBLIC_PATHS = new Set(["/login", "/forgot-password", "/auth/callback"]);

export function isPublicAdminPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

export function safeNextPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\u0000-\u001f]/.test(value)
  ) {
    return "/dashboard";
  }

  return value;
}
