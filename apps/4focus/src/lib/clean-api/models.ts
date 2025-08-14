/* eslint-disable @typescript-eslint/no-explicit-any */
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
      rawError: unknown;
    }
  : {
      type: T;
      status: TStatus;
      message: TMessage;
      meta: TMeta;
      rawError: unknown;
    };

type CleanAPIContracts = Record<
  string,
  {
    dto: any;
    error: ErrorVariant<string, number, string>;
    payload?: any;
    pathParams?: Record<string, any>;
    searchParams?: Record<string, any>;
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
