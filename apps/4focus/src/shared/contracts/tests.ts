import { cleanAPIBrowser } from "@/lib/clean-api/browser";
import type { Database } from "../db/database.types";
import type { ErrorVariant } from "@/lib/clean-api/models";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type BadRequestError = ErrorVariant<
  "bad_request",
  400,
  string,
  {
    id: number;
  }
>;
type UnauthorizedError = ErrorVariant<"unauthorized", 401, string>;
type InternalServerError = ErrorVariant<"internal_server_error", 500, string>;

type Focus4Contracts = {
  getTasks: {
    dto: { tasks: TaskRow[] };
    error:
      | BadRequestError
      | UnauthorizedError
      | InternalServerError
  };
  getTask: {
    dto: { task: TaskRow };
    error:  BadRequestError | UnauthorizedError | InternalServerError;
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

const focus4APIConfig = {
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
} as const;

const focus4APIBrowser = cleanAPIBrowser<Focus4Contracts>()(focus4APIConfig);

focus4APIBrowser.call("getTasks").then((res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = res.tasks;
});
// @ts-expect-error - Unexpected arguments for getTasks which takes no arguments
focus4APIBrowser.call("getTasks", {}).then((res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = res.tasks;
});
focus4APIBrowser
  .call("getTask", { pathParams: { id: 1 }, searchParams: { limit: 10 } })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  }).catch(error => {
    const r = focus4APIBrowser.parseError("getTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });
focus4APIBrowser
  // @ts-expect-error - Missing pathParams
  .call("getTask", { searchParams: { limit: 10 } })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });
focus4APIBrowser
  // @ts-expect-error - Missing searchParams
  .call("getTask", { pathParams: { id: 1 } })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });
focus4APIBrowser
  // @ts-expect-error - Missing pathParams and searchParams
  .call("getTask", {})
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });
focus4APIBrowser
  // @ts-expect-error - Missing all arguments
  .call("getTask")
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });
focus4APIBrowser
  .call("createTask", {
    payload: {
      query: "test",
    },
    searchParams: {
      limit: 10,
    },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  })
  .catch((error) => {
    const r = focus4APIBrowser.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

focus4APIBrowser
  .call("updateTask", {
    payload: { query: "test" },
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  })
  .catch((error) => {
    const r = focus4APIBrowser.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

focus4APIBrowser
  // @ts-expect-error - Missing searchParams
  .call("updateTask", {
    payload: { query: "test" },
    pathParams: { id: 1 },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  })
  .catch((error) => {
    const r = focus4APIBrowser.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

focus4APIBrowser
  // @ts-expect-error - Missing pathParams
  .call("updateTask", {
    payload: { query: "test" },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  })
  .catch((error) => {
    const r = focus4APIBrowser.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

focus4APIBrowser
  // @ts-expect-error - Missing payload
  .call("updateTask", {
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  })
  .catch((error) => {
    const r = focus4APIBrowser.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

focus4APIBrowser
  .call("putTask", {
    payload: { query: "test" },
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });

focus4APIBrowser
  // @ts-expect-error - Missing payload
  .call("putTask", {
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });

focus4APIBrowser.call("deleteTask", { pathParams: { id: 1 } }).then((res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = res.success;
});

focus4APIBrowser
  // @ts-expect-error - Missing pathParams
  .call("deleteTask", {})
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.success;
  });

export type { Focus4Contracts };
export { focus4APIBrowser };
