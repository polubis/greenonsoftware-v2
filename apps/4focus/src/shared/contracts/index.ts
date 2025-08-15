import { cleanAPIBrowser, type ErrorVariant } from "@/lib/clean-api/browser";
import type { Database } from "../db/database.types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type BadRequestError = ErrorVariant<
  "bad_request",
  400,
  {
    id: number;
  }
>;
type UnauthorizedError = ErrorVariant<"unauthorized", 401>;
type InternalServerError = ErrorVariant<"internal_server_error", 500>;

type Focus4Contracts = {
  getTasks: {
    dto: { tasks: TaskRow[] };
    error: BadRequestError | UnauthorizedError | InternalServerError;
  };
  getTask: {
    dto: { task: TaskRow };
    error: BadRequestError | UnauthorizedError | InternalServerError;
    pathParams: {
      id: number;
    };
    searchParams: {
      limit: number;
    };
  };
  createTask: {
    dto: { task: TaskRow };
    error: BadRequestError | UnauthorizedError;
    payload: {
      query: string;
    };
    searchParams: {
      limit: number;
    };
  };
  updateTask: {
    dto: { task: TaskRow };
    error: BadRequestError | UnauthorizedError;
    payload: {
      query: string;
    };
    searchParams: {
      limit: number;
    };
    pathParams: {
      id: number;
    };
  };
  putTask: {
    dto: { task: TaskRow };
    error: BadRequestError | UnauthorizedError;
    payload: {
      query: string;
    };
    pathParams: {
      id: number;
    };
    searchParams: {
      limit: number;
    };
  };
  deleteTask: {
    dto: { success: boolean };
    error: BadRequestError | UnauthorizedError;
    pathParams: {
      id: number;
    };
  };
};

const focus4APIBrowser = cleanAPIBrowser<Focus4Contracts>()({
  getTasks: {
    method: "get",
    path: "/api/tasks",
  },
  getTask: {
    method: "get",
    path: "/api/tasks/:id",
  },
  createTask: {
    method: "post",
    path: "/api/tasks",
  },
  updateTask: {
    method: "patch",
    path: "/api/tasks/:id",
  },
  putTask: {
    method: "put",
    path: "/api/tasks/:id",
  },
  deleteTask: {
    method: "delete",
    path: "/api/tasks/:id",
  },
});

export type { Focus4Contracts };
export { focus4APIBrowser };
