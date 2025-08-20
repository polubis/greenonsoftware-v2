import type { CallArgs, Contracts } from "./models";

const create = <TContracts extends Contracts>() => <
    TConfig extends {
        [K in keyof TContracts]: {
            resolver: (
                ...args: CallArgs<TContracts, K>
            ) => Promise<TContracts[K]["dto"]>;
        };
    },
>(
    config: TConfig
) => {

    return {
        call: async <TKey extends keyof TContracts>(
            key: TKey,
            ...args: CallArgs<TContracts, TKey>
        ): Promise<TContracts[TKey]["dto"]> => {
            const resolver = config[key].resolver;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await resolver(...args as any);
        }
    }
}

export { create }
