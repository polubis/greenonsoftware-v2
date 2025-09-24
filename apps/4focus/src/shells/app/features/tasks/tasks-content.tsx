import { Skeleton } from "@/lib/ui/components/skeleton";
import { useTasksContext } from "./tasks-provider";
import { TaskColumn } from "./task-column";
import {
  ErrorDescription,
  ErrorFooter,
  ErrorHeader,
  ErrorIcon,
  ErrorScreen,
} from "./error-screen";
import { parseFocus4APIError } from "@/ipc/contracts";
import { Button } from "@/lib/ui/components/button";

const TasksContent = () => {
  const {
    load: { isLoading, error, data },
  } = useTasksContext();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-3 w-full">
            <div className="flex items-center justify-between mb-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-6 w-6" />
            </div>
            <Skeleton className="w-full h-32" />
            <Skeleton className="w-full h-32" />
            <Skeleton className="w-full h-32" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    const parsed = parseFocus4APIError("getTasks", error);
    const description =
      parsed.type === "validation_error" || parsed.type === "bad_request"
        ? parsed.meta.issues.map((issue) => issue.message).join(", ")
        : parsed.message;

    return (
      <ErrorScreen>
        <ErrorIcon variant="default" />
        <ErrorHeader title={parsed.type} />
        <ErrorDescription description={description} />
        <ErrorFooter>
          <Button
            variant="outline"
            onClick={() => {
              window.location.reload();
            }}
          >
            Retry
          </Button>
        </ErrorFooter>
      </ErrorScreen>
    );
  }

  if (!Array.isArray(data) || data.length === 0) {
    return <div className="typo-p">No tasks found</div>;
  }

  const urgentTasks = data.filter((task) => task.priority === "urgent");
  const highTasks = data.filter((task) => task.priority === "high");
  const normalTasks = data.filter((task) => task.priority === "normal");
  const lowTasks = data.filter((task) => task.priority === "low");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
      <TaskColumn title="Urgent" tasks={urgentTasks} priority="urgent" />
      <TaskColumn title="High" tasks={highTasks} priority="high" />
      <TaskColumn title="Normal" tasks={normalTasks} priority="normal" />
      <TaskColumn title="Low" tasks={lowTasks} priority="low" />
    </div>
  );
};

export { TasksContent };
