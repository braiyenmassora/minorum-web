import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "ai.dealwithsign.com",
  "localhost",
  "127.0.0.1",
]);

const GATE_COOKIE = "minorum_gate";
const GATE_COOKIE_VALUE = "1";

function requestHost(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  return raw.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

function rewriteWelcome(request: NextRequest): NextResponse {
  return NextResponse.rewrite(new URL("/welcome.html", request.url));
}

export function middleware(request: NextRequest) {
  const host = requestHost(request);
  const isLocal = ALLOWED_HOSTS.has(host) && host !== "ai.dealwithsign.com";

  if (!(ALLOWED_HOSTS.has(host) || host.endsWith(".localhost"))) {
    return rewriteWelcome(request);
  }

  // Localhost skips cookie gate; AppGate still redirects to /welcome if no config.
  if (isLocal || host.endsWith(".localhost")) {
    return NextResponse.next();
  }

  if (request.cookies.get(GATE_COOKIE)?.value === GATE_COOKIE_VALUE) {
    return NextResponse.next();
  }

  return rewriteWelcome(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.jpeg|me.jpeg|welcome|welcome.html|api/gate).*)",
  ],
};
