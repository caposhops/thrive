import { NextResponse } from "next/server";

/**
 * TEMPORARY diagnostic. Delete after solving the env var visibility mystery.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fingerprint(v: string | undefined) {
  if (!v) return { present: false };
  return {
    present: true,
    length: v.length,
    first_char_code: v.charCodeAt(0),
    prefix: v.slice(0, 8),
  };
}

export async function GET() {
  // Anything that looks like our var — case-insensitive, partial match
  const suspicious = Object.entries(process.env)
    .filter(([k]) => /anthrop|claude|coach/i.test(k))
    .map(([k, v]) => ({
      key: k,
      length: v?.length ?? 0,
      first_chars: v?.slice(0, 8) ?? null,
    }));

  // Count total env vars visible so we can see if something looks off
  const all_env_keys = Object.keys(process.env);

  return NextResponse.json({
    now: new Date().toISOString(),
    vercel_env: process.env.VERCEL_ENV,
    vercel_deployment_id: process.env.VERCEL_DEPLOYMENT_ID,
    vercel_url: process.env.VERCEL_URL,
    total_env_keys: all_env_keys.length,
    matching_keys: suspicious,
    keys: {
      ANTHROPIC_API_KEY: fingerprint(process.env.ANTHROPIC_API_KEY),
      // Also try alternate castings just in case something weird is happening
      anthropic_api_key: fingerprint(process.env.anthropic_api_key),
      ANTHROPIC_KEY: fingerprint(process.env.ANTHROPIC_KEY),
      NEXT_PUBLIC_SUPABASE_URL: fingerprint(process.env.NEXT_PUBLIC_SUPABASE_URL),
    },
    // Show every env var that starts with a capital letter (i.e. user-set) —
    // this reveals what Vercel IS injecting
    user_env_keys: all_env_keys
      .filter((k) => /^[A-Z]/.test(k) && !k.startsWith("VERCEL_") && !k.startsWith("AWS_") && !k.startsWith("NX_") && !k.startsWith("PATH") && !k.startsWith("NODE_") && !k.startsWith("NEXT_"))
      .sort(),
  });
}
