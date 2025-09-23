import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { focus4API } from "@/ipc/contracts";

import type { InferDto, InferPayload } from "@/lib/clean-api-v2";

type Task = InferDto<typeof focus4API, "getTasks">["tasks"][number];
type TaskCreationPayload = InferPayload<typeof focus4API, "createTask">;

const TASKS_QUERY_KEY = ["tasks"] as const;

const useTasksLoad = () => {
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

const useTaskCreation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: TaskCreationPayload) => {
      const data = await focus4API.call("createTask", {
        payload,
      });
      return data;
    },
    onMutate: async (task) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(TASKS_QUERY_KEY);

      // Create optimistic task with temporary ID
      const optimisticTask: Task = {
        id: Date.now() as Task["id"],
        title: task.title,
        description: task.description,
        priority: task.priority,
        status: task.status,
        creationDate: new Date().toISOString() as Task["creationDate"],
        updateDate: new Date().toISOString() as Task["updateDate"],
        estimatedDurationMinutes: task.estimatedDurationMinutes,
        userId: "" as Task["userId"],
      };

      // Optimistically update to the new value
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old) => {
        if (!old) return [optimisticTask];
        return [...old, optimisticTask];
      });

      // Return a context object with the snapshotted value and optimistic task
      return { previousTasks, optimisticTask };
    },
    onError: (err, taskData, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousTasks);
      }
      // Error is already parsed in mutationFn, so err is the parsed error
    },
    onSuccess: (data, variables, context) => {
      // Replace the optimistic task with the real task from server
      queryClient.setQueryData<Task[]>(TASKS_QUERY_KEY, (old) => {
        if (!old) return [data];
        return old.map((task) =>
          task.id === context?.optimisticTask.id ? data : task,
        );
      });
    },
  });
};

export type { Task, TaskCreationPayload };
export { useTasksLoad, useTaskCreation };
