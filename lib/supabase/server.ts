import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                httpOnly: true,
                path: "/",
              });
            });
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be safely ignored in Next.js if middleware is refreshing sessions.
          }
        },
      },
    }
  );
}
