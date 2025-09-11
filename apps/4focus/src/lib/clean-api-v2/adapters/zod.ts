import type z from "zod";
import { ValidationException } from "../models";
import { check, checkAsync } from "../core";

/**
 * Creates a synchronous Zod validator using the check function factory
 * The raw Zod schema is attached and can be extracted using getRawSchema()
 */
const zodCheck = <TSchema extends z.ZodTypeAny>(schema: TSchema) => {
  return check((data: unknown): z.infer<TSchema> => {
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
  }, schema); // Pass the raw Zod schema as second parameter
};

/**
 * Creates an asynchronous Zod validator using the checkAsync function factory
 * The raw Zod schema is attached and can be extracted using getRawSchema()
 */
const zodCheckAsync = <TSchema extends z.ZodTypeAny>(schema: TSchema) => {
  return checkAsync(async (data: unknown): Promise<z.infer<TSchema>> => {
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
  }, schema); // Pass the raw Zod schema as second parameter
};

export { zodCheck, zodCheckAsync };
