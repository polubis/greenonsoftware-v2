import { useAuthState } from "@/kernel/auth/use-auth-state";
import { focus4API, parseFocus4APIError } from "@/ipc/contracts";
import { useEffect, useState } from "react";

type Task = {
  id: number;
  userId: string;
  title: string;
  description: string | null;
  priority: "urgent" | "high" | "normal" | "low";
  status: "todo" | "pending" | "done";
  creationDate: string;
  updateDate: string;
  estimatedDurationMinutes: number;
};

type FocusSession = {
  id: number;
  taskId: number;
  startedAt: string;
  endedAt: string | null;
  status: "active" | "completed" | "abandoned";
  totalInterruptions: number;
  task: Task | null;
};

type FocusSessionLoadState =
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
        hasActiveSession: boolean;
        session: FocusSession | null;
      };
    };

const useFocusSessionLoad = () => {
  const authState = useAuthState();
  const [state, setState] = useState<FocusSessionLoadState>({ status: "idle" });

  useEffect(() => {
    const abortController = new AbortController();

    (async () => {
      try {
        if (authState.status !== "authenticated") {
          return;
        }

        setState({ status: "busy" });

        const data = await focus4API.call("getActiveFocusSession", {
          extra: { signal: abortController.signal },
        });

        setState({
          status: "success",
          data: {
            hasActiveSession: data.hasActiveSession,
            session: data.session,
          },
        });
      } catch (e) {
        const parsed = parseFocus4APIError("getActiveFocusSession", e);

        if (parsed.type === "aborted") {
          return;
        }

        setState({
          status: "error",
          message: parsed.message,
        });
      }
    })();

    return () => {
      abortController.abort();
    };
  }, [authState.status]);

  return [state] as const;
};

export { useFocusSessionLoad };
