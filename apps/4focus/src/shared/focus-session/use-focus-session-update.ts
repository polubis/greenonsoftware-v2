import { useClientAuthState } from "@/shared/client-auth/use-client-auth-state";
import { focus4API, parseFocus4APIError } from "@/shared/contracts";
import { useState } from "react";

type UpdateFocusSessionState =
  | {
      status: "idle";
    }
  | {
      status: "busy";
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "success";
      data: {
        success: boolean;
        session: {
          id: number;
          taskId: number;
          startedAt: string;
          endedAt: string | null;
          status: "active" | "completed" | "abandoned";
          totalInterruptions: number;
          task: {
            id: number;
            userId: string;
            title: string;
            description: string | null;
            priority: "urgent" | "high" | "normal" | "low";
            status: "todo" | "pending" | "done";
            creationDate: string;
            updateDate: string;
            estimatedDurationMinutes: number;
          } | null;
        };
      };
    };

const useFocusSessionUpdate = () => {
  const authState = useClientAuthState();
  const [state, setState] = useState<UpdateFocusSessionState>({
    status: "idle",
  });

  const updateFocusSession = async (payload: {
    status?: "completed" | "abandoned";
    incrementInterruptions?: boolean;
  }) => {
    if (authState.status !== "authenticated") {
      setState({
        status: "error",
        message: "User not authenticated",
      });
      return;
    }

    try {
      setState({ status: "busy" });

      const data = await focus4API.call("updateFocusSession", {
        extra: { signal: new AbortController().signal },
        payload,
      });

      setState({
        status: "success",
        data,
      });
    } catch (e) {
      const parsed = parseFocus4APIError("updateFocusSession", e);

      if (parsed.type === "aborted") {
        return;
      }

      setState({
        status: "error",
        message: parsed.message,
      });
    }
  };

  const completeSession = () => {
    return updateFocusSession({ status: "completed" });
  };

  const abandonSession = () => {
    return updateFocusSession({ status: "abandoned" });
  };

  const incrementInterruptions = () => {
    return updateFocusSession({ incrementInterruptions: true });
  };

  return [
    state,
    {
      updateFocusSession,
      completeSession,
      abandonSession,
      incrementInterruptions,
    },
  ] as const;
};

export { useFocusSessionUpdate };
