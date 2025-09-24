import z from "zod";

const taskId = z.number().int().positive().brand("taskId");
const focusSessionId = z.number().int().positive().brand("focusSessionId");
const userId = z.string().brand("userId");
const taskTitle = z
  .string()
  .trim()
  .min(3, { message: "Title must be 3-280 characters" })
  .max(280, { message: "Title must be 3-280 characters" });
const taskDescription = z
  .string()
  .trim()
  .refine((val) => val === "" || (val.length >= 10 && val.length <= 500), {
    message: "Description must be empty or 10-500 characters",
  });

const taskStatus = z.enum(["todo", "pending", "done"]);
const duration = z
  .int()
  .positive()
  .max(60 * 24, { message: "Duration must be less than 24 hours" });
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
  focusSessionId,
  taskStatus,
  taskPriority,
  duration,
  error,
  taskDescription,
  taskTitle,
};
