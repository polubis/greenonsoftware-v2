import { useQuery } from "@tanstack/react-query";
import { focus4API } from "@/shared/contracts";

import type { InferDto } from "@/lib/clean-api-v2";

type Task = InferDto<typeof focus4API, "getTasks">["tasks"][number];

const TASKS_QUERY_KEY = ["tasks"] as const;

const useTasksQuery = () => {
  return useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: async ({ signal }): Promise<Task[]> => {
      const data = await focus4API.call("getTasks", {
        extra: { signal },
      });
      return data.tasks;
    },
  });
};

export type { Task };
export { useTasksQuery };
