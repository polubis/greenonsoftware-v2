import { describe, expect, expectTypeOf, it } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

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
