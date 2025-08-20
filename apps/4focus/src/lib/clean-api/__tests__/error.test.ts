import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import type { ErrorVariant } from "..";
import { cleanAPI, contract } from "..";
import axios from "axios";
import type { AxiosError } from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const { isAxiosError, isCancel } = await vi.importActual("axios");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isAxiosError.mockImplementation(isAxiosError as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isCancel.mockImplementation(isCancel as any);

describe("error handling", () => {
  type Contracts = {
    simpleError: {
      dto: boolean;
      error: ErrorVariant<"simple_error", 500>;
    };
    errorWithMeta: {
      dto: boolean;
      error: ErrorVariant<"meta_error", 400, { reason: string }>;
    };
  };

  const testContract = contract<Contracts>()({
    simpleError: { method: "get", path: "/simple-error" },
    errorWithMeta: { method: "get", path: "/error-with-meta" },
  });

  const api = cleanAPI<Contracts>()(testContract);

  describe("error() helper", () => {
    it("returns and infers the correct type", () => {
      const error: Contracts["errorWithMeta"]["error"] = {
        type: "meta_error",
        status: 400,
        message: "Invalid input",
        meta: { reason: "test" },
      };
      const result = api.error("errorWithMeta", error);

      expect(result).toEqual(error);
      expectTypeOf(result).toEqualTypeOf<
        ErrorVariant<"meta_error", 400, { reason: string }>
      >();
    });

    it("fails type-checking for incorrect usage", () => {
      api.error("simpleError", {
        // @ts-expect-error - 'wrong_type' is not a valid error type
        type: "wrong_type",
        status: 500,
        message: "Server error",
      });

      api.error("errorWithMeta", {
        type: "meta_error",
        status: 400,
        message: "Invalid input",
        // @ts-expect-error - `meta` property has the wrong shape
        meta: { wrong: "key" },
      });

      // @ts-expect-error - Missing `meta` property
      api.error("errorWithMeta", {
        type: "meta_error",
        status: 400,
        message: "This needs meta",
      });
    });
  });

  describe("parseError() (via safeCall)", () => {
    beforeEach(() => {
      vi.clearAllMocks();
      // Restore isCancel in case a test overrides it
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockedAxios.isCancel.mockImplementation(isCancel as any);
    });

    it("handles server errors with contract-defined shape", async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          data: { message: "Internal Server Error" },
          status: 500,
          statusText: "simple_error",
        },
      } as AxiosError;

      mockedAxios.get.mockRejectedValue(errorResponse);
      const [isSuccess, data] = await api.safeCall("simpleError");

      expect(isSuccess).toBe(false);
      if (isSuccess) return;

      expect(data.type).toBe("simple_error");
      expect(data.status).toBe(500);
      expect(data.message).toBe("Internal Server Error");
    });

    it("handles server errors with metadata", async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          data: { message: "Bad Request", meta: { reason: "validation" } },
          status: 400,
          statusText: "meta_error",
        },
      } as AxiosError;
      mockedAxios.get.mockRejectedValue(errorResponse);

      const [isSuccess, data] = await api.safeCall("errorWithMeta");
      expect(isSuccess).toBe(false);
      if (isSuccess) return;

      expect(data.type).toBe("meta_error");
      expect(data.status).toBe(400);
      if (data.type === "meta_error") {
        expect(data.meta).toEqual({ reason: "validation" });
      }
    });

    it("handles unsupported server responses", async () => {
      const errorResponse = {
        isAxiosError: true,
        response: {
          data: "Unexpected error format", // Not an object with 'message'
          status: 503,
        },
      } as AxiosError;
      mockedAxios.get.mockRejectedValue(errorResponse);

      const [isSuccess, data] = await api.safeCall("simpleError");
      expect(isSuccess).toBe(false);
      if (isSuccess) return;

      expect(data.type).toBe("unsupported_server_response");
      expect(data.status).toBe(-5);
      if (data.type === "unsupported_server_response") {
        expect(data.meta.originalStatus).toBe(503);
        expect(data.meta.originalResponse).toBe("Unexpected error format");
      }
    });

    it("handles network errors when navigator is online (no server response)", async () => {
      const errorResponse = {
        isAxiosError: true,
        request: {}, // Indicates request was made but no response received
      } as AxiosError;
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(errorResponse);

      const [isSuccess, data] = await api.safeCall("simpleError");
      expect(isSuccess).toBe(false);
      if (isSuccess) return;
      expect(data.type).toBe("no_server_response");
      expect(data.status).toBe(-3);
    });

    it("handles network errors when navigator is offline (no internet)", async () => {
      const errorResponse = {
        isAxiosError: true,
        request: {},
      } as AxiosError;
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      mockedAxios.get.mockRejectedValue(errorResponse);

      const [isSuccess, data] = await api.safeCall("simpleError");
      expect(isSuccess).toBe(false);
      if (isSuccess) return;
      expect(data.type).toBe("no_internet");
      expect(data.status).toBe(-2);
    });

    it("handles request configuration issues", async () => {
      const errorResponse = {
        isAxiosError: true,
        message: "Something wrong with the request setup",
        // No 'response' or 'request' property
      } as AxiosError;
      mockedAxios.get.mockRejectedValue(errorResponse);

      const [isSuccess, data] = await api.safeCall("simpleError");
      expect(isSuccess).toBe(false);
      if (isSuccess) return;
      expect(data.type).toBe("configuration_issue");
      expect(data.status).toBe(-4);
    });

    it("handles aborted requests", async () => {
      const cancelError = new Error("Request canceled");
      // For this test, we override the restored implementation to simulate a cancel error
      mockedAxios.isCancel.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue(cancelError);

      const [isSuccess, data] = await api.safeCall("simpleError");
      expect(isSuccess).toBe(false);
      if (isSuccess) return;
      expect(data.type).toBe("aborted");
      expect(data.status).toBe(0);
    });

    it("handles generic client exceptions", async () => {
      const exception = new Error("Something went wrong");
      mockedAxios.get.mockRejectedValue(exception);

      const [isSuccess, data] = await api.safeCall("simpleError");
      expect(isSuccess).toBe(false);
      if (isSuccess) return;
      expect(data.type).toBe("client_exception");
      expect(data.status).toBe(-1);
      expect(data.rawError).toBe(exception);
    });
  });
});
