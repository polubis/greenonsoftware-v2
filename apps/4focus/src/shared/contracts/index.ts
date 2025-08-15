import {
  cleanAPIBrowser,
  contract,
  type ErrorVariant,
} from "@/lib/clean-api/browser";
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

const createFocus4Contract = contract<Focus4Contracts>();
const createFocus4API = cleanAPIBrowser<Focus4Contracts>();

const focus4Contract = createFocus4Contract({
  getTasks: {
    method: "get",
    path: "/api/tasks",
  },
});

const focus4APIBrowser = createFocus4API(focus4Contract);

export type { Focus4Contracts };
export { focus4APIBrowser };
