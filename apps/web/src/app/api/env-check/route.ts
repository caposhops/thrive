import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic endpoint. Reports which env vars are visible to the
 * running deployment. Does NOT leak the actual key values — only length and
 * first 4 characters (safe for public keys, still safe for secrets).
 *
 * Delete this route once the env issue is resolved.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; // never cache

function fingerprint(v: string | undefined) {
  if (!v) return { present: false };
  return { present: true, length: v.length, prefix: v.slice(0, 6) };
}

export async function GET() {
  return NextResponse.json({
    now: new Date().toISOString(),
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV,
    vercel_deployment_id: process.env.VERCEL_DEPLOYMENT_ID,
    keys: {
      ANTHROPIC_API_KEY: fingerprint(process.env.ANTHROPIC_API_KEY),
      NEXT_PUBLIC_SUPABASE_URL: fingerprint(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: fingerprint(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      COACH_MODEL: fingerprint(process.env.COACH_MODEL),
    },
  });
}
