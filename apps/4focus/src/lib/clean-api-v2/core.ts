import type { CallArgs, CleanApi, Configuration, Contracts } from "./models";

const init =
  <TConfiguration extends Configuration | undefined>(config?: TConfiguration) =>
  <TContracts extends Contracts>() =>
  <
    TContractsSignature extends {
      [K in keyof TContracts]: {
        resolver: (
          ...args: CallArgs<TConfiguration, TContracts, K>
        ) => Promise<TContracts[K]["dto"]>;
      };
    },
  >(
    contracts: TContractsSignature,
  ): CleanApi<TContracts> => {
    const call = async <TKey extends keyof TContracts>(
      key: TKey,
      ...args: CallArgs<undefined, TContracts, TKey>
    ): Promise<TContracts[TKey]["dto"]> => {
      const resolver = contracts[key].resolver;
      const input = (args[0] ?? {}) as {
        pathParams?: Record<string, unknown>;
        searchParams?: Record<string, unknown>;
        payload?: unknown;
        extra?: unknown;
      };
      const keys = [
        "pathParams",
        "searchParams",
        "payload",
        "extra",
      ] as (keyof typeof input)[];

      const finalInput = {} as typeof input & {
        config?: TConfiguration;
      };

      for (const key of keys) {
        if (key in input) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          finalInput[key] = input[key] as any;
        }
      }

      if (typeof config === "object" && !!config) {
        finalInput.config = config;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await resolver(finalInput as any);
    };

    const safeCall = async <TKey extends keyof TContracts>(
      key: TKey,
      ...args: CallArgs<undefined, TContracts, TKey>
    ): Promise<[true, TContracts[TKey]["dto"]] | [false, unknown]> => {
      try {
        const result = await call(key, ...args);
        return [true, result];
      } catch (error) {
        return [false, error];
      }
    };

    const pathParams: CleanApi<TContracts>["pathParams"] = (_key, pathParams) =>
      pathParams;

    const searchParams: CleanApi<TContracts>["searchParams"] = (
      _key,
      searchParams,
    ) => searchParams;

    const payload: CleanApi<TContracts>["payload"] = (_key, payload) => payload;

    const error: CleanApi<TContracts>["error"] = (_key, error) => error;

    const dto: CleanApi<TContracts>["dto"] = (_key, dto) => dto;

    return {
      call,
      safeCall,
      error,
      dto,
      pathParams,
      searchParams,
      payload,
    };
  };

export { init };
