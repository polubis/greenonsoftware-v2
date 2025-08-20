import { describe, expectTypeOf, it } from "vitest";
import type { ErrorVariant } from "../models";
import { create } from "..";

describe("contracts enforcing works when", () => {
  it("creation & configuration is protected from wrong types", () => {
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

    create<APIContracts>()({
      get: {
        // @ts-expect-error - wrong dto type
        resolver: () => {},
      },
    });
    create<APIContracts>()({
      // @ts-expect-error - typo in key
      getType: {
        resolver: () => {},
      },
    });
    // @ts-expect-error - not full contract configured
    create<APIContracts>()({
      post: {
        resolver: () => Promise.resolve({ tasks: [{ id: 1 }] }),
      },
    });
    create<APIContracts>()({
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
    create<APIContracts>()({
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
    create<APIContracts>()({
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
    const api = create<APIContracts>()({
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
    await expect(api.call("get")).rejects.toThrow();
    // @ts-expect-error - empty input
    api.call("get", {});
    // @ts-expect-error - not full input
    api.call("get", { searchParams: { version: 1 } });
    // @ts-expect-error - typo in input
    api.call("get", { searchParams: { version: 1 }, typo: true });

    // @ts-expect-error - missing input
    await expect(api.call("post")).rejects.toThrow();
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
