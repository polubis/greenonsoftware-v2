import { Button } from "@/lib/ui/components/button";
import { Plus } from "lucide-react";
import { TasksProvider } from "./tasks-provider";
import { TasksContent } from "./tasks-content";

const TasksView = () => {
  return (
    <div className="relative h-full flex flex-col">
      <header className="pb-6 padding-x padding-top">
        <span className="typo-muted capitalize">Manage your daily routine</span>
        <h1 className="typo-h3">Tasks</h1>
      </header>
      <div className="padding-x padding-bottom">
        <TasksContent />
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

const ConnectedTasksView = () => (
  <TasksProvider>
    <TasksView />
  </TasksProvider>
);

export { ConnectedTasksView as TasksView };
