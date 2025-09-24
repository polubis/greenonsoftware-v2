import { context } from "@/lib/context";
import { useTaskCreation, useTasksLoad } from "./tasks-management";

const [TasksProvider, useTasksContext] = context(() => {
  const load = useTasksLoad();
  const creation = useTaskCreation();

  return {
    load,
    creation,
  };
});

export { TasksProvider, useTasksContext };
