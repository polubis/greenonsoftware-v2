import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerClient } from "../../shared/db/supabase-server";

const querySchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const GET: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const url = new URL(context.request.url);
  const idParam = url.searchParams.get("id");
  const parsed = querySchema.safeParse({ id: idParam });
  if (!parsed.success) {
    return new Response("Invalid or missing id", { status: 400 });
  }

  const taskId = parsed.data.id;

  const { data, error } = await supabase
    .from("tasks_history")
    .select("id, task_id, operation, changed_at, title, description, priority, status, creation_date, update_date")
    .eq("task_id", taskId)
    .order("changed_at", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return new Response(JSON.stringify(data ?? []), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};


