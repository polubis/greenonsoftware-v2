import { createServerClient, parseCookieHeader } from "@supabase/ssr";
import type { AstroCookies } from "astro";
import { type Database } from "./database.types";

export const createSupabaseServerClient = ({
  request,
  cookies,
}: {
  request: Request;
  cookies: AstroCookies;
}) => {
  const cookieHeader = request.headers.get("Cookie") || "";

  return createServerClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          const cookies = parseCookieHeader(cookieHeader);
          return cookies.map(({ name, value }) => ({
            name,
            value: value ?? "",
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookies.set(name, value, options)
          );
        },
      },
    },
  );
};
