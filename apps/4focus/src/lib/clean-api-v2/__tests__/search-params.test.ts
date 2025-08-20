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
        searchParams: { version: number };
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
    });

    const searchParams = api.searchParams("get", { version: 1 });

    expect(searchParams).toEqual({ version: 1 });
    // @ts-expect-error - missing search params
    expect(api.searchParams("get", {})).toEqual({});
    // @ts-expect-error - missing search params
    expect(api.searchParams("get")).toEqual(undefined);
    expectTypeOf(searchParams).toEqualTypeOf<{ version: number }>();
  });
});
