import { type ErrorVariant } from "@/lib/clean-api-v2";
import type { Database } from "../db/database.types";
import { APIRouter } from "../routing/api-router";
import { init } from "@/lib/clean-api-v2";
import { errorParser } from "@/lib/clean-api-v2/adapters/axios";
import z from "zod";
import { check } from "@/lib/clean-api-v2/adapters/zod";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type BadRequest = ErrorVariant<
  "bad_request",
  400,
  { issues: { path: (string | number)[]; message: string }[] }
>;
type UnauthorizedError = ErrorVariant<"unauthorized", 401>;
type InternalServerError = ErrorVariant<"internal_server_error", 500>;

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
              id: z.number(),
              user_id: z.string(),
              title: z.string(),
              description: z.string().nullable(),
              status: z.string(),
              priority: z.string(),
              creation_date: z.string(),
              update_date: z.string(),
              estimated_duration_minutes: z.number(),
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
