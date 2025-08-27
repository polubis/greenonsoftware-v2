import type {
  CallArgs,
  CleanApi,
  Configuration,
  Contracts,
  ContractSchemas,
} from "./models";

const init =
  <TConfiguration extends Configuration | undefined>(config?: TConfiguration) =>
  <TContracts extends Contracts>() =>
  <
    TContractsSignature extends {
      [K in keyof TContracts]: {
        resolver: (
          ...args: CallArgs<TConfiguration, TContracts, K>
        ) => Promise<TContracts[K]["dto"]>;
        schemas?: ContractSchemas<TContracts[K]>;
      };
    },
  >(
    contracts: TContractsSignature,
  ): CleanApi<TContracts, TConfiguration> => {
    const subs = new Map<
      keyof TContracts,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Map<symbol, (...args: any[]) => void | Promise<void>>
    >();

    const onCall: CleanApi<TContracts, TConfiguration>["onCall"] = (
      key,
      callback,
    ) => {
      const callId = Symbol(`onCall:${key.toString()}`);

      // Create a Map for this endpoint if it doesn't exist
      if (!subs.has(key)) {
        subs.set(key, new Map());
      }

      subs.get(key)?.set(callId, callback);

      return () => {
        subs.get(key)?.delete(callId);
      };
    };

    const pathParams: CleanApi<TContracts, TConfiguration>["pathParams"] = (
      key,
      pathParams,
    ) => {
      const schemas = contracts[key]?.schemas;

      if (
        schemas &&
        "pathParams" in schemas &&
        typeof schemas.pathParams === "function"
      ) {
        schemas.pathParams(pathParams);
      }

      return pathParams;
    };

    const searchParams: CleanApi<TContracts, TConfiguration>["searchParams"] = (
      key,
      searchParams,
    ) => {
      const schemas = contracts[key]?.schemas;

      if (
        schemas &&
        "searchParams" in schemas &&
        typeof schemas.searchParams === "function"
      ) {
        schemas.searchParams(searchParams);
      }

      return searchParams;
    };

    const payload: CleanApi<TContracts, TConfiguration>["payload"] = (
      key,
      payload,
    ) => {
      const schemas = contracts[key]?.schemas;

      if (
        schemas &&
        "payload" in schemas &&
        typeof schemas.payload === "function"
      ) {
        schemas.payload(payload);
      }

      return payload;
    };

    const extra: CleanApi<TContracts, TConfiguration>["extra"] = (
      key,
      extra,
    ) => {
      const schemas = contracts[key]?.schemas;

      if (
        schemas &&
        "extra" in schemas &&
        typeof schemas.extra === "function"
      ) {
        schemas.extra(extra);
      }

      return extra;
    };

    const error: CleanApi<TContracts, TConfiguration>["error"] = (
      key,
      error,
    ) => {
      const schemas = contracts[key]?.schemas;

      if (
        schemas &&
        "error" in schemas &&
        typeof schemas.error === "function"
      ) {
        schemas.error(error);
      }

      return error;
    };

    const dto: CleanApi<TContracts, TConfiguration>["dto"] = (key, dto) => {
      const schemas = contracts[key]?.schemas;

      if (schemas && "dto" in schemas && typeof schemas.dto === "function") {
        schemas.dto(dto);
      }

      return dto;
    };

    const call: CleanApi<TContracts, TConfiguration>["call"] = async (
      key,
      ...args
    ) => {
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

      const onCallSubs = subs.get(key);

      if (onCallSubs) {
        for (const [, callback] of onCallSubs) {
          try {
            callback(finalInput);
          } catch (error) {
            console.error(
              `onCall callback error for endpoint '${key.toString()}':`,
              error,
            );
          }
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return await resolver(finalInput as any);
    };

    const safeCall: CleanApi<TContracts, TConfiguration>["safeCall"] = async (
      key,
      ...args
    ) => {
      try {
        const result = await call(key, ...args);
        return [true, result];
      } catch (error) {
        return [false, error];
      }
    };

    return {
      call,
      onCall,
      safeCall,
      error,
      dto,
      pathParams,
      searchParams,
      payload,
      extra,
    };
  };

export { init };
