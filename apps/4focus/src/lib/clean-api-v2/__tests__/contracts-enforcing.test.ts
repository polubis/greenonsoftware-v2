import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { ErrorVariant } from "../models";
import { configure } from "..";

describe("contracts enforcing works when", () => {
  it("configuration is passed to the resolver and contract is protected from wrong types", async () => {
    type APIContracts = {
      get: {
        extra: { fetch: boolean };
        searchParams: { version: number };
        dto: { tasks: { id: number }[] };
        error:
          | ErrorVariant<"bad_request", 400>
          | ErrorVariant<"unauthorized", 401>;
      };
    };

    const contractWithoutConfig = configure();
    const contractWithConfig = configure({ url: "https://api.example.com" });

    contractWithoutConfig<APIContracts>()({
      get: {
        // @ts-expect-error - config is not defined in the contract
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resolver: ({ searchParams, extra, config }) => {
          return Promise.resolve({ tasks: [{ id: 1 }], searchParams, extra });
        },
      },
    });

    const spy = vi.fn();

    const api = contractWithConfig<APIContracts>()({
      get: {
        resolver: (input) => {
          spy(input);
          return Promise.resolve({ tasks: [{ id: 1 }] });
        },
      },
    });

    await api.call("get", {
      searchParams: { version: 1 },
      extra: { fetch: true },
    });

    expect(spy).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
      searchParams: { version: 1 },
      extra: { fetch: true },
    });
  });

  it("endpoint with global config but no other inputs is handled correctly", async () => {
    type APIContracts = {
      getStatus: {
        dto: { status: "ok" };
        error: ErrorVariant<"server_error", 500>;
      };
    };

    const spy = vi.fn();
    const contractWithConfig = configure({ url: "https://api.example.com" });

    const api = contractWithConfig<APIContracts>()({
      getStatus: {
        resolver: (input) => {
          spy(input);
          return Promise.resolve({ status: "ok" });
        },
      },
    });

    await api.call("getStatus");

    expect(spy).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
    });
  });

  it("handles optional input properties correctly", async () => {
    type APIContracts = {
      search: {
        payload?: { query: string };
        dto: { results: string[] };
        error: ErrorVariant<"bad_request", 400>;
      };
    };

    const contract = configure({ url: "https://api.example.com" });
    const create = contract<APIContracts>();
    const spy = vi.fn();

    const api = create({
      search: {
        resolver: (input) => {
          // @ts-expect-error - wrong property
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { config, searchParams, payload, extra } = input;
          spy(input);
          if (
            input &&
            typeof input === "object" &&
            "payload" in input &&
            input.payload
          ) {
            return Promise.resolve({
              results: [(input.payload as { query: string }).query],
            });
          }
          return Promise.resolve({ results: [] });
        },
      },
    });
    // @ts-expect-error - not needed objects passed
    await api.call("search", {});
    expect(spy).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
    });

    await api.call("search", { payload: { query: "test" } });
    expect(spy).toHaveBeenCalledWith({
      payload: { query: "test" },
      config: { url: "https://api.example.com" },
    });

    // @ts-expect-error - wrong property
    api.call("search", { payload: { name: "test" } });
    api.call("search", { payload: undefined });
  });

  it("deep enforcement of required and optional properties within an input object", () => {
    type APIContracts = {
      updateProfile: {
        payload: { name: string; age?: number };
        dto: { success: boolean };
        error: ErrorVariant<"bad_request", 400>;
      };
    };

    const contract = configure();
    const create = contract<APIContracts>();

    const api = create({
      updateProfile: {
        resolver: () => Promise.resolve({ success: true }),
      },
    });

    api.call("updateProfile", { payload: { name: "test" } });
    api.call("updateProfile", { payload: { name: "test", age: 30 } });
    api.call("updateProfile", { payload: { name: "test", age: undefined } });

    // @ts-expect-error - required property 'name' is missing
    api.call("updateProfile", { payload: { age: 30 } });
  });

  it("handles endpoint with no inputs and no global configuration", async () => {
    type APIContracts = {
      ping: {
        dto: { pong: true };
        error: ErrorVariant<"server_error", 500>;
      };
    };

    const contractWithoutConfig = configure();
    const spy = vi.fn();

    const api = contractWithoutConfig<APIContracts>()({
      ping: {
        // @ts-expect-error - shows error when no config and no additional input
        resolver: (input) => {
          spy(input);
          return Promise.resolve({ pong: true });
        },
      },
    });

    await api.call("ping");
    expect(spy).toHaveBeenCalledWith({});
  });

  it("creation is protected from wrong types", () => {
    type APIContracts = {
      get: {
        extra: { fetch: boolean };
        searchParams: { version: number };
        dto: { tasks: { id: number }[] };
        error:
          | ErrorVariant<"bad_request", 400>
          | ErrorVariant<"unauthorized", 401>;
      };
      post: {
        payload: { name: string };
        pathParams: { id: string };
        searchParams: { version: number };
        dto: { tasks: { id: number }[] };
        error:
          | ErrorVariant<"bad_request", 400>
          | ErrorVariant<"unauthorized", 401>;
      };
    };

    const contract = configure();
    const create = contract<APIContracts>();

    create({
      get: {
        // @ts-expect-error - wrong dto type
        resolver: () => {},
      },
    });
    create({
      // @ts-expect-error - typo in key
      getType: {
        resolver: () => {},
      },
    });
    // @ts-expect-error - not full contract configured
    create({
      post: {
        resolver: () => Promise.resolve({ tasks: [{ id: 1 }] }),
      },
    });
    create({
      get: {
        // @ts-expect-error - payload and pathParams are not defined in the contract
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resolver: ({ payload, pathParams }) =>
          Promise.resolve({ tasks: [{ id: 1 }] }),
      },
      post: {
        resolver: ({ pathParams, searchParams, payload }) => {
          return Promise.resolve({
            tasks: [],
            pathParams,
            searchParams,
            payload,
          });
        },
      },
    });
    create({
      post: {
        // @ts-expect-error - extra is not defined in the contract
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resolver: ({ pathParams, searchParams, payload, extra }) => {
          return Promise.resolve({
            tasks: [],
            pathParams,
            searchParams,
            payload,
          });
        },
      },
      get: {
        resolver: ({ searchParams }) => {
          return Promise.resolve({ tasks: [{ id: 1 }], searchParams });
        },
      },
    });
    create({
      post: {
        resolver: ({ pathParams, searchParams, payload }) => {
          return Promise.resolve({
            tasks: [],
            pathParams,
            searchParams,
            payload,
          });
        },
      },
      get: {
        resolver: ({ searchParams, extra }) => {
          return Promise.resolve({ tasks: [{ id: 1 }], searchParams, extra });
        },
      },
    });
  });

  it("calling is protected from wrong types", async () => {
    type APIContracts = {
      get: {
        extra: { fetch: boolean };
        searchParams: { version: number };
        dto: { tasks: { id: number }[] };
        error:
          | ErrorVariant<"bad_request", 400>
          | ErrorVariant<"unauthorized", 401>;
      };
      post: {
        payload: { name: string };
        pathParams: { id: string };
        searchParams: { version: number };
        dto: { tasks: { id: number }[] };
        error:
          | ErrorVariant<"bad_request", 400>
          | ErrorVariant<"unauthorized", 401>;
      };
    };

    const contract = configure();
    const create = contract<APIContracts>();

    const api = create({
      post: {
        resolver: ({ pathParams, searchParams, payload }) => {
          return Promise.resolve({
            tasks: [],
            pathParams,
            searchParams,
            payload,
          });
        },
      },
      get: {
        resolver: ({ searchParams, extra }) => {
          return Promise.resolve({ tasks: [{ id: 1 }], searchParams, extra });
        },
      },
    });

    // @ts-expect-error - missing input
    api.call("get");
    // @ts-expect-error - empty input
    api.call("get", {});
    // @ts-expect-error - not full input
    api.call("get", { searchParams: { version: 1 } });
    // @ts-expect-error - typo in input
    api.call("get", { searchParams: { version: 1 }, typo: true });

    // @ts-expect-error - missing input
    api.call("post");
    // @ts-expect-error - empty input
    api.call("post", {});
    // @ts-expect-error - not full input
    api.call("post", { searchParams: { version: 1 } });
    // @ts-expect-error - typo in input
    api.call("post", { searchParams: { version: 1 }, typo: true });

    const getDto = api.call("get", {
      searchParams: { version: 1 },
      extra: { fetch: true },
    });
    const awaitedGetDto = await api.call("get", {
      searchParams: { version: 1 },
      extra: { fetch: true },
    });
    const postDto = api.call("post", {
      payload: { name: "test" },
      pathParams: { id: "1" },
      searchParams: { version: 1 },
    });
    const awaitedPostDto = await api.call("post", {
      payload: { name: "test" },
      pathParams: { id: "1" },
      searchParams: { version: 1 },
    });

    expectTypeOf(getDto).toEqualTypeOf<
      Promise<{
        tasks: { id: number }[];
      }>
    >();
    expectTypeOf(awaitedGetDto).toEqualTypeOf<{
      tasks: { id: number }[];
    }>();
    expectTypeOf(postDto).toEqualTypeOf<
      Promise<{
        tasks: { id: number }[];
      }>
    >();
    expectTypeOf(awaitedPostDto).toEqualTypeOf<{
      tasks: { id: number }[];
    }>();
  });
});
