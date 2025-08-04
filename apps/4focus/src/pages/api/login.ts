import type { APIRoute } from "astro";
import { supabase } from "../../server/db/client";
import { Session } from "../../server/auth/session";
import { AppRouter } from "../../shared/routing/app-router";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();

  if (!email || !password) {
    return new Response("Email and password are required", { status: 400 });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  const { access_token, refresh_token } = data.session;

  Session.set(cookies, {
    accessToken: access_token,
    refreshToken: refresh_token,
  });

  return redirect(AppRouter.getPath("tasks"));
};
