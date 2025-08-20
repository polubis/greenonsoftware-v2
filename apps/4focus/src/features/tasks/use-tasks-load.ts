import { useClientAuthState } from "@/shared/client-auth/use-client-auth-state";
import { focus4API } from "@/shared/contracts";
import { useEffect, useState } from "react";

type Task = {
  id: number;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  creation_date: string;
  update_date: string;
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
    (async () => {
      console.log(authState.status);
      if (authState.status !== "authenticated") {
        return;
      }

      setState({ status: "busy" });

      const [success, data] = await focus4API.safeCall("getTasks");

      if (success) {
        setState({
          status: "success",
          data: data.tasks.map<Task>((task) => ({
            id: task.id,
            title: task.title,
            description: task.description,
            priority: task.priority,
            status: task.status,
            creation_date: task.creation_date,
            update_date: task.update_date,
          })),
        });
      } else {
        if (data.type === "aborted") {
          return;
        }

        setState({
          status: "error",
          message: data.message,
        });
      }
    })();

    return () => {};
  }, [authState]);

  return [state] as const;
};

export { useTasksLoad };
