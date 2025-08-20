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

export type { Contracts, ErrorVariant, CallArgs, InferInput, Configuration, KeysWith };
