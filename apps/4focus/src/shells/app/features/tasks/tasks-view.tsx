import { useTasksQuery } from "./use-tasks-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/lib/ui/components/card";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronUp,
  Circle,
  CircleCheck,
  CircleEllipsis,
  Plus,
  type LucideIcon,
} from "lucide-react";
import type { Task } from "./use-tasks-query";
import { cn } from "@/lib/ui/utils/cn";
import React from "react";
import { Button } from "@/lib/ui/components/button";

const priorityConfig: Record<
  Task["priority"],
  { name: string; icon: LucideIcon; colorClassName: string }
> = {
  urgent: {
    name: "Urgent",
    icon: AlertTriangle,
    colorClassName: "bg-red-500",
  },
  high: {
    name: "High",
    icon: ChevronUp,
    colorClassName: "bg-orange-500",
  },
  normal: {
    name: "Normal",
    icon: ArrowUp,
    colorClassName: "bg-blue-500",
  },
  low: {
    name: "Low",
    icon: ArrowDown,
    colorClassName: "bg-gray-400",
  },
};

const statusConfig: Record<Task["status"], { name: string; icon: LucideIcon }> =
  {
    todo: { name: "To Do", icon: Circle },
    pending: { name: "In Progress", icon: CircleEllipsis },
    done: { name: "Done", icon: CircleCheck },
  };

const priorityOrder: Record<Task["priority"], number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
};

const TasksView = () => {
  const { data, isLoading, error } = useTasksQuery();

  const sortedData = React.useMemo(() => {
    if (!data) return [];
    return [...data].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
    );
  }, [data]);

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
    <div className="p-4 md:p-6 relative min-h-[calc(100vh-theme-header-height)]">
      <h1 className="text-3xl font-bold tracking-tight mb-4">Tasks</h1>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-6">
        <div className="flex items-center gap-x-4">
          <span className="text-sm font-medium text-muted-foreground">
            Priority:
          </span>
          {Object.values(priorityConfig).map((p) => (
            <div key={p.name} className="flex items-center gap-2">
              <div className={cn("h-3 w-3 rounded-full", p.colorClassName)} />
              <span className="text-sm text-muted-foreground">{p.name}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-x-4">
          <span className="text-sm font-medium text-muted-foreground">
            Status:
          </span>
          {Object.values(statusConfig).map((s) => (
            <div key={s.name} className="flex items-center gap-1.5">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{s.name}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        <Card className="flex items-center justify-center border-2 border-dashed bg-muted/50 hover:border-primary/50 hover:bg-muted/70 transition-colors duration-200">
          <button className="flex flex-col items-center justify-center w-full h-full text-center p-4">
            <Plus className="h-10 w-10 text-muted-foreground mb-2" />
            <span className="text-sm font-medium text-muted-foreground">
              Add New Task
            </span>
          </button>
        </Card>
        {sortedData.map((task) => {
          const priorityConf = priorityConfig[task.priority];
          const statusConf = statusConfig[task.status];
          return (
            <Card
              key={task.id}
              className="py-4 relative overflow-hidden group gap-1"
            >
              <div
                className={cn(
                  "absolute top-0 left-0 h-1.5 w-full",
                  priorityConf.colorClassName,
                )}
              />
              <CardHeader className="px-4">
                <CardTitle className="flex items-start gap-2">
                  <statusConf.icon
                    className={cn("h-5 w-5 flex-shrink-0 mt-px", {
                      "text-red-500": task.priority === "urgent",
                      "text-orange-500": task.priority === "high",
                      "text-blue-500": task.priority === "normal",
                      "text-gray-500": task.priority === "low",
                    })}
                  />
                  <span className="text-base font-semibold leading-tight">
                    {task.title}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pr-4 py-0 pl-11">
                {task.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {task.description}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      <Button
        size="icon"
        className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg"
      >
        <Plus className="h-7 w-7" />
      </Button>
    </div>
  );
};

export { TasksView };
