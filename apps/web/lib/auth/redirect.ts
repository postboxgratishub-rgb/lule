const FALLBACK_PATH = "/dashboard";

/** Only permit same-origin application paths in auth redirects. */
export function safeRedirectPath(
  candidate: string | null | undefined,
  fallback = FALLBACK_PATH,
): string {
  if (!candidate) return fallback;
  if (!candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\") || candidate.includes("\0")) return fallback;

  try {
    const decoded = decodeURIComponent(candidate);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
    if (decoded.includes("\\") || decoded.includes("\0")) return fallback;
    return candidate;
  } catch {
    return fallback;
  }
}
