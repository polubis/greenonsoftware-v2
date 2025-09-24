import { type Task } from "./tasks-management";
import { Button } from "@/lib/ui/components/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/ui/utils/cn";
import { useSimpleFeature } from "@/lib/react-kit/use-simple-feature";
import { TaskForm } from "./task-form";
import { TaskCard } from "./task-card";

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

export { TaskColumn };
