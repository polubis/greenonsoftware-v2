import {
  cleanAPIBrowser,
  cleanAPIServer,
  contract,
  type ErrorVariant,
} from "@/lib/clean-api";
import type { Database } from "../db/database.types";

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

const focus4Contract = contract<Focus4Contracts>()({
  getTasks: {
    method: "get",
    path: "/api/tasks",
  },
});

const focus4APIBrowser = cleanAPIBrowser<Focus4Contracts>()(focus4Contract);
const focus4APIServer = cleanAPIServer<Focus4Contracts>()(focus4Contract);

export type { Focus4Contracts };
export { focus4APIBrowser, focus4APIServer };
