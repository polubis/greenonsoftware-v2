import type { APIRoute } from "astro";
import type { Provider } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "../../../shared/db/supabase-server";
import { AppRouter } from "../../../shared/routing/app-router";

export const POST: APIRoute = async (context) => {
  const supabaseServerClient = createSupabaseServerClient(context);
  const formData = await context.request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const provider = formData.get("provider")?.toString();

  // If provider is specified, start OAuth flow and redirect to provider URL
  if (provider) {
    const { data, error } = await supabaseServerClient.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: import.meta.env.AUTH_CALLBACK_URL,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    if (!data?.url) {
      return new Response("Missing redirect URL from provider.", { status: 500 });
    }

    return context.redirect(data.url, 303);
  }

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
