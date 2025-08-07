import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../shared/db/supabase-server";
import { AppRouter } from "../../shared/routing/app-router";

export const POST: APIRoute = async (context) => {
  const supabaseServerClient = createSupabaseServerClient(context);
  const formData = await context.request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  const { error } = await supabaseServerClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return context.redirect(AppRouter.getPath("dashboard"), 303);
};
