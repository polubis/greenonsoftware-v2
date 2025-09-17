import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/kernel/db/supabase-server";
import { focus4API } from "@/ipc/contracts";
import { ValidationException, type InferDto } from "@/lib/clean-api-v2";
import { ErrorResponse, OkResponse } from "@/kernel/server/response";
import { updateFocusSessionRequestSchema } from "@/ipc/contracts/schemas";

export const GET: APIRoute = async (context) => {
  try {
    const supabase = createSupabaseServerClient(context);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return ErrorResponse(
        focus4API.error("getActiveFocusSession", {
          type: "unauthorized",
          status: 401,
          message: "Unauthorized",
        }),
      );
    }

    const { data: activeSession, error: sessionError } = await supabase
      .from("focus_sessions")
      .select(
        `
        id,
        task_id,
        started_at,
        ended_at,
        status,
        total_interruptions,
        tasks (
          id,
          title,
          description,
          priority,
          status,
          estimated_duration_minutes,
          creation_date,
          update_date,
          user_id
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (sessionError) {
      return ErrorResponse(
        focus4API.error("getActiveFocusSession", {
          type: "internal_server_error",
          status: 500,
          message: "Failed to fetch focus session",
        }),
      );
    }

    type Dto = InferDto<typeof focus4API, "getActiveFocusSession">;
    type Session = NonNullable<Dto["session"]>;
    type Task = NonNullable<Session["task"]>;

    const dto = focus4API.dto("getActiveFocusSession", {
      hasActiveSession: !!activeSession,
      session: activeSession
        ? {
            id: activeSession.id as Session["id"],
            taskId: activeSession.task_id as Session["taskId"],
            startedAt: new Date(
              activeSession.started_at,
            ).toISOString() as Session["startedAt"],
            endedAt: activeSession.ended_at
              ? (new Date(
                  activeSession.ended_at,
                ).toISOString() as Session["endedAt"])
              : null,
            status: activeSession.status as Session["status"],
            totalInterruptions: activeSession.total_interruptions,
            task: activeSession.tasks
              ? {
                  id: activeSession.tasks.id as Task["id"],
                  userId: activeSession.tasks.user_id as Task["userId"],
                  title: activeSession.tasks.title,
                  description: activeSession.tasks.description,
                  priority: activeSession.tasks.priority as Task["priority"],
                  status: activeSession.tasks.status as Task["status"],
                  creationDate: new Date(
                    activeSession.tasks.creation_date,
                  ).toISOString() as Task["creationDate"],
                  updateDate: new Date(
                    activeSession.tasks.update_date,
                  ).toISOString() as Task["updateDate"],
                  estimatedDurationMinutes: activeSession.tasks
                    .estimated_duration_minutes as Task["estimatedDurationMinutes"],
                }
              : null,
          }
        : null,
    });

    return OkResponse(dto, 200);
  } catch (error) {
    if (ValidationException.is(error)) {
      return ErrorResponse(
        focus4API.error("getActiveFocusSession", {
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
      focus4API.error("getActiveFocusSession", {
        type: "internal_server_error",
        status: 500,
        message: "Something went wrong during the request for focus session",
      }),
    );
  }
};

export const PATCH: APIRoute = async (context) => {
  try {
    const supabase = createSupabaseServerClient(context);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return ErrorResponse(
        focus4API.error("updateFocusSession", {
          type: "unauthorized",
          status: 401,
          message: "Unauthorized",
        }),
      );
    }

    // Parse and validate request body
    const body = await context.request.json();
    const validatedBody = updateFocusSessionRequestSchema.parse(body);

    // First, get the active focus session
    const { data: activeSession, error: sessionError } = await supabase
      .from("focus_sessions")
      .select(
        `
        id,
        task_id,
        started_at,
        ended_at,
        status,
        total_interruptions,
        tasks (
          id,
          title,
          description,
          priority,
          status,
          estimated_duration_minutes,
          creation_date,
          update_date,
          user_id
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("status", "active")
      .single();

    if (sessionError || !activeSession) {
      return ErrorResponse(
        focus4API.error("updateFocusSession", {
          type: "bad_request",
          status: 400,
          message: "No active focus session found",
          meta: {
            issues: [],
          },
        }),
      );
    }

    // Prepare update data
    const updateData: {
      status?: string;
      ended_at?: string;
      total_interruptions?: number;
    } = {};

    if (validatedBody.status) {
      updateData.status = validatedBody.status;
      // If finishing the session, set ended_at timestamp
      if (
        validatedBody.status === "completed" ||
        validatedBody.status === "abandoned"
      ) {
        updateData.ended_at = new Date().toISOString();
      }
    }

    if (validatedBody.incrementInterruptions) {
      // If incrementInterruptions is true, increment the current value by 1
      // This ensures server-side increment and prevents race conditions
      updateData.total_interruptions = activeSession.total_interruptions + 1;
    }

    // Update the focus session
    const { data: updatedSession, error: updateError } = await supabase
      .from("focus_sessions")
      .update(updateData)
      .eq("id", activeSession.id)
      .select(
        `
        id,
        task_id,
        started_at,
        ended_at,
        status,
        total_interruptions,
        tasks (
          id,
          title,
          description,
          priority,
          status,
          estimated_duration_minutes,
          creation_date,
          update_date,
          user_id
        )
      `,
      )
      .single();

    if (updateError || !updatedSession) {
      return ErrorResponse(
        focus4API.error("updateFocusSession", {
          type: "internal_server_error",
          status: 500,
          message: "Failed to update focus session",
        }),
      );
    }

    // Update the associated task status to 'done' if the session was completed
    if (validatedBody.status === "completed" && updatedSession.task_id) {
      await supabase
        .from("tasks")
        .update({ status: "done" })
        .eq("id", updatedSession.task_id)
        .eq("user_id", user.id);
    }

    type Dto = InferDto<typeof focus4API, "updateFocusSession">;
    type Session = Dto["session"];
    type Task = NonNullable<Session["task"]>;

    const dto = focus4API.dto("updateFocusSession", {
      success: true,
      session: {
        id: updatedSession.id as Session["id"],
        taskId: updatedSession.task_id as Session["taskId"],
        startedAt: new Date(
          updatedSession.started_at,
        ).toISOString() as Session["startedAt"],
        endedAt: updatedSession.ended_at
          ? (new Date(
              updatedSession.ended_at,
            ).toISOString() as Session["endedAt"])
          : null,
        status: updatedSession.status as Session["status"],
        totalInterruptions: updatedSession.total_interruptions,
        task: updatedSession.tasks
          ? {
              id: updatedSession.tasks.id as Task["id"],
              userId: updatedSession.tasks.user_id as Task["userId"],
              title: updatedSession.tasks.title,
              description: updatedSession.tasks.description,
              priority: updatedSession.tasks.priority as Task["priority"],
              status: updatedSession.tasks.status as Task["status"],
              creationDate: new Date(
                updatedSession.tasks.creation_date,
              ).toISOString() as Task["creationDate"],
              updateDate: new Date(
                updatedSession.tasks.update_date,
              ).toISOString() as Task["updateDate"],
              estimatedDurationMinutes: updatedSession.tasks
                .estimated_duration_minutes as Task["estimatedDurationMinutes"],
            }
          : null,
      },
    });

    return OkResponse(dto, 200);
  } catch (error) {
    if (ValidationException.is(error)) {
      return ErrorResponse(
        focus4API.error("updateFocusSession", {
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
      focus4API.error("updateFocusSession", {
        type: "internal_server_error",
        status: 500,
        message:
          "Something went wrong during the request to update focus session",
      }),
    );
  }
};
