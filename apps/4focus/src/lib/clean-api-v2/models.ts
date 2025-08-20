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
        error: ErrorVariant<string, number>;
        payload?: unknown;
        pathParams?: Record<string, unknown>;
        searchParams?: Record<string, unknown>;
    }
>;

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
        : unknown);

type CallArgs<
    TContracts extends Contracts,
    TKey extends keyof TContracts,
> = TContracts[TKey] extends
    | { pathParams: unknown }
    | { searchParams: unknown }
    | { payload: unknown }
    ? [input: InferInput<TContracts, TContracts[TKey]>]
    : [];

export type { Contracts, ErrorVariant, CallArgs, InferInput };
