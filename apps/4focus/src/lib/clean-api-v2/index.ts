import type { CallArgs, Configuration, Contracts } from "./models";

const configure =
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
  ) => {
    return {
      call: async <TKey extends keyof TContracts>(
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
      },
    };
  };

export { configure };
