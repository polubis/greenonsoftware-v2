import z from "zod";
import {
  date,
  error,
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

export { taskSchema, getTasksSchema };
