import type {
  CallArgs,
  CleanApi,
  Configuration,
  Contracts,
  ContractSchemas,
} from "./models";

/**
 * Creates a synchronous validator function that validates data and returns it if valid.
 * @param validator - Function that validates the data and throws ValidationException if invalid
 * @returns A function that validates data synchronously
 */
const check = <T>(validator: (data: unknown) => T) => {
  return (data: unknown): T => {
    return validator(data);
  };
};

/**
 * Creates an asynchronous validator function that validates data and returns it if valid.
 * @param validator - Function that validates the data and throws ValidationException if invalid
 * @returns A function that validates data asynchronously
 */
const checkAsync = <T>(validator: (data: unknown) => Promise<T>) => {
  return async (data: unknown): Promise<T> => {
    return await validator(data);
  };
};

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
        const endpointSubs = subs.get(key);

        if (endpointSubs) {
          endpointSubs.delete(callId);

          if (endpointSubs.size === 0) {
            subs.delete(key);
          }
        }
      };
    };

    const validateSchema = <TData>(
      key: keyof TContracts,
      schemaKey: keyof Contracts[keyof Contracts],
      data: TData,
    ): TData => {
      const schemas = contracts[key]?.schemas;

      if (schemas && schemaKey in schemas) {
        const validator = (schemas as Record<string, unknown>)[schemaKey];
        if (typeof validator === "function") {
          validator(data);
        }
      }

      return data;
    };

    const pathParams: CleanApi<TContracts, TConfiguration>["pathParams"] = (
      key,
      pathParams,
    ) => {
      return validateSchema(key, "pathParams", pathParams);
    };

    const searchParams: CleanApi<TContracts, TConfiguration>["searchParams"] = (
      key,
      searchParams,
    ) => {
      return validateSchema(key, "searchParams", searchParams);
    };

    const payload: CleanApi<TContracts, TConfiguration>["payload"] = (
      key,
      payload,
    ) => {
      return validateSchema(key, "payload", payload);
    };

    const extra: CleanApi<TContracts, TConfiguration>["extra"] = (
      key,
      extra,
    ) => {
      return validateSchema(key, "extra", extra);
    };

    const error: CleanApi<TContracts, TConfiguration>["error"] = (
      key,
      error,
    ) => {
      return validateSchema(key, "error", error);
    };

    const dto: CleanApi<TContracts, TConfiguration>["dto"] = (key, dto) => {
      return validateSchema(key, "dto", dto);
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

      // Runtime validation: validate each parameter if schema exists
      // Validate in order and fail fast
      for (const paramKey of keys) {
        if (paramKey in input) {
          // Validate the parameter if schema exists
          validateSchema(key, paramKey, input[paramKey]);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          finalInput[paramKey] = input[paramKey] as any;
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

export { init, check, checkAsync };
