import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../../shared/db/supabase-server";
import { AppRouter } from "../../../kernel/routing/app-router";

export const POST: APIRoute = async (context) => {
  const supabaseServerClient = createSupabaseServerClient(context);
  const { error } = await supabaseServerClient.auth.signOut();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return context.redirect(AppRouter.getPath("logout"), 303);
};
