import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { focus4API, parseFocus4APIError } from "@/ipc/contracts";
import {
  useTaskCreation,
  type Task,
  type TaskCreationPayload,
} from "./tasks-management";
import { Card } from "@/lib/ui/components/card";
import { Button } from "@/lib/ui/components/button";
import { Input } from "@/lib/ui/components/input";
import { Textarea } from "@/lib/ui/components/textarea";
import { Label } from "@/lib/ui/components/label";
import { X } from "lucide-react";
import z from "zod";
import { taskDescription } from "@/ipc/contracts/schemas-atoms";

type FormData = {
  title: TaskCreationPayload["title"];
  description: NonNullable<TaskCreationPayload["description"]>;
  estimatedDurationMinutes: TaskCreationPayload["estimatedDurationMinutes"];
};

const schema = (() => {
  const shape = focus4API.getRawSchema("createTask").payload.shape;

  return z.object({
    title: shape.title,
    description: taskDescription,
    estimatedDurationMinutes: shape.estimatedDurationMinutes,
  });
})();

interface TaskFormProps {
  priority: Task["priority"];
  onClose: () => void;
  onSubmit: () => void;
}

const TaskForm = ({ priority, onClose, onSubmit }: TaskFormProps) => {
  const createTaskMutation = useTaskCreation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      estimatedDurationMinutes: 30,
    },
  });

  const submit = (payload: FormData) => {
    createTaskMutation.mutate(
      {
        ...payload,
        description:
          payload.description?.trim().length === 0 ? null : payload.description,
        priority,
        status: "todo",
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
        onError: (error) => {
          console.error("Failed to create task:", error);
        },
      },
    );
    onSubmit();
  };

  if (createTaskMutation.error) {
    const parsed = parseFocus4APIError("createTask", createTaskMutation.error);
    console.log(parsed);
  }

  return (
    <Card className="p-4 mb-3 border-2 border-dashed border-gray-300">
      <form onSubmit={handleSubmit(submit)} className="space-y-4" noValidate>
        <header className="flex items-center justify-between">
          <h2 className="typo-small font-medium">Add New Task</h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
            aria-label="Close form"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <fieldset className="space-y-3">
          <legend className="sr-only">Task Details</legend>

          {/* Title */}
          <div>
            <Label htmlFor="title" className="typo-small">
              Title<span aria-label="required">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter task title..."
              className="mt-1"
              aria-describedby={errors.title ? "title-error" : undefined}
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <p
                id="title-error"
                className="text-red-600 typo-small mt-1"
                role="alert"
              >
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="typo-small">
              Description
            </Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Enter task description..."
              className="mt-1"
              rows={2}
              aria-describedby={
                errors.description ? "description-error" : undefined
              }
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <p
                id="description-error"
                className="text-red-600 typo-small mt-1"
                role="alert"
              >
                {errors.description.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="duration" className="typo-small">
              Duration (minutes)
            </Label>
            <Input
              id="duration"
              type="number"
              {...register("estimatedDurationMinutes", {
                valueAsNumber: true,
              })}
              placeholder="30"
              className="mt-1"
              min="1"
              aria-describedby={
                errors.estimatedDurationMinutes ? "duration-error" : undefined
              }
              aria-invalid={!!errors.estimatedDurationMinutes}
            />
            {errors.estimatedDurationMinutes && (
              <p
                id="duration-error"
                className="text-red-600 typo-small mt-1"
                role="alert"
              >
                {errors.estimatedDurationMinutes.message}
              </p>
            )}
          </div>
        </fieldset>

        {/* Error Display */}
        {createTaskMutation.error && (
          <div className="text-red-600 typo-small" role="alert">
            {"type" in createTaskMutation.error &&
            createTaskMutation.error.type === "bad_request"
              ? "Please check your input and try again."
              : "Failed to create task. Please try again."}
          </div>
        )}

        {/* Actions */}
        <footer className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSubmitting || createTaskMutation.isPending}
            className="flex-1"
          >
            {isSubmitting || createTaskMutation.isPending
              ? "Creating..."
              : "Create Task"}
          </Button>
        </footer>
      </form>
    </Card>
  );
};

export { TaskForm };
