import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { init } from "../core";
import { ValidationException } from "../models";

describe("path params construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      "get-user": {
        dto: null;
        error: null;
        pathParams: { id: number };
      };
      "post-user": {
        dto: null;
        error: null;
      };
    };

    const contract = init();
    const create = contract<APIContracts>();
    const api = create({
      "get-user": {
        resolver: () => Promise.resolve(null),
      },
      "post-user": {
        resolver: () => Promise.resolve(null),
      },
    });

    const getPathParams = api.pathParams("get-user", { id: 1 });

    expect(getPathParams).toEqual({ id: 1 });

    // @ts-expect-error - wrong pathParams structure
    api.pathParams("get-user", { id: "1" });
    // @ts-expect-error - key 'post-user' does not have pathParams
    api.pathParams("post-user", {});
    // @ts-expect-error - wrong key
    api.pathParams("nonexistent", {});

    expectTypeOf(getPathParams).toEqualTypeOf<{ id: number }>();
  });

  it("multiple properties are handled correctly", () => {
    type APIContracts = {
      "get-post": {
        dto: null;
        error: null;
        pathParams: { userId: number; postId: number };
      };
    };

    const contract = init();
    const create = contract<APIContracts>();
    const api = create({
      "get-post": {
        resolver: () => Promise.resolve(null),
      },
    });

    const params = api.pathParams("get-post", { userId: 1, postId: 2 });
    expect(params).toEqual({ userId: 1, postId: 2 });
    expectTypeOf(params).toEqualTypeOf<{ userId: number; postId: number }>();

    // @ts-expect-error - missing required property
    api.pathParams("get-post", { userId: 1 });
  });

  it("schema validator is correctly typed", () => {
    type APIContracts = {
      "get-user": {
        dto: null;
        error: null;
        pathParams: { id: number };
      };
    };

    const contract = init();
    const create = contract<APIContracts>();

    const api = create({
      "get-user": {
        resolver: () => Promise.resolve(null),
        schemas: {
          // @ts-expect-error - type must reflect the dto contract
          pathParams: (data) => {
            expectTypeOf(data).toEqualTypeOf<unknown>();
            return data;
          },
        },
      },
    });

    const getPathParams = api.pathParams("get-user", { id: 1 });
    expectTypeOf(getPathParams).toEqualTypeOf<{ id: number }>();
  });

  it("validation passes for valid path parameters", () => {
    const validator = vi.fn();
    type APIContracts = {
      "get-user": { dto: null; error: null; pathParams: { id: number } };
    };
    const create = init()<APIContracts>();
    const api = create({
      "get-user": {
        resolver: () => Promise.resolve(null),
        schemas: { pathParams: validator },
      },
    });
    const params = { id: 1 };
    expect(() => api.pathParams("get-user", params)).not.toThrow();
    expect(validator).toHaveBeenCalledWith(params);
  });

  it("validation throws for invalid path parameters", () => {
    const validator = vi.fn().mockImplementation(() => {
      throw new ValidationException([{ path: ["id"], message: "is wrong" }]);
    });
    type APIContracts = {
      "get-user": { dto: null; error: null; pathParams: { id: number } };
    };
    const create = init()<APIContracts>();
    const api = create({
      "get-user": {
        resolver: () => Promise.resolve(null),
        schemas: { pathParams: validator },
      },
    });
    const params = { id: 1 };
    expect(() => api.pathParams("get-user", params)).toThrow(
      ValidationException,
    );
    expect(validator).toHaveBeenCalledWith(params);
  });

  it("no schema is provided for validation", () => {
    type APIContracts = {
      "get-user": { dto: null; error: null; pathParams: { id: number } };
    };
    const create = init()<APIContracts>();
    const api = create({
      "get-user": {
        resolver: () => Promise.resolve(null),
      },
    });
    const params = { id: 1 };
    expect(() => api.pathParams("get-user", params)).not.toThrow();
  });
});
