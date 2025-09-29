import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import type { TablesInsert, TablesUpdate } from "@/kernel/db/database.types";
import * as z from "zod";
import { focus4API } from "@/ipc/contracts";
import { ValidationException, type InferDto } from "@/lib/clean-api-v2";
import { ErrorResponse, OkResponse } from "@/kernel/server/response";

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
      estimatedDurationMinutes: Number.parseInt(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form.get("estimatedDurationMinutes") as any,
      ),
    } as Record<string, unknown>;
  }

  return {};
};

const updateTaskSchema = z
  .object({
    id: z.coerce.number().int().positive(),
    title: z
      .preprocess(
        (v) => (typeof v === "string" ? v.trim() : undefined),
        z
          .string()
          .min(3, { message: "title must be 3-280 characters" })
          .max(280, { message: "title must be 3-280 characters" }),
      )
      .optional(),
    description: z
      .preprocess(
        (v) => {
          if (v === undefined) return undefined;
          if (v == null) return null;
          const trimmed = String(v).trim();
          return trimmed === "" ? null : trimmed;
        },
        z.union([z.literal(null), z.string().min(10).max(500)]),
      )
      .optional(),
    priority: z
      .preprocess(
        (v) => (v === "" ? undefined : v),
        z.enum(["urgent", "high", "normal", "low"]),
      )
      .optional(),
    status: z
      .preprocess(
        (v) => (v === "" ? undefined : v),
        z.enum(["todo", "pending", "done"]),
      )
      .optional(),
  })
  .refine(
    (d) =>
      d.title !== undefined ||
      d.description !== undefined ||
      d.priority !== undefined ||
      d.status !== undefined,
    { message: "At least one field must be provided for update", path: ["_"] },
  );

const deleteTaskSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const POST: APIRoute = async (context) => {
  try {
    const supabase = createSupabaseServerClient(context);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return ErrorResponse(
        focus4API.error("createTask", {
          type: "unauthorized",
          status: 401,
          message: "Unauthorized",
        }),
      );
    }

    const rawPayload = await context.request.json();
    const payload = await focus4API.payload("createTask", rawPayload);

    const insert: TablesInsert<"tasks"> = {
      title: payload.title,
      description:
        payload.description.length === 0 ? null : payload.description,
      priority: payload.priority,
      status: payload.status,
      user_id: user.id,
      estimated_duration_minutes: payload.estimatedDurationMinutes,
    };

    const { data, error } = await supabase
      .from("tasks")
      .insert(insert)
      .select()
      .single();

    if (error) {
      return ErrorResponse(
        focus4API.error("createTask", {
          type: "internal_server_error",
          status: 500,
          message: error.message,
        }),
      );
    }

    type Dto = InferDto<typeof focus4API, "createTask">;

    const dto = focus4API.dto("createTask", {
      id: data.id as Dto["id"],
      userId: data.user_id as Dto["userId"],
      title: data.title,
      description: data.description,
      priority: data.priority as Dto["priority"],
      status: data.status as Dto["status"],
      creationDate: new Date(
        data.creation_date,
      ).toISOString() as Dto["creationDate"],
      updateDate: new Date(data.update_date).toISOString() as Dto["updateDate"],
      estimatedDurationMinutes: data.estimated_duration_minutes,
    });

    return OkResponse(dto, 201);
  } catch (error) {
    if (ValidationException.is(error)) {
      return ErrorResponse(
        focus4API.error("createTask", {
          type: "bad_request",
          status: 400,
          message: "Invalid payload",
          meta: {
            issues: error.issues.map((issue) => ({
              path: issue.path.map((p) => String(p)),
              message: issue.message,
            })),
          },
        }),
      );
    }

    return ErrorResponse(
      focus4API.error("createTask", {
        type: "internal_server_error",
        status: 500,
        message: "Unexpected error during task creation",
      }),
    );
  }
};

export const GET: APIRoute = async (context) => {
  try {
    const supabase = createSupabaseServerClient(context);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return ErrorResponse(
        focus4API.error("getTasks", {
          type: "unauthorized",
          status: 401,
          message: "Unauthorized",
        }),
      );
    }

    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("creation_date", { ascending: false });

    if (error) {
      return ErrorResponse(
        focus4API.error("getTasks", {
          type: "internal_server_error",
          status: 500,
          message: error.message,
        }),
      );
    }

    type Dto = InferDto<typeof focus4API, "getTasks">;
    type Task = Dto["tasks"][number];

    const dto = focus4API.dto("getTasks", {
      tasks: data.map((task) => {
        return {
          id: task.id as Task["id"],
          title: task.title,
          description: task.description,
          priority: task.priority as Task["priority"],
          status: task.status as Task["status"],
          creationDate: new Date(
            task.creation_date,
          ).toISOString() as Task["creationDate"],
          updateDate: new Date(
            task.update_date,
          ).toISOString() as Task["updateDate"],
          estimatedDurationMinutes:
            task.estimated_duration_minutes as Task["estimatedDurationMinutes"],
          userId: task.user_id as Task["userId"],
        };
      }),
    });

    return OkResponse(dto, 200);
  } catch (error) {
    if (ValidationException.is(error)) {
      return ErrorResponse(
        focus4API.error("getTasks", {
          type: "bad_request",
          status: 400,
          message: "Invalid input",
          meta: {
            issues: error.issues.map((issue) => ({
              path: issue.path.map((p) => String(p)),
              message: issue.message,
            })),
          },
        }),
      );
    }

    return ErrorResponse(
      focus4API.error("getTasks", {
        type: "internal_server_error",
        status: 500,
        message: "Something went wrong during the request for tasks",
      }),
    );
  }
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
