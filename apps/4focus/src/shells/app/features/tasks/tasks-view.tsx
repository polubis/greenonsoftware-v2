import { Skeleton } from "@/lib/ui/components/skeleton";
import { useTasksLoad, type Task } from "./tasks-management";
import { Card, CardContent } from "@/lib/ui/components/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/lib/ui/components/avatar";
import { Button } from "@/lib/ui/components/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/ui/utils/cn";
import { useSimpleFeature } from "@/lib/react-kit/use-simple-feature";
import { TaskForm } from "./task-form";

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
  const progress = Math.floor(Math.random() * 100);

  return (
    <Card
      className={cn(`h-32 relative border-0 shadow-none`, {
        "bg-[#eec5ef]": task.priority === "urgent",
        "bg-[#edd803]": task.priority === "high",
        "bg-[#d8cfee]": task.priority === "normal",
        "bg-[#e7e8e2]": task.priority === "low",
      })}
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
              className={cn(`h-1.5 rounded-full`, {
                "bg-[#d4a5d6]": task.priority === "urgent",
                "bg-[#c4b500]": task.priority === "high",
                "bg-[#b8a8d4]": task.priority === "normal",
                "bg-[#c5c6b8]": task.priority === "low",
              })}
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
  const form = useSimpleFeature();

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Category Header */}
      <div
        className={cn("px-3 py-1.5 rounded-md", {
          "bg-[#eec5ef]": priority === "urgent",
          "bg-[#edd803]": priority === "high",
          "bg-[#d8cfee]": priority === "normal",
          "bg-[#e7e8e2]": priority === "low",
        })}
      >
        <div className="flex items-center justify-between">
          <h3 className="typo-small flex items-center gap-3">
            {title}
            <span className="bg-white shrink-0 rounded-full size-5.5 shadow-sm typo-small p-1 flex items-center justify-center">
              {tasks.length}
            </span>
          </h3>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={form.toggle}
            >
              <Plus className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tasks Container */}
      <div className="space-y-3">
        {form.isOn && (
          <TaskForm
            priority={priority}
            onClose={form.toggle}
            onSubmit={form.off}
          />
        )}
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
        {tasks.length === 0 && !form.isOn && (
          <div className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={form.toggle}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Create your first task
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const Content = () => {
  const { data, isLoading, error } = useTasksLoad();

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
      <footer className="sticky bottom-0 left-0 right-0 mt-auto bg-background py-4 padding-x border-t border-border">
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
