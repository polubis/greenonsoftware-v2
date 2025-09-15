import { useClientAuth } from "@/shared/client-auth/use-client-auth";
import { NavBar } from "@/shared/components/nav-bar";
import { QueryProvider } from "@/shared/query-client/query-provider";
import { AppRouter } from "@/shared/routing/app-router";
import { useTasksQuery } from "@/shared/tasks/use-tasks-query";

const TasksViewContent = () => {
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

  return <div>{data.length} tasks found</div>;
};

const TasksView = ({ activePathname }: { activePathname: string }) => {
  const auth = useClientAuth();

  if (auth.status === "idle") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="w-full max-w-md text-center">
          <p className="text-foreground">Verifying session...</p>
        </div>
      </div>
    );
  }

  if (auth.status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
        <div className="w-full max-w-md text-center">
          <p className="text-foreground">
            Session lost{" "}
            <a
              href={AppRouter.getPath("login")}
              className="text-primary hover:text-primary/80"
            >
              Login
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <NavBar activePathname={activePathname}>
      <TasksViewContent />
    </NavBar>
  );
};

const ConnectedTasksView = ({ activePathname }: { activePathname: string }) => {
  return (
    <QueryProvider>
      <TasksView activePathname={activePathname} />
    </QueryProvider>
  );
};

export { ConnectedTasksView as TasksView };
