import { ValidationException, type ErrorVariant } from "@/lib/clean-api-v2";
import type { Database } from "../db/database.types";
import { APIRouter } from "../routing/api-router";
import { init } from "@/lib/clean-api-v2";
import { errorParser } from "@/lib/clean-api-v2/adapters/axios";
import z from "zod";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type BadRequest = ErrorVariant<
  "bad_request",
  400,
  { issues: { path: (string | number)[]; message: string }[] }
>;
type UnauthorizedError = ErrorVariant<"unauthorized", 401>;
type InternalServerError = ErrorVariant<"internal_server_error", 500>;

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

type Focus4Contracts = {
  getTasks: {
    extra: {
      signal: AbortSignal;
    };
    dto: { tasks: TaskRow[] };
    error: BadRequest | UnauthorizedError | InternalServerError;
  };
};

const contract = init();
const create = contract<Focus4Contracts>();

const focus4API = create({
  getTasks: {
    schemas: {
      dto: check(
        z.object({
          tasks: z.array(
            z.object({
              id: z.number().int().positive(),
              title: z.string().min(1).max(255),
              description: z.string().min(1).max(255),
              created_at: z.string().datetime(),
              updated_at: z.string().datetime(),
            }),
          ),
        }),
      ),
    },
    resolver: async ({ extra: { signal } }) => {
      return fetch(APIRouter.getPath("tasks"), {
        signal,
      }).then((res) => res.json());
    },
  },
});

const parseFocus4APIError = errorParser(focus4API);

export type { Focus4Contracts };
export { focus4API, parseFocus4APIError };
