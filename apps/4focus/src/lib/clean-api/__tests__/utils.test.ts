import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { ErrorVariant } from "..";
import { cleanAPI, contract } from "..";
import axios from "axios";
import type { AxiosError } from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

type TestContracts = {
  getUser: {
    dto: { id: number; name: string };
    error: ErrorVariant<"error", 500>;
    pathParams: { id: string };
  };
  updateUser: {
    dto: { success: boolean };
    error: ErrorVariant<"error", 500>;
    pathParams: { id: string; second: string };
  };
  getUsers: {
    dto: { id: number; name: string }[];
    error: ErrorVariant<"error", 500>;
    searchParams: { limit: number };
  };
  createUser: {
    dto: { id: number; name: string };
    error: ErrorVariant<"validation_error", 400, { fields: string[] }>;
    payload: { name: string };
  };
  noInput: {
    dto: { success: boolean };
    error: ErrorVariant<"error", 500>;
  };
  errorWithRequiredMeta: {
    dto: { success: boolean };
    error: ErrorVariant<"meta_required", 400, { reason: string }>;
  };
};

const testConfig = contract<TestContracts>()({
  getUser: { method: "get", path: "/users/:id" },
  updateUser: { method: "get", path: "/users/:id/:second" },
  getUsers: { method: "get", path: "/users" },
  createUser: { method: "post", path: "/users" },
  noInput: { method: "get", path: "/health" },
  errorWithRequiredMeta: { method: "get", path: "/error-with-meta" },
});

const api = cleanAPI<TestContracts>()(testConfig);

