/* eslint-disable @typescript-eslint/no-explicit-any */
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

type Configuration = Record<string, unknown>;

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
  TProp extends "pathParams" | "searchParams" | "payload" | "extra",
> = {
  [K in keyof TContracts]: TProp extends keyof TContracts[K] ? K : never;
}[keyof TContracts];

type SchemaValidator<T, TRawSchema = unknown> = ((data: unknown) => T) & {
  __rawSchema?: TRawSchema;
};

type ConditionalSchema<
  TContract extends Contracts[keyof Contracts],
  TKey extends "payload" | "pathParams" | "searchParams" | "extra",
> = TKey extends keyof TContract
  ? { [K in TKey]?: SchemaValidator<TContract[K]> }
  : unknown;

type ContractSchemas<TContract extends Contracts[keyof Contracts]> = {
  dto?: SchemaValidator<TContract["dto"]>;
  error?: SchemaValidator<TContract["error"]>;
} & ConditionalSchema<TContract, "payload"> &
  ConditionalSchema<TContract, "pathParams"> &
  ConditionalSchema<TContract, "searchParams"> &
  ConditionalSchema<TContract, "extra">;

// Type to extract the actual schemas from contract signature
type ExtractProvidedSchemas<T> = T extends { schemas?: infer S }
  ? S
  : undefined;

// Type to filter out undefined values from schemas object
type FilterUndefinedSchemas<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K];
};

// Type for getSchema return based on actual contract signature
type GetSchemaReturn<
  TContractsSignature,
  TKey extends keyof TContractsSignature,
> =
  ExtractProvidedSchemas<TContractsSignature[TKey]> extends undefined
    ? unknown
    : FilterUndefinedSchemas<
          ExtractProvidedSchemas<TContractsSignature[TKey]>
        > extends Record<string, never>
      ? unknown
      : FilterUndefinedSchemas<
          ExtractProvidedSchemas<TContractsSignature[TKey]>
        >;

// Type to extract raw schema from a SchemaValidator
type ExtractRawSchema<T> =
  T extends SchemaValidator<any, infer TRawSchema> ? TRawSchema : never;

// Type for getRawSchema return based on actual contract signature
type GetRawSchemaReturn<
  TContractsSignature,
  TKey extends keyof TContractsSignature,
> =
  ExtractProvidedSchemas<TContractsSignature[TKey]> extends undefined
    ? unknown
    : FilterUndefinedSchemas<
          ExtractProvidedSchemas<TContractsSignature[TKey]>
        > extends Record<string, never>
      ? unknown
      : {
          [K in keyof FilterUndefinedSchemas<
            ExtractProvidedSchemas<TContractsSignature[TKey]>
          >]: ExtractRawSchema<
            FilterUndefinedSchemas<
              ExtractProvidedSchemas<TContractsSignature[TKey]>
            >[K]
          >;
        };

type CleanApi<
  TContracts extends Contracts,
  TConfiguration extends Configuration | undefined,
  TContractsSignature = Record<
    keyof TContracts,
    { resolver: unknown; schemas?: unknown }
  >,
> = {
  onCall: <TKey extends keyof TContracts>(
    key: TKey,
    callback: (
      ...args: CallArgs<TConfiguration, TContracts, TKey>
    ) => void | Promise<void>,
  ) => () => void;
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
    key: TKey,
    error: TError & TContracts[TKey]["error"],
  ) => TError;
  dto: <TKey extends keyof TContracts>(
    key: TKey,
    dto: TContracts[TKey]["dto"],
  ) => TContracts[TKey]["dto"];
  pathParams: <TKey extends KeysWith<TContracts, "pathParams">>(
    key: TKey,
    pathParams: TContracts[TKey]["pathParams"],
  ) => TContracts[TKey]["pathParams"];
  searchParams: <TKey extends KeysWith<TContracts, "searchParams">>(
    key: TKey,
    searchParams: TContracts[TKey]["searchParams"],
  ) => TContracts[TKey]["searchParams"];
  payload: <TKey extends KeysWith<TContracts, "payload">>(
    key: TKey,
    payload: TContracts[TKey]["payload"],
  ) => TContracts[TKey]["payload"];
  extra: <TKey extends KeysWith<TContracts, "extra">>(
    key: TKey,
    extra: TContracts[TKey]["extra"],
  ) => TContracts[TKey]["extra"];
  getSchema: <TKey extends keyof TContracts & keyof TContractsSignature>(
    contractKey: TKey,
  ) => GetSchemaReturn<TContractsSignature, TKey>;
  getRawSchema: <TKey extends keyof TContracts & keyof TContractsSignature>(
    contractKey: TKey,
  ) => GetRawSchemaReturn<TContractsSignature, TKey>;
};

class ValidationException extends Error {
  constructor(public issues: { path: (string | number)[]; message: string }[]) {
    super("Validation exception");
  }

  static is = (error: unknown): error is ValidationException => {
    return error instanceof ValidationException;
  };
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

// Utility types for inferring types from CleanApi instances

/**
 * Extract the contracts type from a CleanApi instance
 */
type InferContracts<TApi> =
  TApi extends CleanApi<infer TContracts, any> ? TContracts : never;

type InferDto<
  TApi,
  TEndpoint extends keyof InferContracts<TApi>,
> = InferContracts<TApi>[TEndpoint]["dto"];

type InferAllDtos<TApi> = {
  [K in keyof InferContracts<TApi>]: InferContracts<TApi>[K]["dto"];
};

// Alias for better naming consistency
type InferAllDto<TApi> = InferAllDtos<TApi>;

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
  InferContracts,
  InferDto,
  InferAllDtos,
  InferAllDto,
};
export { ValidationException };
