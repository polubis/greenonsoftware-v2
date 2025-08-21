type ErrorVariant<
  T extends string,
  TStatus extends number,
  TMeta = undefined,
> = TMeta extends undefined
  ? {
      type: T;
      status: TStatus;
      message: string;
    }
  : {
      type: T;
      status: TStatus;
      message: string;
      meta: TMeta;
    };

type Contracts = Record<
  string,
  {
    dto: unknown;
    error: unknown;
    payload?: unknown;
    pathParams?: Record<string, unknown>;
    searchParams?: Record<string, unknown>;
    extra?: unknown;
  }
>;

type Configuration = {
  url: string;
};

type InferInput<
  TContracts extends Contracts,
  TContract extends TContracts[keyof TContracts],
> = ("pathParams" extends keyof TContract
  ? { pathParams: TContract["pathParams"] }
  : unknown) &
  ("searchParams" extends keyof TContract
    ? { searchParams: TContract["searchParams"] }
    : unknown) &
  ("payload" extends keyof TContract
    ? { payload: TContract["payload"] }
    : unknown) &
  ("extra" extends keyof TContract ? { extra: TContract["extra"] } : unknown);

type CallArgs<
  TConfiguration extends Configuration | undefined,
  TContracts extends Contracts,
  TKey extends keyof TContracts,
> = TContracts[TKey] extends
  | { pathParams?: unknown }
  | { searchParams?: unknown }
  | { payload?: unknown }
  | { extra?: unknown }
  ? [
      input: InferInput<TContracts, TContracts[TKey]> &
        (TConfiguration extends undefined
          ? unknown
          : { config: TConfiguration }),
    ]
  : TConfiguration extends undefined
    ? []
    : [input: { config: TConfiguration }];

type KeysWith<
  TContracts extends Contracts,
  TProp extends "pathParams" | "searchParams" | "payload",
> = {
  [K in keyof TContracts]: TProp extends keyof TContracts[K] ? K : never;
}[keyof TContracts];

type SchemaValidator<T> = (data: T) => void;

type ConditionalSchema<
  TContract extends Contracts[keyof Contracts],
  TKey extends "payload" | "pathParams" | "searchParams",
> = TKey extends keyof TContract
  ? { [K in TKey]?: SchemaValidator<TContract[K]> }
  : unknown;

type ContractSchemas<TContract extends Contracts[keyof Contracts]> = {
  dto?: SchemaValidator<TContract["dto"]>;
  error?: SchemaValidator<TContract["error"]>;
} & ConditionalSchema<TContract, "payload"> &
  ConditionalSchema<TContract, "pathParams"> &
  ConditionalSchema<TContract, "searchParams">;

type CleanApi<TContracts extends Contracts> = {
  call: <TKey extends keyof TContracts>(
    key: TKey,
    ...args: CallArgs<undefined, TContracts, TKey>
  ) => Promise<TContracts[TKey]["dto"]>;
  safeCall: <TKey extends keyof TContracts>(
    key: TKey,
    ...args: CallArgs<undefined, TContracts, TKey>
  ) => Promise<[true, TContracts[TKey]["dto"]] | [false, unknown]>;
  error: <
    TKey extends keyof TContracts,
    TError extends TContracts[TKey]["error"],
  >(
    _key: TKey,
    error: TError & TContracts[TKey]["error"],
  ) => TError;
  dto: <TKey extends keyof TContracts>(
    _key: TKey,
    dto: TContracts[TKey]["dto"],
  ) => TContracts[TKey]["dto"];
  pathParams: <TKey extends KeysWith<TContracts, "pathParams">>(
    _key: TKey,
    pathParams: TContracts[TKey]["pathParams"],
  ) => TContracts[TKey]["pathParams"];
  searchParams: <TKey extends KeysWith<TContracts, "searchParams">>(
    _key: TKey,
    searchParams: TContracts[TKey]["searchParams"],
  ) => TContracts[TKey]["searchParams"];
  payload: <TKey extends KeysWith<TContracts, "payload">>(
    _key: TKey,
    payload: TContracts[TKey]["payload"],
  ) => TContracts[TKey]["payload"];
};

class ValidationException extends Error {
  constructor(public issues: { path: (string | number)[]; message: string }[]) {
    super("Validation exception");
  }
}

type AbortedError = ErrorVariant<"aborted", 0>;
type ClientExceptionError = ErrorVariant<"client_exception", -1>;
type NoInternetError = ErrorVariant<"no_internet", -2>;
type NoServerResponseError = ErrorVariant<"no_server_response", -3>;
type ConfigurationIssueError = ErrorVariant<"configuration_issue", -4>;
type UnsupportedServerResponseError = ErrorVariant<
  "unsupported_server_response",
  -5,
  { originalStatus: number; originalResponse: unknown }
>;
type ValidationError = ErrorVariant<
  "validation_error",
  -6,
  { issues: { path: (string | number)[]; message: string }[] }
>;

type BrowserError =
  | AbortedError
  | ClientExceptionError
  | NoInternetError
  | NoServerResponseError
  | ConfigurationIssueError
  | UnsupportedServerResponseError
  | ValidationError;

type ParsedError<
  TContracts extends Contracts,
  TKey extends keyof TContracts,
> = (TContracts[TKey]["error"] | BrowserError) & { rawError: unknown };

export type {
  Contracts,
  ErrorVariant,
  CallArgs,
  InferInput,
  Configuration,
  KeysWith,
  CleanApi,
  ParsedError,
  BrowserError,
  AbortedError,
  ClientExceptionError,
  NoInternetError,
  NoServerResponseError,
  ConfigurationIssueError,
  UnsupportedServerResponseError,
  ValidationError,
  ContractSchemas,
};
export { ValidationException };
