import type { CallArgs, Configuration, Contracts, KeysWith } from "./models";

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
      ) => {

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
        }

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
        }

        const pathParams = <TKey extends KeysWith<TContracts, "pathParams">>(
          _key: TKey,
          pathParams: TContracts[TKey]["pathParams"],
        ): TContracts[TKey]["pathParams"] => {
          return pathParams;
        };

        const searchParams = <TKey extends KeysWith<TContracts, "searchParams">>(
          _key: TKey,
          searchParams: TContracts[TKey]["searchParams"],
        ): TContracts[TKey]["searchParams"] => {
          return searchParams;
        };

        const payload = <TKey extends KeysWith<TContracts, "payload">>(
          _key: TKey,
          payload: TContracts[TKey]["payload"],
        ): TContracts[TKey]["payload"] => {
          return payload;
        };

        const error = <
            TKey extends keyof TContracts,
            TError extends TContracts[TKey]["error"],
          >(
            _key: TKey,
            error: TError &
              TContracts[TKey]["error"],
          ): TError => {
            return error;
          };

          const dto = <TKey extends keyof TContracts>(
            _key: TKey,
            dto: TContracts[TKey]["dto"],
          ): TContracts[TKey]["dto"] => {
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