describe("utils works when", () => {
  describe("pathParams", () => {
    it("returns and infers the correct type", () => {
      const pathParams = { id: "1" };
      const result = api.pathParams("getUser", pathParams);

      expect(result).toBe(pathParams);
      expectTypeOf(result).toEqualTypeOf<{ id: string }>();
    });

    it("returns and infers the correct type for two params", () => {
      const pathParams = { id: "1", second: "2" };
      const result = api.pathParams("updateUser", pathParams);

      expect(result).toBe(pathParams);
      expectTypeOf(result).toEqualTypeOf<{ id: string; second: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - 'createUser' does not have 'pathParams'.
      api.pathParams("createUser", {});

      // @ts-expect-error - pathParams for 'getUser' has the wrong shape (id should be string).
      api.pathParams("getUser", { id: 123 });

      // @ts-expect-error - pathParams for 'updateUser' has the wrong shape (id should be string).
      api.pathParams("updateUser", { id: 123, second: "2" });

      // @ts-expect-error - pathParams for 'updateUser' is missing 'second' property.
      api.pathParams("updateUser", { id: "1" });
    });

    it("fails type-checking for noInput endpoint", () => {
      // @ts-expect-error - 'noInput' does not have 'pathParams'.
      api.pathParams("noInput", {});
    });
  });

  describe("payload", () => {
    it("returns and infers the correct type", () => {
      const payload = { name: "Test" };
      const result = api.payload("createUser", payload);

      expect(result).toBe(payload);
      expectTypeOf(result).toEqualTypeOf<{ name: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - 'getUsers' does not have 'payload'.
      api.payload("getUsers", {});

      // @ts-expect-error - 'getUser' does not have 'payload'.
      api.payload("getUser", {});

      // @ts-expect-error - Payload for 'createUser' has the wrong shape.
      api.payload("createUser", { name: 123 });

      // @ts-expect-error - Payload for 'createUser' is missing 'name' property.
      api.payload("createUser", {});
    });

    it("fails type-checking for noInput endpoint", () => {
      // @ts-expect-error - 'noInput' does not have 'payload'.
      api.payload("noInput", {});
    });
  });

  describe("searchParams", () => {
    it("returns and infers the correct type", () => {
      const searchParams = { limit: 10 };
      const result = api.searchParams("getUsers", searchParams);

      expect(result).toBe(searchParams);
      expectTypeOf(result).toEqualTypeOf<{ limit: number }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - 'createUser' does not have 'searchParams'.
      api.searchParams("createUser", {});

      // @ts-expect-error - 'getUser' does not have 'searchParams'.
      api.searchParams("getUser", {});

      // @ts-expect-error - searchParams for 'getUsers' has the wrong shape.
      api.searchParams("getUsers", { limit: "10" });

      // @ts-expect-error - searchParams for 'getUsers' is missing 'limit' property.
      api.searchParams("getUsers", {});
    });

    it("fails type-checking for noInput endpoint", () => {
      // @ts-expect-error - 'noInput' does not have 'searchParams'.
      api.searchParams("noInput", {});
    });
  });

  describe("dto", () => {
    it("returns and infers the correct type", () => {
      const dto = { id: 1, name: "Test" };
      const result = api.dto("createUser", dto);

      expect(result).toBe(dto);
      expectTypeOf(result).toEqualTypeOf<{ id: number; name: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - Incorrect DTO shape for `createUser`
      api.dto("createUser", { id: "1", name: "test" });

      // @ts-expect-error - Incorrect DTO shape for `getUsers`
      api.dto("getUsers", { id: 1, name: "test" });

      const usersDto = [{ id: 1, name: "Test" }];
      const usersResult = api.dto("getUsers", usersDto);
      expect(usersResult).toBe(usersDto);
      expectTypeOf(usersResult).toEqualTypeOf<{ id: number; name: string }[]>();
    });

    it("handles noInput endpoint correctly", () => {
      const noInputDto = { success: true };
      const result = api.dto("noInput", noInputDto);
      expect(result).toBe(noInputDto);
      expectTypeOf(result).toEqualTypeOf<{ success: boolean }>();
    });
  });

  describe("error", () => {
    it("returns and infers the correct type", () => {
      const error: TestContracts["createUser"]["error"] = {
        type: "validation_error",
        status: 400,
        message: "Invalid input",
        meta: { fields: ["name"] },
      };
      const result = api.error("createUser", error);

      expect(result).toBe(error);
      expectTypeOf(result).toEqualTypeOf<
        ErrorVariant<"validation_error", 400, { fields: string[] }>
      >();
    });

    it("fails type-checking for incorrect usage", () => {
      const err1 = api.error("createUser", {
        // @ts-expect-error - 'error' is not a valid error type for `createUser`
        type: "error",
        // @ts-expect-error - 'error' is not a valid error type for `createUser`
        status: 500,
        message: "Server error",
      });

      expectTypeOf(err1).toEqualTypeOf<{
        type: "validation_error";
        status: 400;
        message: string;
        meta: { fields: string[] };
      }>();

      const invalidMetaError = {
        type: "validation_error",
        status: 400,
        message: "Invalid input",
        meta: { fields: [123] },
      };
      // @ts-expect-error - `meta` property has the wrong shape
      const err2 = api.error("createUser", invalidMetaError);

      expectTypeOf(err2).toEqualTypeOf<{
        type: "validation_error";
        status: 400;
        message: string;
        meta: { fields: string[] };
      }>();
    });

    it("handles meta property correctly", () => {
      // Correctly typed with required meta
      const err1 = api.error("errorWithRequiredMeta", {
        type: "meta_required",
        status: 400,
        message: "This needs meta",
        meta: { reason: "test" },
      });
      expectTypeOf(err1).toEqualTypeOf<{
        type: "meta_required";
        status: 400;
        message: string;
        meta: { reason: string };
      }>();

      // @ts-expect-error - Missing `meta` property when it is required
      api.error("errorWithRequiredMeta", {
        type: "meta_required",
        status: 400,
        message: "This needs meta",
      });

      // Allows to pass additional properties if meta not defined
      const err3 = api.error("noInput", {
        type: "error",
        status: 500,
        message: "No meta here",
        meta: { can: "be-anything" },
      });
      expect(err3.meta).toEqual({ can: "be-anything" });
    });

    it("handles noInput endpoint correctly", () => {
      const noInputError: TestContracts["noInput"]["error"] = {
        type: "error",
        status: 500,
        message: "Server error",
      };
      const result = api.error("noInput", noInputError);
      expect(result).toBe(noInputError);
      expectTypeOf(result).toEqualTypeOf<ErrorVariant<"error", 500>>();
    });
  });
  describe("parseError", () => {
    it("handles server errors correctly", () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: "error",
          data: { message: "Server Error" },
        },
      } as AxiosError;

      const parsedError = api.parseError("getUser", serverError);
      expect(parsedError.type).toBe("error");
      expect(parsedError.status).toBe(500);
      expect(parsedError.message).toBe("Server Error");
    });

    it("handles network errors correctly", () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const networkError = {
        isAxiosError: true,
        request: {},
      } as AxiosError;
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

      const parsedError = api.parseError("getUser", networkError);
      expect(parsedError.type).toBe("no_internet");
      expect(parsedError.status).toBe(-2);
    });

    it("handles client exceptions correctly", () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      const exception = new Error("Something went wrong");
      const parsedError = api.parseError("getUser", exception);

      expect(parsedError.type).toBe("client_exception");
      expect(parsedError.status).toBe(-1);
    });

    it("handles unsupported server response", () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const serverError = {
        isAxiosError: true,
        response: {
          status: 500,
          statusText: "error",
          data: { unsupported: "format" },
        },
      } as AxiosError;

      const parsedError = api.parseError("getUser", serverError);
      expect(parsedError.type).toBe("unsupported_server_response");
      expect(parsedError.status).toBe(-5);
    });

    it("handles no server response correctly", () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const noResponseError = {
        isAxiosError: true,
        request: {},
      } as AxiosError;
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);

      const parsedError = api.parseError("getUser", noResponseError);
      expect(parsedError.type).toBe("no_server_response");
      expect(parsedError.status).toBe(-3);
    });

    it("handles configuration issues correctly", () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const configError = {
        isAxiosError: true,
      } as AxiosError;

      const parsedError = api.parseError("getUser", configError);
      expect(parsedError.type).toBe("configuration_issue");
      expect(parsedError.status).toBe(-4);
    });

    it("handles aborted requests correctly", () => {
      mockedAxios.isAxiosError.mockReturnValue(false);
      mockedAxios.isCancel.mockReturnValue(true);
      const abortedError = {};

      const parsedError = api.parseError("getUser", abortedError);
      expect(parsedError.type).toBe("aborted");
      expect(parsedError.status).toBe(0);
    });
  });
});
