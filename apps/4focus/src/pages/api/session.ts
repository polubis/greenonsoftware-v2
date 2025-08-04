import type { APIRoute } from "astro";
import { Session } from "../../server/auth/session";

export const prerender = false;

export const GET: APIRoute = async ({ cookies }) => {
  const session = await Session.extend(cookies);

  if (!session) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), {
      status: 401,
    });
  }

  return new Response(
    JSON.stringify({
      email: session.user?.email,
      id: session.user?.id,
    }),
    { status: 200 },
  );
};
