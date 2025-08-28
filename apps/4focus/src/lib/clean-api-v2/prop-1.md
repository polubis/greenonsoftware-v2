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
}, >(
contracts: TContractsSignature,
): CleanApi<TContracts, TConfiguration> => {
const onCallChannelId = Symbol('onCall')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const subs = new Map<symbol, Map<symbol, (...args: any[]) => void | Promise<void>>>();
subs.set(onCallChannelId, new Map())

        const onCall: CleanApi<TContracts, TConfiguration>["onCall"] = (key, callback) => {
          const callId = Symbol(`onCall:${key.toString()}`);

          subs.get(onCallChannelId)?.set(callId, callback)

          return () => {
            subs.get(onCallChannelId)?.delete(callId)
          }
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

        const payload: CleanApi<TContracts, TConfiguration>["payload"] = (key, payload) => {
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

        const extra: CleanApi<TContracts, TConfiguration>["extra"] = (key, extra) => {
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

        const error: CleanApi<TContracts, TConfiguration>["error"] = (key, error) => {
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

        const call: CleanApi<TContracts, TConfiguration>["call"] = async (key, ...args) => {
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

          const onCallSubs = subs.get(onCallChannelId)

          if (onCallSubs) {
            for (const [, callback] of onCallSubs) {
              callback(finalInput)
            }
          }

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          return await resolver(finalInput as any);
        };

        const safeCall: CleanApi<TContracts, TConfiguration>["safeCall"] = async (key, ...args) => {
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

import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

describe("onCall works when", () => {
type APIContracts = {
get: {
dto: { id: number };
error: ErrorVariant<"not_found", 404>;
pathParams: { id: string };
searchParams: { q: string };
};
post: {
dto: { success: boolean };
error: ErrorVariant<"bad_request", 400>;
payload: { data: string };
};
noInput: {
dto: { status: string };
error: never;
};
};

    const mockGetResolver = vi.fn();
    const mockPostResolver = vi.fn();
    const mockNoInputResolver = vi.fn();

    // API with config
    const apiWithConfig = init({
        url: "https://api.example.com",
    })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        noInput: { resolver: mockNoInputResolver },
    });

    const apiWithoutConfig = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        noInput: { resolver: mockNoInputResolver },
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("a single callback is called with correct arguments and config", async () => {
        const onCallCallback = vi.fn();
        apiWithConfig.onCall("get", onCallCallback);

        mockGetResolver.mockResolvedValue({ id: 1 });
        const callArgs = {
            pathParams: { id: "123" },
            searchParams: { q: "test" },
        };
        await apiWithConfig.call("get", callArgs);

        expect(onCallCallback).toHaveBeenCalledTimes(1);
        expect(onCallCallback).toHaveBeenCalledWith({
            ...callArgs,
            config: { url: "https://api.example.com" },
        });

        apiWithConfig.onCall("get", (input) => {
            expectTypeOf(input.config).toEqualTypeOf<{
                url: string
            }>();
            expectTypeOf(input.pathParams).toEqualTypeOf<{
                id: string
            }>();
            expectTypeOf(input.searchParams).toEqualTypeOf<{
                q: string
            }>();
        });
    });

    it("a single callback is called with correct arguments when no config", async () => {
        const onCallCallback = vi.fn();
        apiWithoutConfig.onCall("get", onCallCallback);

        mockGetResolver.mockResolvedValue({ id: 1 });
        const callArgs = {
            pathParams: { id: "123" },
            searchParams: { q: "test" },
        };
        await apiWithoutConfig.call("get", callArgs);

        expect(onCallCallback).toHaveBeenCalledTimes(1);
        expect(onCallCallback).toHaveBeenCalledWith(callArgs);

        // Type assertion
        apiWithoutConfig.onCall("get", (input) => {
            expectTypeOf(input).toHaveProperty("pathParams");
            expectTypeOf(input).toHaveProperty("searchParams");
            expectTypeOf(input).not.toHaveProperty("config");
        });
    });

    it("multiple callbacks are called", async () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        apiWithConfig.onCall("get", callback1);
        apiWithConfig.onCall("get", callback2);

        mockGetResolver.mockResolvedValue({ id: 1 });
        const callArgs = {
            pathParams: { id: "456" },
            searchParams: { q: "multi" },
        };
        await apiWithConfig.call("get", callArgs);

        const expectedPayload = {
            ...callArgs,
            config: { url: "https://api.example.com" },
        };
        expect(callback1).toHaveBeenCalledTimes(1);
        expect(callback1).toHaveBeenCalledWith(expectedPayload);
        expect(callback2).toHaveBeenCalledTimes(1);
        expect(callback2).toHaveBeenCalledWith(expectedPayload);
    });

    it("unsubscribing a callback prevents it from being called", async () => {
        const callback1 = vi.fn();
        const callback2 = vi.fn();
        const unsubscribe = apiWithConfig.onCall("post", callback1);
        apiWithConfig.onCall("post", callback2);

        unsubscribe();

        mockPostResolver.mockResolvedValue({ success: true });
        await apiWithConfig.call("post", { payload: { data: "test" } });

        expect(callback1).not.toHaveBeenCalled();
        expect(callback2).toHaveBeenCalledTimes(1);
    });

    it("callback is called for an api call with no input", async () => {
        const onCallCallback = vi.fn();
        apiWithConfig.onCall("noInput", onCallCallback);

        mockNoInputResolver.mockResolvedValue({ status: "ok" });
        await apiWithConfig.call("noInput");

        expect(onCallCallback).toHaveBeenCalledTimes(1);
        expect(onCallCallback).toHaveBeenCalledWith({
            config: { url: "https://api.example.com" },
        });

        apiWithConfig.onCall("noInput", (input) => {
            expectTypeOf(input).not.toHaveProperty("pathParams");
            expectTypeOf(input).not.toHaveProperty("searchParams");
            expectTypeOf(input).not.toHaveProperty("payload");
            expectTypeOf(input).toHaveProperty("config");
            expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
        });
    });

    it("callback registered for one endpoint is called for another", async () => {
        const onCallCallbackForGet = vi.fn();
        apiWithConfig.onCall("get", onCallCallbackForGet);

        mockPostResolver.mockResolvedValue({ success: true });
        const postCallArgs = { payload: { data: "cross-call" } };
        await apiWithConfig.call("post", postCallArgs);

        expect(onCallCallbackForGet).toHaveBeenCalledTimes(1);
        // The callback for 'get' is called with arguments of 'post'.
        // This is the current behavior. Typescript will not catch this at runtime.
        expect(onCallCallbackForGet).toHaveBeenCalledWith({
            ...postCallArgs,
            config: { url: "https://api.example.com" },
        });
    });

    it("callback passed to onCall has correct TS types inferred", () => {
        apiWithConfig.onCall("get", (input) => {
            expectTypeOf(input.pathParams).toEqualTypeOf<{ id: string }>();
            expectTypeOf(input.searchParams).toEqualTypeOf<{ q: string }>();
            expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
        });
        apiWithConfig.onCall("post", (input) => {
            expectTypeOf(input.payload).toEqualTypeOf<{ data: string }>();
            expectTypeOf(input).not.toHaveProperty("pathParams");
            expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
        });
        apiWithConfig.onCall("noInput", (input) => {
            expectTypeOf(input).not.toHaveProperty("payload");
            expectTypeOf(input).not.toHaveProperty("pathParams");
            expectTypeOf(input).toHaveProperty("config");
            expectTypeOf(input).toEqualTypeOf<{ config: { url: string } }>();
        });

        apiWithoutConfig.onCall("get", (input) => {
            expectTypeOf(input).not.toHaveProperty("config");
        });
    });

});
