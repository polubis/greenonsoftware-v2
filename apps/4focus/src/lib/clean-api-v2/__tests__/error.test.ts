import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";
import { ValidationException } from "../models";

describe("error construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      get: {
        dto: null;
        error:
          | ErrorVariant<"not_found", 404>
          | ErrorVariant<"unauthorized", 401, { reason: string }>;
      };
      post: {
        dto: null;
        error: ErrorVariant<"bad_request", 400>;
      };
    };

    const contract = init({ url: "https://api.example.com" });
    const create = contract<APIContracts>();
    const api = create({
      get: { resolver: () => Promise.resolve(null) },
      post: { resolver: () => Promise.resolve(null) },
    });

    const notFoundError = api.error("get", {
      type: "not_found",
      status: 404,
      message: "Resource not found",
    });
    const unauthorizedError = api.error("get", {
      type: "unauthorized",
      status: 401,
      message: "Unauthorized access",
      meta: { reason: "invalid_token" },
    });
    const badRequestError = api.error("post", {
      type: "bad_request",
      status: 400,
      message: "Invalid input",
    });

    expect(notFoundError.type).toBe("not_found");
    expect(unauthorizedError.meta.reason).toBe("invalid_token");
    expect(badRequestError.status).toBe(400);

    api.error("get", {
      // @ts-expect-error - wrong error type for 'get' endpoint
      type: "bad_request",
      // @ts-expect-error - wrong error type for 'get' endpoint
      status: 400,
      message: "Wrong error",
    });
    // @ts-expect-error - missing meta field for 'unauthorized' error
    api.error("get", {
      type: "unauthorized",
      status: 401,
      message: "Missing meta",
    });

    expectTypeOf(notFoundError).toEqualTypeOf<ErrorVariant<"not_found", 404>>();
    expectTypeOf(unauthorizedError).toEqualTypeOf<
      ErrorVariant<"unauthorized", 401, { reason: string }>
    >();
    expectTypeOf(badRequestError).toEqualTypeOf<
      ErrorVariant<"bad_request", 400>
    >();
  });
});

describe("schema validation", () => {
  type APIContracts = {
    get: {
      dto: null;
      error:
        | ErrorVariant<"not_found", 404>
        | ErrorVariant<"unauthorized", 401, { reason: string }>;
    };
    post: {
      dto: null;
      error: ErrorVariant<"bad_request", 400>;
    };
  };

  const contract = init({ url: "https://api.example.com" });
  const create = contract<APIContracts>();

  it("is correctly typed", () => {
    const api = create({
      get: {
        resolver: () => Promise.resolve(null),
        schemas: {
          // @ts-expect-error - type must reflect the error contract
          error: (data) => {
            expectTypeOf(data).toEqualTypeOf<unknown>();
            return data;
          },
        },
      },
      post: { resolver: () => Promise.resolve(null) },
    });

    const err = api.error("get", {
      type: "not_found",
      status: 404,
      message: "x",
    });
    expectTypeOf(err).toEqualTypeOf<ErrorVariant<"not_found", 404>>();
  });

  it("not throw when error is valid", () => {
    const validator = vi.fn();
    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
        schemas: {
          // @ts-expect-error - no raw schema attached with metadata property
          error: validator,
        },
      },
      get: { resolver: () => Promise.resolve(null) },
    });

    const error = {
      type: "bad_request",
      status: 400,
      message: "Invalid",
    } as const;
    expect(() => api.error("post", error)).not.toThrow();
    expect(validator).toHaveBeenCalledWith(error);
  });

  it("throw ValidationException when error is invalid", () => {
    const validator = vi.fn().mockImplementation(() => {
      throw new ValidationException([{ path: ["type"], message: "is wrong" }]);
    });

    const api = create({
      post: {
        resolver: () => Promise.resolve(null),
        schemas: {
          // @ts-expect-error - no raw schema attached with metadata property
          error: validator,
        },
      },
      get: { resolver: () => Promise.resolve(null) },
    });

    const error = {
      type: "bad_request",
      status: 400,
      message: "Invalid",
    } as const;
    expect(() => api.error("post", error)).toThrow(ValidationException);
    expect(validator).toHaveBeenCalledWith(error);
  });

  it("not throw if schema is not provided", () => {
    const api = create({
      post: { resolver: () => Promise.resolve(null) },
      get: { resolver: () => Promise.resolve(null) },
    });

    const error = {
      type: "bad_request",
      status: 400,
      message: "Invalid",
    } as const;
    expect(() => api.error("post", error)).not.toThrow();
  });
});
