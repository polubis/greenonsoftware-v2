import { describe, it, expect, vi, expectTypeOf } from "vitest";
import axios from "axios";
import { errorParser } from "../axios";
import { init } from "../../core";
import {
  type CleanApi,
  type ErrorVariant,
  type UnsupportedServerResponseError,
  type NoServerResponseError,
  type NoInternetError,
  type ConfigurationIssueError,
  type AbortedError,
  type ClientExceptionError,
  ValidationException,
  type ValidationError,
} from "../../models";

vi.mock("axios");

describe("axios adapter error parsing works when", () => {
  type APIContracts = {
    get: {
      dto: { id: number };
      error: ErrorVariant<"not_found", 404, { resource: string }>;
    };
  };

  const contract = init();
  const api = contract<APIContracts>()({
    get: {
      resolver: () => Promise.resolve({ id: 1 }),
    },
  });

  const parser = errorParser(api as CleanApi<APIContracts>);

  it("handles standard server error response", () => {
    const mockError = {
      isAxiosError: true,
      response: {
        status: 404,
        statusText: "not_found",
        data: {
          type: "not_found",
          status: 404,
          message: "Resource could not be found.",
          meta: { resource: "item" },
        },
      },
    };
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const parsed = parser("get", mockError);

    expect(parsed.status).toBe(404);
    expect(parsed.type).toBe("not_found");
    expect(parsed.message).toBe("Resource could not be found.");
    if (parsed.type === "not_found") {
      expect(parsed.meta).toEqual({ resource: "item" });
      expectTypeOf(parsed).toEqualTypeOf<
        ErrorVariant<"not_found", 404, { resource: string }> & {
          rawError: unknown;
        }
      >();
    }
  });

  it("handles unsupported server error response", () => {
    const mockError = {
      isAxiosError: true,
      response: {
        status: 500,
        data: "Internal Server Error",
      },
    };
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const parsed = parser("get", mockError);
    if (parsed.type === "unsupported_server_response") {
      expect(parsed.type).toBe("unsupported_server_response");
      expect(parsed.status).toBe(-5);
      expectTypeOf(parsed).toEqualTypeOf<
        UnsupportedServerResponseError & { rawError: unknown }
      >();
    }
  });

  it("handles no server response (network error)", () => {
    const mockError = {
      isAxiosError: true,
      request: {},
    };
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const parsed = parser("get", mockError);
    if (parsed.type === "no_server_response") {
      expect(parsed.type).toBe("no_server_response");
      expect(parsed.status).toBe(-3);
      expectTypeOf(parsed).toEqualTypeOf<
        NoServerResponseError & { rawError: unknown }
      >();
    }
  });

  it("handles no internet connection", () => {
    const mockError = {
      isAxiosError: true,
      request: {},
    };
    vi.mocked(axios.isAxiosError).mockReturnValue(true);
    Object.defineProperty(navigator, "onLine", {
      value: false,
      configurable: true,
    });

    const parsed = parser("get", mockError);
    if (parsed.type === "no_internet") {
      expect(parsed.type).toBe("no_internet");
      expect(parsed.status).toBe(-2);
      expectTypeOf(parsed).toEqualTypeOf<
        NoInternetError & { rawError: unknown }
      >();
    }
    Object.defineProperty(navigator, "onLine", {
      value: true,
      configurable: true,
    });
  });

  it("handles request configuration issue", () => {
    const mockError = {
      isAxiosError: true,
      message: "Configuration error",
    };
    vi.mocked(axios.isAxiosError).mockReturnValue(true);

    const parsed = parser("get", mockError);
    if (parsed.type === "configuration_issue") {
      expect(parsed.type).toBe("configuration_issue");
      expect(parsed.status).toBe(-4);
      expectTypeOf(parsed).toEqualTypeOf<
        ConfigurationIssueError & { rawError: unknown }
      >();
    }
  });

  it("handles request cancellation", () => {
    const mockError = {};
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
    vi.mocked(axios.isCancel).mockReturnValue(true);

    const parsed = parser("get", mockError);
    if (parsed.type === "aborted") {
      expect(parsed.type).toBe("aborted");
      expect(parsed.status).toBe(0);
      expectTypeOf(parsed).toEqualTypeOf<
        AbortedError & { rawError: unknown }
      >();
    }
  });

  it("handles client-side exception", () => {
    const mockError = new Error("Something broke");
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
    vi.mocked(axios.isCancel).mockReturnValue(false);

    const parsed = parser("get", mockError);
    if (parsed.type === "client_exception") {
      expect(parsed.type).toBe("client_exception");
      expect(parsed.status).toBe(-1);
      expect(parsed.rawError).toBe(mockError);
      expectTypeOf(parsed).toEqualTypeOf<
        ClientExceptionError & { rawError: unknown }
      >();
    }
  });

  it("handles custom validation error", () => {
    const mockError = new ValidationException([
      { path: ["id"], message: "Something broke" },
    ]);
    vi.mocked(axios.isAxiosError).mockReturnValue(false);
    vi.mocked(axios.isCancel).mockReturnValue(false);

    const parsed = parser("get", mockError);
    if (parsed.type === "validation_error") {
      expect(parsed.type).toBe("validation_error");
      expect(parsed.status).toBe(-1);
      expect(parsed.meta.issues).toEqual([
        { path: ["id"], message: "Something broke" },
      ]);
      expect(parsed.rawError).toBe(mockError);
      expectTypeOf(parsed).toEqualTypeOf<
        ValidationError & { rawError: unknown }
      >();
    }
  });
});
