import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "../../shared/db/supabase-server";
import type { TablesInsert, TablesUpdate } from "../../shared/db/database.types";
import { AppRouter } from "../../shared/routing/app-router";
import { z } from "zod";

const parseBody = async (
  request: Request,
): Promise<Record<string, unknown>> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return (await request.json()) as Record<string, unknown>;
  }

  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await request.formData();
    
    const toStringOrUndefined = (v: FormDataEntryValue | null) =>
      v == null ? undefined : v.toString();
    return {
      id: toStringOrUndefined(form.get("id")),
      title: toStringOrUndefined(form.get("title")),
      description: toStringOrUndefined(form.get("description")),
      priority: toStringOrUndefined(form.get("priority")),
      status: toStringOrUndefined(form.get("status")),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      estimatedDurationMinutes: Number.parseInt(form.get("estimatedDurationMinutes") as any),
    } as Record<string, unknown>;
  }

  return {};
};

const createTaskSchema = z.object({
  title: z.preprocess(
    (v) => (typeof v === "string" ? v.trim() : ""),
    z
      .string()
      .min(3, { message: "title must be 3-280 characters" })
      .max(280, { message: "title must be 3-280 characters" }),
  ),
  description: z.preprocess(
    (v) => {
      if (v == null) return null;
      const trimmed = String(v).trim();
      return trimmed === "" ? null : trimmed;
    },
    z.union([z.literal(null), z.string().min(10).max(500)]),
  ),
  priority: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["urgent", "high", "normal", "low"]).optional(),
  ),
  status: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(["todo", "pending", "done"]).optional(),
  ),
  estimatedDurationMinutes: z.number().int().positive(),
});

const updateTaskSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    title: z
      .preprocess((v) => (typeof v === "string" ? v.trim() : undefined),
        z.string().min(3, { message: "title must be 3-280 characters" }).max(280, { message: "title must be 3-280 characters" })
      )
      .optional(),
    description: z
      .preprocess((v) => {
        if (v === undefined) return undefined;
        if (v == null) return null;
        const trimmed = String(v).trim();
        return trimmed === "" ? null : trimmed;
      }, z.union([z.literal(null), z.string().min(10).max(500)]))
      .optional(),
    priority: z
      .preprocess((v) => (v === "" ? undefined : v), z.enum(["urgent", "high", "normal", "low"]))
      .optional(),
    status: z
      .preprocess((v) => (v === "" ? undefined : v), z.enum(["todo", "pending", "done"]))
      .optional(),
  })
  .refine(
    (d) => d.title !== undefined || d.description !== undefined || d.priority !== undefined || d.status !== undefined,
    { message: "At least one field must be provided for update", path: ["_"] },
  );

const deleteTaskSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const POST: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);
  const contentType = context.request.headers.get("content-type") ?? "";
  const isJsonRequest = contentType.includes("application/json");

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const raw = await parseBody(context.request);
  const parsed = createTaskSchema.safeParse(raw);

  if (!parsed.success) {
    if (isJsonRequest) {
      return new Response(JSON.stringify({ errors: parsed.error.flatten() }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response("Invalid input", { status: 400 });
  }

  const insert: TablesInsert<"tasks"> = {
    title: parsed.data.title,
    description: parsed.data.description ?? null,
    priority: parsed.data.priority ?? undefined,
    status: parsed.data.status ?? undefined,
    user_id: user.id,
    estimated_duration_minutes: parsed.data.estimatedDurationMinutes,
  };

  const { data, error } = await supabase
    .from("tasks")
    .insert(insert)
    .select()
    .single();

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  if (!isJsonRequest) {
    return context.redirect(AppRouter.getPath("tasks"), 303);
  }

  return new Response(JSON.stringify(data), {
    status: 201,
    headers: { "content-type": "application/json" },
  });
};

export const GET: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .order("creation_date", { ascending: false });

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return new Response(JSON.stringify(data ?? []), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const PATCH: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const raw = await parseBody(context.request);
  const parsed = updateTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ errors: parsed.error.flatten() }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const id = parsed.data.id;
  const update: TablesUpdate<"tasks"> = {
    title: parsed.data.title,
    description: parsed.data.description ?? undefined,
    priority: parsed.data.priority,
    status: parsed.data.status,
  };

  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const DELETE: APIRoute = async (context) => {
  const supabase = createSupabaseServerClient(context);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const raw = await parseBody(context.request);
  const parsed = deleteTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(JSON.stringify({ errors: parsed.error.flatten() }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const id = parsed.data.id;

  const { data, error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return new Response(error.message, { status: 400 });
  }

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};
