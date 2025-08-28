import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { init } from "../core";
import { ValidationException } from "../models";

describe("search params construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      get: {
        dto: null;
        error: null;
        searchParams: { q: string };
      };
      post: {
        dto: null;
        error: null;
      };
    };

    const contract = init();
    const create = contract<APIContracts>();
    const api = create({
      get: {
        resolver: () => Promise.resolve(null),
      },
      post: {
        resolver: () => Promise.resolve(null),
      },
    });

    const getSearchParams = api.searchParams("get", { q: "test" });

    expect(getSearchParams).toEqual({ q: "test" });

    // @ts-expect-error - wrong searchParams structure
    api.searchParams("get", { q: 123 });
    // @ts-expect-error - key 'post' does not have searchParams
    api.searchParams("post", {});
    // @ts-expect-error - wrong key
    api.searchParams("nonexistent", {});

    expectTypeOf(getSearchParams).toEqualTypeOf<{ q: string }>();
  });

  it("optional properties are handled correctly", () => {
    type APIContracts = {
      get: {
        dto: null;
        error: null;
        searchParams: { required: string; optional?: number };
      };
    };

    const contract = init();
    const create = contract<APIContracts>();
    const api = create({
      get: {
        resolver: () => Promise.resolve(null),
      },
    });

    const params1 = api.searchParams("get", { required: "test" });
    expect(params1).toEqual({ required: "test" });
    expectTypeOf(params1).toEqualTypeOf<{
      required: string;
      optional?: number;
    }>();

    const params2 = api.searchParams("get", {
      required: "test",
      optional: 123,
    });
    expect(params2).toEqual({ required: "test", optional: 123 });

    // @ts-expect-error - missing required property
    api.searchParams("get", { optional: 123 });
  });

  it("schema validator is correctly typed", () => {
    type APIContracts = {
      get: {
        dto: null;
        error: null;
        searchParams: { q: string };
      };
    };

    const contract = init();
    const create = contract<APIContracts>();

    const api = create({
      get: {
        resolver: () => Promise.resolve(null),
        schemas: {
          // @ts-expect-error - type must reflect the dto contract
          searchParams: (data) => {
            expectTypeOf(data).toEqualTypeOf<unknown>();
            return data;
          },
        },
      },
    });

    const getSearchParams = api.searchParams("get", { q: "test" });
    expectTypeOf(getSearchParams).toEqualTypeOf<{ q: string }>();
  });

  it("validation passes for valid search parameters", () => {
    const validator = vi.fn();
    type APIContracts = {
      get: { dto: null; error: null; searchParams: { q: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      get: {
        resolver: () => Promise.resolve(null),
        schemas: { searchParams: validator },
      },
    });
    const params = { q: "test" };
    expect(() => api.searchParams("get", params)).not.toThrow();
    expect(validator).toHaveBeenCalledWith(params);
  });

  it("validation throws for invalid search parameters", () => {
    const validator = vi.fn().mockImplementation(() => {
      throw new ValidationException([{ path: ["q"], message: "is wrong" }]);
    });
    type APIContracts = {
      get: { dto: null; error: null; searchParams: { q: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      get: {
        resolver: () => Promise.resolve(null),
        schemas: { searchParams: validator },
      },
    });
    const params = { q: "test" };
    expect(() => api.searchParams("get", params)).toThrow(ValidationException);
    expect(validator).toHaveBeenCalledWith(params);
  });

  it("no schema is provided for validation", () => {
    type APIContracts = {
      get: { dto: null; error: null; searchParams: { q: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      get: {
        resolver: () => Promise.resolve(null),
      },
    });
    const params = { q: "test" };
    expect(() => api.searchParams("get", params)).not.toThrow();
  });
});
