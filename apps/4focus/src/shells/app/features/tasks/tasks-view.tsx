import { Skeleton } from "@/lib/ui/components/skeleton";
import { useTasksQuery, type Task } from "./use-tasks-query";
import { Card, CardContent } from "@/lib/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/ui/components/avatar";
import { Button } from "@/lib/ui/components/button";
import { Plus } from "lucide-react";

const getTaskCardColor = (priority: Task["priority"]) => {
  switch (priority) {
    case "urgent":
      return "bg-[#eec5ef]";
    case "high":
      return "bg-[#edd803]";
    case "normal":
      return "bg-[#d8cfee]";
    case "low":
      return "bg-[#e7e8e2]";
    default:
      return "bg-gray-50";
  }
};

const getProgressBarColor = (priority: Task["priority"]) => {
  switch (priority) {
    case "urgent":
      return "bg-[#d4a5d6]";
    case "high":
      return "bg-[#c4b500]";
    case "normal":
      return "bg-[#b8a8d4]";
    case "low":
      return "bg-[#c5c6b8]";
    default:
      return "bg-gray-400";
  }
};

const getAssigneeInfo = (task: Task) => {
  // Mock assignee data - in real app this would come from the API
  const assignees = [
    { name: "Clair Burge", avatar: "CB", date: "12.11.23" },
    { name: "Christian Bass", avatar: "CB", date: "15.11.23" },
    { name: "Craig Curry", avatar: "CC", date: "20.11.23" },
    { name: "Brandon Crawford", avatar: "BC", date: "20.11.23" },
    { name: "Helna Julie", avatar: "HJ", date: "4.11.23" },
  ];

  const index = task.id % assignees.length;
  return assignees[index];
};

const TaskCard = ({ task }: { task: Task }) => {
  const assignee = getAssigneeInfo(task);
  const progress = Math.floor(Math.random() * 100); // Mock progress - in real app this would come from task data

  return (
    <Card
      className={`h-32 relative ${getTaskCardColor(task.priority)} border-0 shadow-none`}
    >
      <div className="absolute top-2 right-2">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <span className="typo-small">⋯</span>
        </Button>
      </div>

      <CardContent className="p-4 h-full flex flex-col">
        <div className="space-y-2 flex-1">
          <h3 className="typo-small pr-8">{task.title}</h3>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${getProgressBarColor(task.priority)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Assignee Info */}
        <div className="flex items-center gap-2 mt-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" />
            <AvatarFallback className="typo-small">
              {assignee.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="typo-small text-gray-700 truncate">{assignee.name}</p>
            <p className="typo-small text-gray-500">{assignee.date}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const TaskColumn = ({
  title,
  tasks,
  priority,
}: {
  title: string;
  tasks: Task[];
  priority: Task["priority"];
}) => {
  const getColumnHeaderColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return "bg-[#eec5ef]";
      case "high":
        return "bg-[#edd803]";
      case "normal":
        return "bg-[#d8cfee]";
      case "low":
        return "bg-[#e7e8e2]";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Category Header */}
      <div
        className={`px-3 py-1.5 rounded-md ${getColumnHeaderColor(priority)}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="typo-small">{title}</h3>
          <span className="bg-white shrink-0 rounded-full size-5.5 shadow-sm typo-small p-1 flex items-center justify-center">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && (
          <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
            <span className="typo-small text-gray-400">No tasks</span>
          </div>
        )}
      </div>
    </div>
  );
};

const Content = () => {
  const { data, isLoading, error } = useTasksQuery();

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
    return <div className="typo-p">Error loading tasks: {error.message}</div>;
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

const TasksView = () => {
  return (
    <div className="relative h-full flex flex-col">
      <header className="pb-6 padding-x padding-top">
        <span className="typo-muted capitalize">Manage your daily routine</span>
        <h1 className="typo-h3">Tasks</h1>
      </header>
      <div className="padding-x padding-bottom">
        <Content />
      </div>
      <footer className="sticky bottom-0 left-0 right-0 mt-auto bg-background py-4 padding-x">
        <div className="flex justify-end">
          <Button
            size="sm"
            className="rounded-full size-8"
            onClick={() => {
              console.log("Create new task");
            }}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </div>
      </footer>
    </div>
  );
};

export { TasksView };
