import { type NextRequest, NextResponse } from "next/server";

const API_BASE_HEADER = "x-minorum-api-base";

function isAllowedBaseUrl(baseUrl: string): boolean {
  try {
    const parsed = new URL(baseUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

async function proxyRequest(
  request: NextRequest,
  path: string[],
): Promise<NextResponse> {
  const baseUrl = request.headers.get(API_BASE_HEADER);
  if (!baseUrl || !isAllowedBaseUrl(baseUrl)) {
    return NextResponse.json({ error: "Invalid API base URL" }, { status: 400 });
  }

  const normalizedBase = baseUrl.replace(/\/+$/, "");
  const targetPath = path.join("/");
  const target = `${normalizedBase}/${targetPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const authorization = request.headers.get("authorization");
  if (authorization) {
    headers.set("Authorization", authorization);
  }

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
    });
  } catch {
    return NextResponse.json({ error: "Upstream unreachable" }, { status: 502 });
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
