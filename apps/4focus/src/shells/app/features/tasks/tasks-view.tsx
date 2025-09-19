import { useTasksQuery } from "./use-tasks-query";

const TasksView = () => {
  const { data, isLoading, error } = useTasksQuery();

  if (isLoading) {
    return <div>Loading tasks...</div>;
  }

  if (error) {
    return <div>Error loading tasks: {error.message}</div>;
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <div>No tasks found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-4">Tasks</h1>
    </div>
  );
};

export { TasksView };
