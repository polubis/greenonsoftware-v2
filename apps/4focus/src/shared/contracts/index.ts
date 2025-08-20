import { cleanAPI, type ErrorVariant } from "@/lib/clean-api";
import type { Database } from "../db/database.types";
import { APIRouter } from "../routing/api-router";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type UnauthorizedError = ErrorVariant<"unauthorized", 401>;
type InternalServerError = ErrorVariant<"internal_server_error", 500>;

type Focus4Contracts = {
  getTasks: {
    dto: { tasks: TaskRow[] };
    error:
      | ErrorVariant<"bad_request", 400>
      | UnauthorizedError
      | InternalServerError;
  };
};

const focus4API = cleanAPI<Focus4Contracts>()({
  getTasks: {
    method: "get",
    path: APIRouter.getPath("tasks"),
  },
});

export type { Focus4Contracts };
export { focus4API };
