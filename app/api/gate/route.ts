import { NextResponse } from "next/server";

import { pickDefaultModel } from "@/lib/core/config/model-label";

const GATE_COOKIE = "minorum_gate";
const GATE_COOKIE_VALUE = "1";
const GATE_PASSWORD = process.env.GATE_PASSWORD?.trim() || "REDACTED";

function normalizeApiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  if (!trimmed) {
    throw new Error("API URL kosong");
  }
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function readApiDefaults(): {
  apiBaseUrl: string;
  apiKey: string;
  preferredModel: string;
} | null {
  const apiBaseUrl = process.env.MINORUM_DEFAULT_API_URL?.trim() ?? "";
  const apiKey = process.env.MINORUM_DEFAULT_API_KEY?.trim() ?? "";
  const preferredModel = process.env.MINORUM_DEFAULT_MODEL?.trim() ?? "";
  if (!apiBaseUrl || !apiKey) {
    return null;
  }
  try {
    return {
      apiBaseUrl: normalizeApiBaseUrl(apiBaseUrl),
      apiKey,
      preferredModel,
    };
  } catch {
    return null;
  }
}

async function testApiConnection(
  apiBaseUrl: string,
  apiKey: string,
): Promise<
  | { ok: true; models: string[] }
  | { ok: false; status: number; message: string }
> {
  let upstream: Response;
  try {
    upstream = await fetch(`${apiBaseUrl}/models`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
    });
  } catch {
    return { ok: false, status: 502, message: "Connection failed" };
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return { ok: false, status: 401, message: "API key/URL salah" };
  }

  if (!upstream.ok) {
    return { ok: false, status: 502, message: "Connection failed" };
  }

  let body: unknown;
  try {
    body = await upstream.json();
  } catch {
    return { ok: false, status: 502, message: "API key/URL salah" };
  }

  if (
    typeof body !== "object" ||
    body === null ||
    !Array.isArray((body as { data?: unknown }).data)
  ) {
    return { ok: false, status: 502, message: "API key/URL salah" };
  }

  const models = [
    ...new Set(
      ((body as { data: Array<{ id?: string }> }).data ?? [])
        .map((model) => model.id)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  ];

  return { ok: true, models };
}

export async function POST(request: Request) {
  let password = "";

  try {
    const body = (await request.json()) as { password?: unknown };
    password = typeof body.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (password !== GATE_PASSWORD) {
    return NextResponse.json(
      { ok: false, message: "Wrong password" },
      { status: 401 },
    );
  }

  const defaults = readApiDefaults();
  if (!defaults) {
    return NextResponse.json(
      { ok: false, message: "Server API config missing" },
      { status: 500 },
    );
  }

  const probe = await testApiConnection(defaults.apiBaseUrl, defaults.apiKey);
  if (!probe.ok) {
    return NextResponse.json(
      { ok: false, message: probe.message },
      { status: probe.status },
    );
  }

  const modelName =
    pickDefaultModel(probe.models, defaults.preferredModel) ?? "";

  const response = NextResponse.json({
    ok: true,
    config: {
      apiBaseUrl: defaults.apiBaseUrl,
      apiKey: defaults.apiKey,
      modelName,
    },
  });
  response.cookies.set(GATE_COOKIE, GATE_COOKIE_VALUE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(GATE_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
