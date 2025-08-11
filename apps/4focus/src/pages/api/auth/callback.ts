import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../shared/db/supabase-server";
import { AppRouter } from "../../../shared/routing/app-router";

// Handles OAuth provider redirect back to the app
export const GET: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);
  const code = new URL(context.request.url).searchParams.get("code");

  if (!code) {
    return new Response("No code provided", { status: 400 });
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return context.redirect(AppRouter.getPath("dashboard"), 303);
};
