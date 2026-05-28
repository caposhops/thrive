/**
 * Supabase client scaffolding.
 *
 * Once you've created a Supabase project:
 *   1. npm install @supabase/supabase-js @supabase/ssr
 *   2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
 *   3. Uncomment the implementation below
 *   4. Run the SQL in src/lib/supabase/schema.sql against your project
 */

export type ThriveUser = {
  id: string;
  email: string;
  display_name: string | null;
};

// Uncomment when ready:
//
// import { createBrowserClient } from "@supabase/ssr";
//
// export function getBrowserClient() {
//   return createBrowserClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//   );
// }

export function getBrowserClient(): never {
  throw new Error(
    "Supabase not configured yet. See src/lib/supabase/client.ts for setup instructions.",
  );
}
