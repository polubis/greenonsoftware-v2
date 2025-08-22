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
  ): CleanApi<TContracts> => {
    const call: CleanApi<TContracts>["call"] = async (key, ...args) => {
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

    const safeCall: CleanApi<TContracts>["safeCall"] = async (key, ...args) => {
      try {
        const result = await call(key, ...args);
        return [true, result];
      } catch (error) {
        return [false, error];
      }
    };

    const pathParams: CleanApi<TContracts>["pathParams"] = (
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

    const searchParams: CleanApi<TContracts>["searchParams"] = (
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

    const payload: CleanApi<TContracts>["payload"] = (key, payload) => {
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

    const error: CleanApi<TContracts>["error"] = (_key, error) => error;

    const dto: CleanApi<TContracts>["dto"] = (key, dto) => {
      const schemas = contracts[key]?.schemas;

      if (schemas && "dto" in schemas && typeof schemas.dto === "function") {
        schemas.dto(dto);
      }

      return dto;
    };

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
