import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { init } from "../core";
import { ValidationException } from "../models";

describe("extra construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      get: {
        dto: null;
        error: null;
      };
      post: {
        dto: null;
        error: null;
        extra: { traceId: string };
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

    const postExtra = api.extra("post", { traceId: "abc" });

    expect(postExtra).toEqual({ traceId: "abc" });

    // @ts-expect-error - wrong extra structure
    api.extra("post", { traceId: 123 });
    // @ts-expect-error - key 'get' does not have extra
    api.extra("get", {});
    // @ts-expect-error - wrong key
    api.extra("nonexistent", {});

    expectTypeOf(postExtra).toEqualTypeOf<{ traceId: string }>();
  });

  it("optional properties are handled correctly", () => {
    type APIContracts = {
      post: {
        dto: null;
        error: null;
        extra: { required: string; optional?: number };
      };
    };

    const contract = init();
    const create = contract<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
      },
    });

    const extra1 = api.extra("post", { required: "test" });
    expect(extra1).toEqual({ required: "test" });
    expectTypeOf(extra1).toEqualTypeOf<{
      required: string;
      optional?: number;
    }>();

    const extra2 = api.extra("post", { required: "test", optional: 123 });
    expect(extra2).toEqual({ required: "test", optional: 123 });

    // @ts-expect-error - missing required property
    api.extra("post", { optional: 123 });
  });

  it("primitive types are used as extra", () => {
    type APIContracts = {
      post: {
        dto: null;
        error: null;
        extra: string;
      };
    };

    const contract = init();
    const create = contract<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
      },
    });

    const extra = api.extra("post", "trace-id");
    expect(extra).toBe("trace-id");
    expectTypeOf(extra).toEqualTypeOf<string>();

    // @ts-expect-error - wrong primitive type
    api.extra("post", 123);
  });

  it("schema validator is correctly typed", () => {
    type APIContracts = {
      post: {
        dto: null;
        error: null;
        extra: { traceId: string };
      };
    };

    const contract = init();
    const create = contract<APIContracts>();

    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
        schemas: {
          // @ts-expect-error - no raw schema attached with metadata property
          extra: (data) => {
            expectTypeOf(data).toEqualTypeOf<unknown>();
            return data as { traceId: string };
          },
        },
      },
    });

    const postExtra = api.extra("post", { traceId: "abc" });
    expectTypeOf(postExtra).toEqualTypeOf<{ traceId: string }>();
  });

  it("validation passes for a valid extra", () => {
    const validator = vi.fn();
    type APIContracts = {
      post: { dto: null; error: null; extra: { traceId: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
        // @ts-expect-error - no raw schema attached with metadata property
        schemas: { extra: validator },
      },
    });
    const extra = { traceId: "abc" };
    expect(() => api.extra("post", extra)).not.toThrow();
    expect(validator).toHaveBeenCalledWith(extra);
  });

  it("validation throws for an invalid extra", () => {
    const validator = vi.fn().mockImplementation(() => {
      throw new ValidationException([
        { path: ["traceId"], message: "is wrong" },
      ]);
    });
    type APIContracts = {
      post: { dto: null; error: null; extra: { traceId: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
        // @ts-expect-error - no raw schema attached with metadata property
        schemas: { extra: validator },
      },
    });
    const extra = { traceId: "abc" };
    expect(() => api.extra("post", extra)).toThrow(ValidationException);
    expect(validator).toHaveBeenCalledWith(extra);
  });

  it("no schema is provided for validation", () => {
    type APIContracts = {
      post: { dto: null; error: null; extra: { traceId: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
      },
    });
    const extra = { traceId: "abc" };
    expect(() => api.extra("post", extra)).not.toThrow();
  });
});
