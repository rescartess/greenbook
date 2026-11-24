import { NextResponse, type NextRequest } from "next/server";
import { AUTH_ENABLED, HOME_AFTER_LOGIN } from "@/core/config/supabase";
import { SUBJECT_SLUGS } from "@/core/config/subjects";
import { refreshSession } from "@/core/db/session";

/**
 * The login wall. Runs before every page:
 * - keeps the login cookies fresh,
 * - sends signed-out visitors from /english/..., /math/..., /admin/... and /test/... to /login,
 * - sends signed-in students away from /login to their dashboard.
 * Pages check again on the server (getCurrentUser), so this is a fast first gate, not the only one.
 */
export async function proxy(request: NextRequest) {
  if (!AUTH_ENABLED) return NextResponse.next();

  const { response, signedIn } = await refreshSession(request);
  const path = request.nextUrl.pathname;
  const inApp = [...SUBJECT_SLUGS, "admin", "test", "practice"].some((s) => path === `/${s}` || path.startsWith(`/${s}/`));

  if (inApp && !signedIn) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }
  if (path === "/login" && signedIn) {
    return NextResponse.redirect(new URL(HOME_AFTER_LOGIN, request.url));
  }
  return response;
}

export const config = {
  // Everything except static files and images.
  matcher: ["/((?!_next/static|_next/image|icon.svg|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|woff2?)$).*)"],
};
