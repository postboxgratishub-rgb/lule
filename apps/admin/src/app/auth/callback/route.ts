import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { safeNextPath } from "@/lib/authorization";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const otpType = url.searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(url.searchParams.get("next"));
  const supabase = await createClient();

  let succeeded = false;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    succeeded = !error;
  } else if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: otpType,
    });
    succeeded = !error;
  }

  return NextResponse.redirect(
    new URL(succeeded ? next : "/login?error=recovery_failed", url.origin),
  );
}
