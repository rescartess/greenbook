import { NextResponse, type NextRequest } from "next/server";
import { safeNextPath } from "@/core/config/supabase";
import { createDbClient } from "@/core/db/server";

/** The sign-in link in the email lands here: swap its one-time code for a login session. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const next = safeNextPath(request.nextUrl.searchParams.get("next"));
  if (code) {
    const supabase = await createDbClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/login?expired=1", request.url));
}
