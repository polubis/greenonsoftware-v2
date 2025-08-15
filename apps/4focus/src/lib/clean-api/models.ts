type ErrorVariant<
  T extends string,
  TStatus extends number,
  TMeta = undefined,
> = TMeta extends undefined
  ? {
      type: T;
      status: TStatus;
      message: string;
      rawError: unknown;
    }
  : {
      type: T;
      status: TStatus;
      message: string;
      meta: TMeta;
      rawError: unknown;
    };

type CleanAPIContracts = Record<
  string,
  {
    dto: unknown;
    error: ErrorVariant<string, number>;
    payload?: unknown;
    pathParams?: Record<string, unknown>;
    searchParams?: Record<string, unknown>;
  }
>;

type CleanAPIMethod = "get" | "post" | "put" | "patch" | "delete";

type CleanAPIBrowserConfig<TContracts extends CleanAPIContracts> = {
  [K in keyof TContracts]: {
    method: CleanAPIMethod;
    path: string;
  };
};

type InferInput<
  TContracts extends CleanAPIContracts,
  TContract extends TContracts[keyof TContracts],
> = ("pathParams" extends keyof TContract
  ? { pathParams: TContract["pathParams"] }
  : unknown) &
  ("searchParams" extends keyof TContract
    ? { searchParams: TContract["searchParams"] }
    : unknown) &
  ("payload" extends keyof TContract
    ? { payload: TContract["payload"] }
    : unknown);

export type {
  CleanAPIContracts,
  CleanAPIBrowserConfig,
  CleanAPIMethod,
  ErrorVariant,
  InferInput,
};
