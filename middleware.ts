import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const ALLOWED_HOSTS = new Set([
  "ai.dealwithsign.com",
  "localhost",
  "127.0.0.1",
]);

function requestHost(request: NextRequest): string {
  const raw =
    request.headers.get("x-forwarded-host") ??
    request.headers.get("host") ??
    "";
  return raw.split(",")[0]?.trim().split(":")[0]?.toLowerCase() ?? "";
}

function requestIp(request: NextRequest): string {
  // Cloudflare orange-cloud → Vercel: trust CF's client IP first.
  const cf = request.headers.get("cf-connecting-ip")?.trim();
  if (cf) {
    return cf;
  }

  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) {
    return vercel.split(",")[0]?.trim() ?? "";
  }

  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "";
  }

  return request.headers.get("x-real-ip")?.trim() ?? "";
}

function allowedIps(): Set<string> | null {
  const raw = process.env.ALLOWED_IPS?.trim();
  if (!raw) {
    return null;
  }

  return new Set(
    raw
      .split(",")
      .map((ip) => ip.trim())
      .filter(Boolean),
  );
}

function forbidden(request: NextRequest): NextResponse {
  return NextResponse.rewrite(new URL("/lost.html", request.url), {
    status: 403,
  });
}

export function middleware(request: NextRequest) {
  const host = requestHost(request);
  const isLocal = ALLOWED_HOSTS.has(host) && host !== "ai.dealwithsign.com";

  if (!(ALLOWED_HOSTS.has(host) || host.endsWith(".localhost"))) {
    return forbidden(request);
  }

  // Optional IP allowlist (production). Skip on localhost for local dev.
  const ips = allowedIps();
  if (ips && !isLocal) {
    const ip = requestIp(request);
    if (!ip || !ips.has(ip)) {
      return forbidden(request);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.jpeg|lost.html).*)",
  ],
};
