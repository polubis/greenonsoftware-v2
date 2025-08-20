import { describe, expect, expectTypeOf, it } from "vitest";
import { init } from "../core";

describe("search params construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      get: {
        dto: null;
        error: null;
        searchParams: { version: number };
      };
      post: {
        dto: null;
        error: null;
        searchParams: { version: number; optional?: string };
      };
      put: {
        dto: null;
        error: null;
      };
    };

    const contract = init({ url: "https://api.example.com" });
    const create = contract<APIContracts>();
    const api = create({
      get: {
        resolver: () => {
          return Promise.resolve(null);
        },
      },
      post: {
        resolver: () => {
          return Promise.resolve(null);
        },
      },
      put: {
        resolver: () => {
          return Promise.resolve(null);
        },
      },
    });

    const searchParams = api.searchParams("get", { version: 1 });

    expect(searchParams).toEqual({ version: 1 });
    // @ts-expect-error - missing search params
    expect(api.searchParams("get", {})).toEqual({});
    // @ts-expect-error - missing search params
    expect(api.searchParams("get")).toEqual(undefined);
    expectTypeOf(searchParams).toEqualTypeOf<{ version: number }>();

    const postSearchParams1 = api.searchParams("post", { version: 2 });
    const postSearchParams2 = api.searchParams("post", {
      version: 2,
      optional: "test",
    });
    const postSearchParams3 = api.searchParams("post", {
      version: 2,
      optional: undefined,
    });

    expect(postSearchParams1).toEqual({ version: 2 });
    expect(postSearchParams2).toEqual({ version: 2, optional: "test" });
    expect(postSearchParams3).toEqual({ version: 2, optional: undefined });
    expectTypeOf(postSearchParams1).toEqualTypeOf<{
      version: number;
      optional?: string;
    }>();

    // @ts-expect-error - wrong property type
    api.searchParams("post", { version: 2, optional: 123 });

    // @ts-expect-error - endpoint does not have searchParams
    api.searchParams("put", {});
  });
});
