import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { init } from "../core";
import { ValidationException } from "../models";

describe("payload construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      get: {
        dto: null;
        error: null;
      };
      post: {
        dto: null;
        error: null;
        payload: { name: string };
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

    const postPayload = api.payload("post", { name: "test" });

    expect(postPayload).toEqual({ name: "test" });

    // @ts-expect-error - wrong payload structure
    api.payload("post", { name: 123 });
    // @ts-expect-error - key 'get' does not have payload
    api.payload("get", {});
    // @ts-expect-error - wrong key
    api.payload("nonexistent", {});

    expectTypeOf(postPayload).toEqualTypeOf<{ name: string }>();
  });

  it("optional properties are handled correctly", () => {
    type APIContracts = {
      post: {
        dto: null;
        error: null;
        payload: { required: string; optional?: number };
      };
    };

    const contract = init();
    const create = contract<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
      },
    });

    const payload1 = api.payload("post", { required: "test" });
    expect(payload1).toEqual({ required: "test" });
    expectTypeOf(payload1).toEqualTypeOf<{
      required: string;
      optional?: number;
    }>();

    const payload2 = api.payload("post", { required: "test", optional: 123 });
    expect(payload2).toEqual({ required: "test", optional: 123 });

    // @ts-expect-error - missing required property
    api.payload("post", { optional: 123 });
  });

  it("primitive types are used as payload", () => {
    type APIContracts = {
      post: {
        dto: null;
        error: null;
        payload: string;
      };
    };

    const contract = init();
    const create = contract<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
      },
    });

    const payload = api.payload("post", "test_payload");
    expect(payload).toBe("test_payload");
    expectTypeOf(payload).toEqualTypeOf<string>();

    // @ts-expect-error - wrong primitive type
    api.payload("post", 123);
  });

  it("schema validator is correctly typed", () => {
    type APIContracts = {
      post: {
        dto: null;
        error: null;
        payload: { name: string };
      };
    };

    const contract = init();
    const create = contract<APIContracts>();

    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
        schemas: {
          payload: (data) => {
            expectTypeOf(data).toEqualTypeOf<{ name: string }>();
          },
        },
      },
    });

    const postPayload = api.payload("post", { name: "test" });
    expectTypeOf(postPayload).toEqualTypeOf<{ name: string }>();
  });

  it("validation passes for a valid payload", () => {
    const validator = vi.fn();
    type APIContracts = {
      post: { dto: null; error: null; payload: { name: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
        schemas: { payload: validator },
      },
    });
    const payload = { name: "test" };
    expect(() => api.payload("post", payload)).not.toThrow();
    expect(validator).toHaveBeenCalledWith(payload);
  });

  it("validation throws for an invalid payload", () => {
    const validator = vi.fn().mockImplementation(() => {
      throw new ValidationException([{ path: ["name"], message: "is wrong" }]);
    });
    type APIContracts = {
      post: { dto: null; error: null; payload: { name: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
        schemas: { payload: validator },
      },
    });
    const payload = { name: "test" };
    expect(() => api.payload("post", payload)).toThrow(ValidationException);
    expect(validator).toHaveBeenCalledWith(payload);
  });

  it("no schema is provided for validation", () => {
    type APIContracts = {
      post: { dto: null; error: null; payload: { name: string } };
    };
    const create = init()<APIContracts>();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
      },
    });
    const payload = { name: "test" };
    expect(() => api.payload("post", payload)).not.toThrow();
  });
});
