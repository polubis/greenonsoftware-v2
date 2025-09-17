import z from "zod";
import {
  date,
  error,
  focusSessionId,
  taskEstimatedDurationMinutes,
  taskId,
  taskPriority,
  taskStatus,
  userId,
} from "./schemas-atoms";

const taskSchema = z.object({
  id: taskId,
  userId,
  title: z.string().trim().min(3).max(280),
  description: z.string().trim().min(10).max(500).nullable(),
  status: taskStatus,
  priority: taskPriority,
  creationDate: date,
  updateDate: date,
  estimatedDurationMinutes: taskEstimatedDurationMinutes,
});

const getTasksSchema = {
  dto: z.object({
    tasks: z.array(taskSchema),
  }),
  error,
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
};
