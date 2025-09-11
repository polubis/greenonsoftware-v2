import { useClientAuthState } from "@/shared/client-auth/use-client-auth-state";
import { focus4API, parseFocus4APIError } from "@/shared/contracts";
import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  creationDate: string;
  updateDate: string;
};

type TasksLoadState =
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
      data: Task[];
    };

const useTasksLoad = () => {
  const authState = useClientAuthState();
  const [state, setState] = useState<TasksLoadState>({ status: "idle" });

  useEffect(() => {
    const abortController = new AbortController();

    (async () => {
      try {
        if (authState.status !== "authenticated") {
          return;
        }

        setState({ status: "busy" });

        const data = await focus4API.call("getTasks", {
          extra: { signal: abortController.signal },
        });

        setState({
          status: "success",
          data: data.tasks,
        });
      } catch (e) {
        const parsed = parseFocus4APIError("getTasks", e);

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

export { useTasksLoad };
