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
> = OmitUndefined<{
  type: T;
  status: TStatus;
  message: TMessage;
  meta: TMeta;
}>;
type BadRequestError = ErrorVariant<"bad_request", 400, string>;
type UnauthorizedError = ErrorVariant<"unauthorized", 401, string>;
type InternalServerError = ErrorVariant<"internal_server_error", 500, string>;

type Focus4Contracts = {
  getTasks: {
    dto: { tasks: TaskRow[] };
    error: BadRequestError | UnauthorizedError | InternalServerError;
  };
};

export type { Focus4Contracts };
