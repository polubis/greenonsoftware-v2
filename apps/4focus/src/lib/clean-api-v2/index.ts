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
    contracts: TContractsSignature
  ) => {
    return {
      call: async <TKey extends keyof TContracts>(
        key: TKey,
        ...args: CallArgs<undefined, TContracts, TKey>
      ): Promise<TContracts[TKey]["dto"]> => {
        const resolver = contracts[key].resolver;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return await resolver(...(args as any));
      },
    };
  };

export { configure };
