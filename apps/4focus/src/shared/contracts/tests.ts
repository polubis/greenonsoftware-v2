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
type UnauthorizedError = ErrorVariant<"unauthorized", 401, string>;
type InternalServerError = ErrorVariant<"internal_server_error", 500, string>;
type ForbiddenError = ErrorVariant<"forbidden", 403, { reason: string }>;
type NoMetaError = ErrorVariant<"no_meta_error", 501>;

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
  // ##################################################################
  // # Path validation tests
  // ##################################################################
  pathMissingParam: {
    dto: { success: boolean };
    error: BadRequestError;
    pathParams: { id: number };
  };
  pathExtraParam: {
    dto: { success: boolean };
    error: BadRequestError;
    pathParams: { id: number };
  };
  pathTwoParams: {
    dto: { success: boolean };
    error: BadRequestError;
    pathParams: { id: number; second: string };
  };
  pathMismatchParam: {
    dto: { success: boolean };
    error: BadRequestError;
    pathParams: { id: number };
  };
  pathNoSlash: {
    dto: { success: boolean };
    error: BadRequestError;
  };
  // ##################################################################
  // # Meta validation tests
  // ##################################################################
  getErrorWithMeta: {
    dto: { success: boolean };
    error: ForbiddenError;
  };
  getErrorWithoutMeta: {
    dto: { success: boolean };
    error: NoMetaError;
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
  // ##################################################################
  // # Path validation tests
  // ##################################################################
  pathMissingParam: {
    // @ts-expect-error - Path "/api/test" is missing parameters from contract.
    method: "get",
    // @ts-expect-error - Path "/api/test" is missing parameters from contract.
    path: "/api/test",
  },
  pathExtraParam: {
    // @ts-expect-error - Path "/api/test/:id/:extra" has parameters not defined in contract.
    method: "get",
    // @ts-expect-error - Path "/api/test/:id/:extra" has parameters not defined in contract.
    path: "/api/test/:id/:extra",
  },
  pathTwoParams: {
    method: "get",
    path: "/api/test/:id/:second",
  },
  pathMismatchParam: {
    // @ts-expect-error - Path "/api/test/:wrong_id" is missing parameters from contract.
    method: "get",
    // @ts-expect-error - Path "/api/test/:wrong_id" is missing parameters from contract.
    path: "/api/test/:wrong_id",
  },
  pathNoSlash: {
    // @ts-expect-error - Path "api/test" must start with a '/'.
    method: "get",
    // @ts-expect-error - Path "api/test" must start with a '/'.
    path: "api/test",
  },
  // ##################################################################
  // # Meta validation tests
  // ##################################################################
  getErrorWithMeta: {
    method: "get",
    path: "/api/error-with-meta",
  },
  getErrorWithoutMeta: {
    method: "get",
    path: "/api/error-without-meta",
  },
});

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
  })
  .catch((error) => {
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

// ##################################################################
// # safeCall tests
// ##################################################################

focus4APIBrowser.safeCall("getTasks").then((res) => {
  if (res[0]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res[1].tasks;
  } else {
    const error = res[1];
    if (error) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = error.type;
    }
  }
});

// @ts-expect-error - Unexpected arguments for getTasks which takes no arguments
focus4APIBrowser.safeCall("getTasks", {}).then((res) => {
  if (res[0]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res[1].tasks;
  }
});

focus4APIBrowser
  .safeCall("getTask", { pathParams: { id: 1 }, searchParams: { limit: 10 } })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    } else {
      const error = res[1];
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = error.type;
      }
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing pathParams
  .safeCall("getTask", { searchParams: { limit: 10 } })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing searchParams
  .safeCall("getTask", { pathParams: { id: 1 } })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing pathParams and searchParams
  .safeCall("getTask", {})
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing all arguments
  .safeCall("getTask")
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  .safeCall("createTask", {
    payload: {
      query: "test",
    },
    searchParams: {
      limit: 10,
    },
  })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    } else {
      const error = res[1];
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = error.type;
      }
    }
  });

focus4APIBrowser
  .safeCall("updateTask", {
    payload: { query: "test" },
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    } else {
      const error = res[1];
      if (error) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = error.type;
      }
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing searchParams
  .safeCall("updateTask", {
    payload: { query: "test" },
    pathParams: { id: 1 },
  })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing pathParams
  .safeCall("updateTask", {
    payload: { query: "test" },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing payload
  .safeCall("updateTask", {
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  .safeCall("putTask", {
    payload: { query: "test" },
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing payload
  .safeCall("putTask", {
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

focus4APIBrowser
  .safeCall("deleteTask", { pathParams: { id: 1 } })
  .then(([ok, data]) => {
    if (ok) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = data.success;
    } else {
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = data.type;
      }
    }
  });

focus4APIBrowser
  // @ts-expect-error - Missing pathParams
  .safeCall("deleteTask", {})
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].success;
    }
  });

// ##################################################################
// # Meta validation tests
// ##################################################################

focus4APIBrowser.safeCall("getErrorWithMeta").then(([ok, data]) => {
  if (!ok && data.type === "forbidden") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const reason: string = data.meta.reason;
  }
});

focus4APIBrowser.safeCall("getErrorWithoutMeta").then(([ok, data]) => {
  if (!ok && data.type === "no_meta_error") {
    // @ts-expect-error Property 'meta' does not exist
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = data.meta;
  }
});

export type { Focus4Contracts };
export { focus4APIBrowser };
