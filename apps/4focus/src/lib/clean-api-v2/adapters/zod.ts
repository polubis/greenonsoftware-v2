import type z from "zod";
import { ValidationException } from "../models";

const check =
  <T extends z.ZodTypeAny>(schema: T) =>
  (data: unknown): z.infer<T> => {
    const parsed = schema.safeParse(data);

    if (!parsed.success) {
      throw new ValidationException(
        parsed.error.issues.map((issue) => ({
          path: issue.path.map((p) => String(p)),
          message: issue.message,
        })),
      );
    }

    return parsed.data;
  };

export { check };
