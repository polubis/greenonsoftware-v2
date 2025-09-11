import type { APIRoute } from "astro";
import { createSupabaseServerClient } from "@/shared/db/supabase-server";
import { focus4API } from "@/shared/contracts";
import { ValidationException, type InferDto } from "@/lib/clean-api-v2";
import { ErrorResponse, OkResponse } from "@/shared/server/response";

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
