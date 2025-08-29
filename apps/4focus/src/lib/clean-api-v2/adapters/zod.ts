import type z from "zod";
import { ValidationException } from "../models";
import { check, checkAsync } from "../core";

/**
 * Creates a synchronous Zod validator using the check function factory
 */
const zodCheck = <T extends z.ZodTypeAny>(schema: T) => {
  return check((data: unknown): z.infer<T> => {
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
  });
};

/**
 * Creates an asynchronous Zod validator using the checkAsync function factory
 */
const zodCheckAsync = <T extends z.ZodTypeAny>(schema: T) => {
  return checkAsync(async (data: unknown): Promise<z.infer<T>> => {
    const parsed = await schema.safeParseAsync(data);

    if (!parsed.success) {
      throw new ValidationException(
        parsed.error.issues.map((issue) => ({
          path: issue.path.map((p) => String(p)),
          message: issue.message,
        })),
      );
    }

    return parsed.data;
  });
};

export { zodCheck, zodCheckAsync };
