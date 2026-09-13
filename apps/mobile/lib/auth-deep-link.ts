export interface SessionTokens {
  accessToken: string;
  refreshToken: string;
}

export function extractSessionTokens(url: string): SessionTokens | null {
  const [, fragment = ""] = url.split("#", 2);
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1).split("#", 1)[0] : "";
  const params = new URLSearchParams(fragment || query);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");

  return accessToken && refreshToken ? { accessToken, refreshToken } : null;
}

export function extractAuthCode(url: string): string | null {
  if (!url.includes("?")) return null;
  return new URLSearchParams(url.slice(url.indexOf("?") + 1).split("#", 1)[0]).get("code");
}
