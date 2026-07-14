import { NextResponse } from "next/server";

/** Server clock for empty-state (Vercel UTC → client formats as WIB). */
export function GET() {
  return NextResponse.json({ now: Date.now() });
}
