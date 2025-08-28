import z from "zod";

const taskId = z.number().int().positive().brand("taskId");
const userId = z.string().brand("userId");

const taskStatus = z.enum(["todo", "pending", "done"]);
const taskEstimatedDurationMinutes = z
  .number()
  .min(0)
  .brand("taskEstimatedDurationMinutes");
const taskPriority = z.enum(["urgent", "high", "normal", "low"]);
const date = z.iso.datetime().brand("date");

const error = z.union([
  z.object({
    type: z.literal("bad_request"),
    status: z.literal(400),
    message: z.string(),
    meta: z.object({
      issues: z.array(
        z.object({
          path: z.array(z.string()),
          message: z.string(),
        }),
      ),
    }),
  }),
  z.object({
    type: z.literal("unauthorized"),
    status: z.literal(401),
    message: z.string(),
  }),
  z.object({
    type: z.literal("internal_server_error"),
    status: z.literal(500),
    message: z.string(),
  }),
]);

export {
  taskId,
  userId,
  date,
  taskStatus,
  taskPriority,
  taskEstimatedDurationMinutes,
  error,
};
