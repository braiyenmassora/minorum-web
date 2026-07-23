import type { NextRequest, NextResponse } from "next/server";

export const GATE_COOKIE_NAME = "minorum_gate";
const GATE_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 30;

function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

function gateSessionSecret(): string {
  const secret = process.env.GATE_SESSION_SECRET?.trim();
  if (secret) {
    return secret;
  }
  if (isProduction()) {
    throw new Error(
      "[env] GATE_SESSION_SECRET is required in production. Set it in .env and restart.",
    );
  }
  return "dev-gate-session-secret";
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

let hmacKeyPromise: Promise<CryptoKey> | undefined;

function getHmacKey(): Promise<CryptoKey> {
  hmacKeyPromise ??= crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(gateSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return hmacKeyPromise;
}

async function signPayload(payload: string): Promise<string> {
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(payload),
  );
  return bytesToBase64Url(new Uint8Array(signature));
}

function timingSafeEqualString(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function createGateToken(): Promise<string> {
  const exp = Date.now() + GATE_COOKIE_MAX_AGE_SEC * 1000;
  const payload = String(exp);
  return `${payload}.${await signPayload(payload)}`;
}

export async function verifyGateToken(
  token: string | undefined,
): Promise<boolean> {
  if (!token) {
    return false;
  }

  const dot = token.lastIndexOf(".");
  if (dot <= 0) {
    return false;
  }

  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(payload);
  if (!Number.isFinite(exp) || Date.now() > exp) {
    return false;
  }

  const expected = await signPayload(payload);
  return timingSafeEqualString(sig, expected);
}

export async function hasGateCookie(request: NextRequest): Promise<boolean> {
  return verifyGateToken(request.cookies.get(GATE_COOKIE_NAME)?.value);
}

export async function applyGateCookie(
  response: NextResponse,
  maxAge: number = GATE_COOKIE_MAX_AGE_SEC,
): Promise<void> {
  response.cookies.set(GATE_COOKIE_NAME, await createGateToken(), {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

export function clearGateCookie(response: NextResponse): void {
  response.cookies.set(GATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction(),
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
