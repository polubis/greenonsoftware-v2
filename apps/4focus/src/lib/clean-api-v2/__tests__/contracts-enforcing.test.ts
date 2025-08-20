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
        resolver: () => { },
      },
    });
    create({
      // @ts-expect-error - typo in key
      getType: {
        resolver: () => { },
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
