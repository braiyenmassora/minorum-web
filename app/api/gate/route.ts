import { type NextRequest, NextResponse } from "next/server";

import {
  applyGateCookie,
  clearGateCookie,
  hasGateCookie,
} from "@/lib/core/auth/gate-cookie";
import { pickDefaultModel } from "@/lib/core/config/model-label";
import { readWebToolsConfigFromEnv } from "@/lib/env";
import { getApiDefaults, getGatePassword, isProduction } from "@/lib/env";
import { gateLoginBodySchema } from "@/lib/validations/gate";

async function testApiConnection(
  apiBaseUrl: string,
  apiKey: string,
): Promise<
  | { ok: true; models: string[]; comboIds: string[] }
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
      signal: AbortSignal.timeout(15_000),
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

  const rows = (body as { data: Array<{ id?: string; owned_by?: string }> })
    .data;
  const models: string[] = [];
  const comboIds: string[] = [];
  const seen = new Set<string>();

  for (const model of rows) {
    if (typeof model.id !== "string" || !model.id || seen.has(model.id)) {
      continue;
    }
    seen.add(model.id);
    models.push(model.id);
    if (
      model.owned_by === "combo" ||
      model.id === "auto" ||
      model.id.startsWith("auto/")
    ) {
      comboIds.push(model.id);
    }
  }

  return { ok: true, models, comboIds };
}

/** Sync API URL/key from current .env into an already-logged-in client. */
export async function GET(request: NextRequest) {
  if (isProduction() && !(await hasGateCookie(request))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const defaults = getApiDefaults();
  if (!defaults) {
    return NextResponse.json(
      { ok: false, message: "Server API config missing" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    config: {
      apiBaseUrl: defaults.apiBaseUrl,
      apiKey: defaults.apiKey,
      preferredModel: defaults.preferredModel,
    },
    webTools: readWebToolsConfigFromEnv(),
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = gateLoginBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  if (parsed.data.password !== getGatePassword()) {
    return NextResponse.json(
      { ok: false, message: "Wrong password" },
      { status: 401 },
    );
  }

  const defaults = getApiDefaults();
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
    pickDefaultModel(probe.models, defaults.preferredModel, probe.comboIds) ??
    "";

  const response = NextResponse.json({
    ok: true,
    config: {
      apiBaseUrl: defaults.apiBaseUrl,
      apiKey: defaults.apiKey,
      modelName,
    },
    webTools: readWebToolsConfigFromEnv(),
  });
  await applyGateCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearGateCookie(response);
  return response;
}
