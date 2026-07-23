import { type NextRequest, NextResponse } from "next/server";

import { hasGateCookie } from "@/lib/core/auth/gate-cookie";
import { getApiDefaults, isProduction } from "@/lib/env";

const ALLOWED_PROXY_PATHS = new Set([
  "models",
  "chat/completions",
  "audio/speech",
]);

const PROXY_TIMEOUT_MS = 120_000;

async function isProxyAuthorized(request: NextRequest): Promise<boolean> {
  if (!isProduction()) {
    return true;
  }
  return hasGateCookie(request);
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  if (!(await isProxyAuthorized(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const defaults = getApiDefaults();
  if (!defaults) {
    return NextResponse.json(
      { error: "Server API config missing" },
      { status: 500 },
    );
  }

  const targetPath = path.join("/");
  if (!ALLOWED_PROXY_PATHS.has(targetPath)) {
    return NextResponse.json({ error: "Forbidden path" }, { status: 403 });
  }

  const target = `${defaults.apiBaseUrl}/${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${defaults.apiKey}`);

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body,
      redirect: "error",
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      { error: "Upstream unreachable" },
      { status: 502 },
    );
  }

  const responseHeaders = new Headers();
  const upstreamType = upstream.headers.get("content-type");
  if (upstreamType) {
    responseHeaders.set("Content-Type", upstreamType);
  }
  responseHeaders.set("Cache-Control", "no-cache");

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyRequest(request, path);
}
