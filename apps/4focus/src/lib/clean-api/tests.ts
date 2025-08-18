import { cleanAPI, contract, type ErrorVariant } from ".";

type TaskRow = { id: number; name: string };

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
  // ##################################################################
  // # Without path parameters, but with path params must throw error
  // ##################################################################
  withoutPathParamsObjectButWithPathParams: {
    dto: { success: boolean };
    error: BadRequestError;
  };
};

const apiContract = contract<Focus4Contracts>()({
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
  // ##################################################################
  // # Without path parameters, but with path params must throw error
  // ##################################################################
  withoutPathParamsObjectButWithPathParams: {
    // @ts-expect-error - Dynamic path params are not allowed without a path params object.
    method: "get",
    // @ts-expect-error - Dynamic path params are not allowed without a path params object.
    path: "/api/test/:id",
  },
});

const api = cleanAPI<Focus4Contracts>()(apiContract);

api.call("getTasks").then((res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = res.tasks;
});
// @ts-expect-error - Unexpected arguments for getTasks which takes no arguments
api.call("getTasks", {}).then((res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = res.tasks;
});
api
  .call("getTask", { pathParams: { id: 1 }, searchParams: { limit: 10 } })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  })
  .catch((error) => {
    const r = api.parseError("getTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });
api
  // @ts-expect-error - Missing pathParams
  .call("getTask", { searchParams: { limit: 10 } })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });
api
  // @ts-expect-error - Missing searchParams
  .call("getTask", { pathParams: { id: 1 } })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });
api
  // @ts-expect-error - Missing pathParams and searchParams
  .call("getTask", {})
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });
api
  // @ts-expect-error - Missing all arguments
  .call("getTask")
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });
api
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
    const r = api.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

api
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
    const r = api.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

api
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
    const r = api.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

api
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
    const r = api.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

api
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
    const r = api.parseError("createTask", error);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = r?.type;
  });

api
  .call("putTask", {
    payload: { query: "test" },
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });

api
  // @ts-expect-error - Missing payload
  .call("putTask", {
    pathParams: { id: 1 },
    searchParams: { limit: 10 },
  })
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.task;
  });

api.call("deleteTask", { pathParams: { id: 1 } }).then((res) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = res.success;
});

api
  // @ts-expect-error - Missing pathParams
  .call("deleteTask", {})
  .then((res) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res.success;
  });

// ##################################################################
// # safeCall tests
// ##################################################################

api.safeCall("getTasks").then((res) => {
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
api.safeCall("getTasks", {}).then((res) => {
  if (res[0]) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = res[1].tasks;
  }
});

api
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

api
  // @ts-expect-error - Missing pathParams
  .safeCall("getTask", { searchParams: { limit: 10 } })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

api
  // @ts-expect-error - Missing searchParams
  .safeCall("getTask", { pathParams: { id: 1 } })
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

api
  // @ts-expect-error - Missing pathParams and searchParams
  .safeCall("getTask", {})
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

api
  // @ts-expect-error - Missing all arguments
  .safeCall("getTask")
  .then((res) => {
    if (res[0]) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = res[1].task;
    }
  });

api
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

api
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

api
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

api
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

api
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

api
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

api
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

api.safeCall("deleteTask", { pathParams: { id: 1 } }).then(([ok, data]) => {
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

api
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

api.safeCall("getErrorWithMeta").then(([ok, data]) => {
  if (!ok && data.type === "forbidden") {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const reason: string = data.meta.reason;
  }
});

api.safeCall("getErrorWithoutMeta").then(([ok, data]) => {
  if (!ok && data.type === "no_meta_error") {
    // @ts-expect-error Property 'meta' does not exist
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = data.meta;
  }
});

// ##################################################################
// # Contracts tests
// ##################################################################

// ##################################################################
// # Server-side Helper Tests
// ##################################################################

// Correct DTO usage
api.dto("getTasks", { tasks: [] as TaskRow[] });
api.dto("deleteTask", { success: true });

// @ts-expect-error - Incorrect DTO shape for `getTasks`
api.dto("getTasks", { success: true });

// Correct error usage
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const err1Getasks = api.error("getTask", {
  type: "bad_request",
  status: 400,
  message: "Invalid ID",
  meta: { id: 123 },
});

api.error("getTask", {
  // @ts-expect-error - 'forbidden' is not a valid error type for `getTask`
  type: "forbidden",
  // @ts-expect-error - 'forbidden' is not a valid error type for `getTask`
  status: 403,
  message: "Forbidden",
  // @ts-expect-error - 'forbidden' is not a valid error type for `getTask`
  meta: { reason: "test" },
});

// Correct error with required meta
api.error("getErrorWithMeta", {
  type: "forbidden",
  status: 403,
  message: "Forbidden",
  meta: { reason: "test" },
});

// @ts-expect-error - Missing `meta` property when it is required
api.error("getErrorWithMeta", {
  type: "forbidden",
  status: 403,
  message: "Forbidden",
});

api.error("getErrorWithMeta", {
  type: "forbidden",
  status: 403,
  message: "Forbidden",
  // @ts-expect-error - `meta` property has the wrong shape
  meta: { wrongKey: "test" },
});

// Correct error with no meta
api.error("getErrorWithoutMeta", {
  type: "no_meta_error",
  status: 501,
  message: "No meta here",
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const err501 = api.error("getErrorWithoutMeta", {
  type: "no_meta_error",
  status: 501,
  message: "No meta here",
  // Allows to pass additional properties if meta not defined
  meta: { test: "data" },
});

// ##################################################################
// # Client-side Helper Tests
// ##################################################################

// Correct usage
const pathParams = api.pathParams("getTask", { id: 1 });
const searchParams = api.searchParams("getTask", { limit: 10 });
const payload = api.payload("createTask", { query: "test" });

// Use the created parts in a call
api.call("getTask", {
  pathParams: pathParams,
  searchParams: searchParams,
});
api.call("createTask", {
  payload: payload,
  searchParams: { limit: 10 },
});

// Incorrect key validation
// @ts-expect-error - 'getTasks' does not have 'pathParams'.
api.pathParams("getTasks", { id: 1 });
// @ts-expect-error - 'deleteTask' does not have 'searchParams'.
api.searchParams("deleteTask", { q: "test" });
// @ts-expect-error - 'getTask' does not have 'payload'.
api.payload("getTask", { data: "test" });

// Incorrect shape validation
// @ts-expect-error - 'pathParams' for 'getTask' has the wrong shape.
api.pathParams("getTask", { id: "not-a-number" });
// @ts-expect-error - 'searchParams' for 'createTask' has the wrong shape.
api.searchParams("createTask", { limit: "not-a-number" });
// @ts-expect-error - 'payload' for 'createTask' has the wrong shape.
api.payload("createTask", { wrongKey: "test" });

// ##################################################################
// # Axios Configuration Tests
// ##################################################################

// --- Factory Creation Tests ---

// This demonstrates creating a client with a valid base config
cleanAPI<Focus4Contracts>()(apiContract, {
  headers: { "X-Base-Header": "base" },
});

cleanAPI<Focus4Contracts>()(apiContract, {
  // @ts-expect-error - `params` is a forbidden property in the base config
  params: { q: "test" },
});

cleanAPI<Focus4Contracts>()(apiContract, {
  // @ts-expect-error - `data` is a forbidden property in the base config
  data: { forbidden: true },
});
