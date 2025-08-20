import { cleanAPI, type ErrorVariant } from "@/lib/clean-api";
import type { Database } from "../db/database.types";
import { APIRouter } from "../routing/api-router";
import { init } from "@/lib/clean-api-v2/core";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type BadRequest = ErrorVariant<"bad_request", 400>
type UnauthorizedError = ErrorVariant<"unauthorized", 401>;
type InternalServerError = ErrorVariant<"internal_server_error", 500>;

type Focus4Contracts = {
  getTasks: {
    extra: {
      signal: AbortSignal;
    }
    dto: { tasks: TaskRow[]; };
    error:
      | BadRequest
      | UnauthorizedError
      | InternalServerError;
  };
};

const contract = init()
const create = contract<Focus4Contracts>()
const focus4API = create({
  getTasks: {
    resolver: async ({ extra: { signal }}) => {
      return fetch(APIRouter.getPath("tasks"), {
        signal,
      }).then(res => res.json())
    }
  },
});

export type { Focus4Contracts };
export { focus4API };
