import type { NextRequest } from "next/server";

import {
  AUTHENTICATED_RECOVERY_PATH,
  isPublicAdminPath,
  safeNextPath,
} from "@/lib/authorization";
import {
  redirectWithRefreshedCookies,
  refreshSupabaseSession,
} from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const { response, supabase, user } = await refreshSupabaseSession(request);

  if (pathname === "/") {
    if (!user) {
      return redirectWithRefreshedCookies(request, response, "/login");
    }

    const { data: isAdmin } = await supabase.rpc("is_admin");
    return redirectWithRefreshedCookies(
      request,
      response,
      isAdmin === true ? "/dashboard" : "/login?error=not_authorized",
    );
  }

  if (isPublicAdminPath(pathname)) {
    return response;
  }

  if (!user) {
    const next = safeNextPath(`${pathname}${search}`);
    return redirectWithRefreshedCookies(
      request,
      response,
      `/login?next=${encodeURIComponent(next)}`,
    );
  }

  if (pathname === AUTHENTICATED_RECOVERY_PATH) {
    return response;
  }

  const { data: isAdmin, error } = await supabase.rpc("is_admin");
  if (error || isAdmin !== true) {
    return redirectWithRefreshedCookies(
      request,
      response,
      "/login?error=not_authorized",
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
