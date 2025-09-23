import z from "zod";
import {
  date,
  error,
  focusSessionId,
  taskDescription,
  duration,
  taskId,
  taskPriority,
  taskStatus,
  taskTitle,
  userId,
} from "./schemas-atoms";

const taskSchema = z.object({
  id: taskId,
  userId,
  title: taskTitle,
  description: taskDescription.nullable(),
  status: taskStatus,
  priority: taskPriority,
  creationDate: date,
  updateDate: date,
  estimatedDurationMinutes: duration,
});

const getTasksSchema = {
  dto: z.object({
    tasks: z.array(taskSchema),
  }),
  error,
};

const createTaskSchema = {
  dto: taskSchema,
  error,
  payload: z.object({
    title: taskSchema.shape.title,
    description: taskSchema.shape.description.nullable(),
    priority: taskSchema.shape.priority,
    status: taskSchema.shape.status,
    estimatedDurationMinutes: taskSchema.shape.estimatedDurationMinutes,
  }),
};

const focusSessionSchema = z.object({
  id: focusSessionId,
  taskId: taskId,
  startedAt: date,
  endedAt: date.nullable(),
  status: z.enum(["active", "completed", "abandoned"]),
  totalInterruptions: z.number().int().min(0),
  task: taskSchema.nullable(),
});

const getActiveFocusSessionSchema = {
  dto: z.object({
    hasActiveSession: z.boolean(),
    session: focusSessionSchema.nullable(),
  }),
  error,
};

const updateFocusSessionSchema = {
  dto: z.object({
    success: z.boolean(),
    session: focusSessionSchema,
  }),
  error,
};

const updateFocusSessionRequestSchema = z
  .object({
    status: z.enum(["completed", "abandoned"]).optional(),
    incrementInterruptions: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.status !== undefined || data.incrementInterruptions !== undefined,
    {
      message: "Either status or incrementInterruptions must be provided",
    },
  );

export {
  taskSchema,
  getTasksSchema,
  focusSessionSchema,
  getActiveFocusSessionSchema,
  updateFocusSessionSchema,
  updateFocusSessionRequestSchema,
  createTaskSchema,
};
