import type { APIRoute } from "astro";
import { Session } from "../../server/auth/session";
import { AppRouter } from "../../shared/routing/app-router";

export const prerender = false;

export const GET: APIRoute = async ({ cookies, redirect }) => {
  Session.delete(cookies);
  return redirect(AppRouter.getPath("login"));
};
