import { cleanAPIBrowser } from "@/lib/clean-api/browser";
import type { Database } from "../db/database.types";

type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];

type OmitUndefined<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K];
};

type ErrorVariant<
  T extends string,
  TStatus extends number,
  TMessage extends string,
  TMeta = undefined,
> = TMeta extends undefined
  ? {
    type: T;
    status: TStatus;
    message: TMessage;
  }
  : {
    type: T;
    status: TStatus;
    message: TMessage;
    meta: TMeta;
  };

type BadRequestError = ErrorVariant<"bad_request", 400, string>;
type UnauthorizedError = ErrorVariant<"unauthorized", 401, string>;
type InternalServerError = ErrorVariant<"internal_server_error", 500, string>;

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
    }
  };
  createTask: {
    dto: { task: TaskRow };
    error: BadRequestError | UnauthorizedError;
    payload: {
      query: string
    }
    searchParams: {
      limit: number;
    }
  }
  updateTask: {
    dto: { task: TaskRow };
    error: BadRequestError | UnauthorizedError;
    payload: {
      query: string
    }
    searchParams: {
      limit: number;
    }
    pathParams: {
      id: number;
    }
  }
};

const focus4APIBrowser = cleanAPIBrowser<Focus4Contracts>({
  getTasks: {
    method: "get",
    path: "/api/tasks",
  },
  getTask: {
    method: "get",
    path: "/api/tasks",
  },
  createTask: {
    method: "post",
    path: "/api/tasks",
  },
  updateTask: {
    method: "patch",
    path: "/api/tasks",
  },
});

focus4APIBrowser.get("getTasks").then((res) => { });
focus4APIBrowser
  .get("getTask", { pathParams: { id: 1 }, searchParams: { limit: 10 } })
  .then((res) => { });
focus4APIBrowser.get("getTasks").then((res) => { });

focus4APIBrowser.post("createTask", {
  payload: {
    query: "test",
  },
  searchParams: {
    limit: 10,
  },
}).then((res) => { }).catch(error => {
  const r = focus4APIBrowser.parseError('createTask', error);
  r?.type
});

focus4APIBrowser.patch("updateTask", {
  payload: {
    query: "test",
  },
  searchParams: {
    limit: 10,
  },
  pathParams: {
    id: 1
  }
}).then((res) => { }).catch(error => {
  const r = focus4APIBrowser.parseError('createTask', error);
  r?.type
});

focus4APIBrowser.call("getTasks").then((res) => { });
focus4APIBrowser
  .call("getTask", { pathParams: { id: 1 }, searchParams: { limit: 10 } })
  .then((res) => { });
focus4APIBrowser.call("getTasks").then((res) => { });

focus4APIBrowser.call("createTask", {
  payload: {
    query: "test",
  },
  searchParams: {
    limit: 10,
  },
}).then((res) => { }).catch(error => {
  const r = focus4APIBrowser.parseError('createTask', error);
  r?.type
});

focus4APIBrowser.call("updateTask", {
  payload: {
    query: "test",
  },
  searchParams: {
    limit: 10,
  },
  pathParams: {
    id: 1
  }
}).then((res) => { }).catch(error => {
  const r = focus4APIBrowser.parseError('createTask', error);
  r?.type
});


export type { Focus4Contracts };
