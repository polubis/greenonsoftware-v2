import type { APIRoute } from 'astro';
import { createSupabaseServerClient } from '../../db/supabase-server';

export const POST: APIRoute = async (context) => {
  const supabaseServerClient = createSupabaseServerClient(context);
  const { error } = await supabaseServerClient.auth.signOut();

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return context.redirect('/', 303);
};