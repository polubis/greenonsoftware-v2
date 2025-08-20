import type { CallArgs, Contracts } from "./models";

const create = <TContracts extends Contracts>() => <
    TContractsSignature extends {
        [K in keyof TContracts]: {
            resolver: (
                ...args: CallArgs<TContracts, K>
            ) => Promise<TContracts[K]["dto"]>;
        };
    },
>(
    contracts: TContractsSignature,
) => {

    return {
        call: async <TKey extends keyof TContracts>(
            key: TKey,
            ...args: CallArgs<TContracts, TKey>
        ): Promise<TContracts[TKey]["dto"]> => {
            const resolver = contracts[key].resolver;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await resolver(...args as any);
        }
    }
}

export { create }
