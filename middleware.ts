import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  isAllowedProductionHost,
  isLocalHost,
} from "@/lib/core/auth/allowed-hosts";
import {
  GATE_COOKIE_NAME,
  verifyGateToken,
} from "@/lib/core/auth/gate-cookie";

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

export async function middleware(request: NextRequest) {
  const host = requestHost(request);

  if (isLocalHost(host)) {
    return NextResponse.next();
  }

  if (!isAllowedProductionHost(host)) {
    return rewriteWelcome(request);
  }

  if (await verifyGateToken(request.cookies.get(GATE_COOKIE_NAME)?.value)) {
    return NextResponse.next();
  }

  return rewriteWelcome(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.jpeg|me.jpeg|welcome|welcome.html|api/gate).*)",
  ],
};
