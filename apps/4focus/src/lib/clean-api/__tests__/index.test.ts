import type { AxiosError } from "axios";
import axios from "axios";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  expectTypeOf,
  it,
  vi,
} from "vitest";
import type { ErrorVariant, InferInput } from "..";
import { cleanAPI, contract } from "..";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const { isAxiosError, isCancel } = await vi.importActual("axios");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isAxiosError.mockImplementation(isAxiosError as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isCancel.mockImplementation(isCancel as any);

type TestContracts = {
  getUser: {
    dto: { id: number; name: string };
    error: ErrorVariant<"user_not_found", 404>;
    pathParams: { id: string };
    searchParams: { version: number };
  };
  createUser: {
    dto: { id: number; name: string };
    error: ErrorVariant<"validation_error", 400, { fields: string[] }>;
    payload: { name: string };
  };
  updateUser: {
    dto: { id: number; name: string };
    error: ErrorVariant<"update_failed", 500>;
    pathParams: { id: string };
    payload: { name: string };
  };
  patchUser: {
    dto: { id: number; name: string };
    error: ErrorVariant<"patch_failed", 500>;
    pathParams: { id: string };
    payload: { name?: string };
  };
  deleteUser: {
    dto: { success: boolean };
    error: ErrorVariant<"delete_failed", 500>;
    pathParams: { id: string };
  };
  getHealth: {
    dto: { status: "ok" };
    error: ErrorVariant<"service_unavailable", 503>;
  };
  justPayload: {
    dto: { success: boolean };
    error: ErrorVariant<"error", 500>;
    payload: { data: string };
  };
};

const testConfig = contract<TestContracts>()({
  getUser: { method: "get", path: "/users/:id" },
  createUser: { method: "post", path: "/users" },
  updateUser: { method: "put", path: "/users/:id" },
  patchUser: { method: "patch", path: "/users/:id" },
  deleteUser: { method: "delete", path: "/users/:id" },
  getHealth: { method: "get", path: "/health" },
  justPayload: { method: "post", path: "/payload" },
});

const api = cleanAPI<TestContracts>()(testConfig, {
  headers: { "X-Test-Header": "base" },
});

describe("cleanAPI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // @ts-expect-error - Resetting navigator.onLine for tests
    delete global.navigator;
    global.navigator = { onLine: true } as Navigator;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Type Safety and Contract Validation", () => {
    it("enforces correct input types with InferInput", () => {
      type CreateUserInput = InferInput<
        TestContracts,
        TestContracts["createUser"]
      >;
      const l: CreateUserInput = {
        payload: { name: "1" },
      };
      expectTypeOf(l).toEqualTypeOf<{
        payload: { name: string };
      }>();

      type HealthInput = InferInput<TestContracts, TestContracts["getHealth"]>;
      expectTypeOf(undefined as HealthInput).toEqualTypeOf<unknown>();
    });

    it("fails type checking for invalid paths", () => {
      contract<TestContracts>()({
        ...testConfig,
        // @ts-expect-error - Path must start with '/'
        getHealth: { method: "get", path: "health" },
      });
      contract<TestContracts>()({
        ...testConfig,
        // @ts-expect-error - Path has extra param :extra not in contract
        getUser: { method: "get", path: "/users/:id/:extra" },
      });
      contract<TestContracts>()({
        ...testConfig,
        // @ts-expect-error - Path is missing param :id from contract
        getUser: { method: "get", path: "/users" },
      });
      contract<{ noParams: { dto: boolean; error: ErrorVariant<"", 0> } }>()({
        // @ts-expect-error - Contract is missing pathParams for dynamic path
        noParams: { method: "get", path: "/:id" },
      });
    });

    it("accepts valid contract configurations", () => {
      const validConfig = contract<{
        staticPath: { dto: boolean; error: ErrorVariant<"", 0> };
        withParams: {
          dto: boolean;
          error: ErrorVariant<"", 0>;
          pathParams: { id: string };
        };
      }>()({
        staticPath: { method: "get", path: "/static" },
        withParams: { method: "get", path: "/test/:id" },
      });
      expect(validConfig).toBeDefined();
    });
  });

  describe("call", () => {
    it("makes a GET request with correct path, search params, and headers", async () => {
      const responseData = { id: 1, name: "Test User" };
      mockedAxios.get.mockResolvedValue({ data: responseData });

      const result = await api.call("getUser", {
        pathParams: { id: "1" },
        searchParams: { version: 2 },
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toHaveBeenCalledWith("/users/1", {
        headers: { "X-Test-Header": "base" },
        params: { version: 2 },
      });
      expect(result).toEqual(responseData);
    });

    it("makes a POST request with the correct payload", async () => {
      const responseData = { id: 2, name: "New User" };
      mockedAxios.post.mockResolvedValue({ data: responseData });

      const result = await api.call("createUser", {
        payload: { name: "New User" },
      });

      expect(mockedAxios.post).toHaveBeenCalledTimes(1);
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/users",
        { name: "New User" },
        { headers: { "X-Test-Header": "base" } },
      );
      expect(result).toEqual(responseData);
    });

    it("makes a PUT request", async () => {
      const responseData = { id: 1, name: "Updated User" };
      mockedAxios.put.mockResolvedValue({ data: responseData });
      const result = await api.call("updateUser", {
        pathParams: { id: "1" },
        payload: { name: "Updated User" },
      });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/users/1",
        { name: "Updated User" },
        expect.any(Object),
      );
      expect(result).toEqual(responseData);
    });

    it("makes a PATCH request", async () => {
      const responseData = { id: 1, name: "Patched User" };
      mockedAxios.patch.mockResolvedValue({ data: responseData });
      const result = await api.call("patchUser", {
        pathParams: { id: "1" },
        payload: { name: "Patched User" },
      });
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/users/1",
        { name: "Patched User" },
        expect.any(Object),
      );
      expect(result).toEqual(responseData);
    });

    it("makes a DELETE request", async () => {
      const responseData = { success: true };
      mockedAxios.delete.mockResolvedValue({ data: responseData });
      const result = await api.call("deleteUser", { pathParams: { id: "1" } });
      expect(mockedAxios.delete).toHaveBeenCalledWith(
        "/users/1",
        expect.any(Object),
      );
      expect(result).toEqual(responseData);
    });

    it("handles calls with no arguments", async () => {
      const responseData = { status: "ok" };
      mockedAxios.get.mockResolvedValue({ data: responseData });
      const result = await api.call("getHealth");
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/health",
        expect.any(Object),
      );
      expect(result).toEqual(responseData);
    });
  });

  describe("parseError", () => {
    it("parses a server error with a valid error contract", () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 400,
          statusText: "validation_error",
          data: { message: "Invalid name field", meta: { fields: ["name"] } },
        },
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const parsed = api.parseError("createUser", axiosError);

      expect(parsed.type).toBe("validation_error");
      expect(parsed.status).toBe(400);
      expect(parsed.message).toBe("Invalid name field");
      // @ts-expect-error - Testing type safety
      expect(parsed.meta).toEqual({ fields: ["name"] });
      expect(parsed.rawError).toBe(axiosError);
    });

    it("parses an unsupported server response", () => {
      const axiosError = {
        isAxiosError: true,
        response: { status: 500, data: { error: "Internal Error" } },
      } as unknown as AxiosError;

      mockedAxios.isAxiosError.mockReturnValue(true);
      const parsed = api.parseError("getHealth", axiosError);

      expect(parsed.type).toBe("unsupported_server_response");
      expect(parsed.status).toBe(-5);
      expect(parsed.message).toBe(
        "The server's error response format is unsupported.",
      );
      // @ts-expect-error - Testing type safety
      expect(parsed.meta).toEqual({
        originalStatus: 500,
        originalResponse: { error: "Internal Error" },
      });
    });

    it('parses a "no internet" error', () => {
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
      const axiosError = {
        isAxiosError: true,
        request: {},
      } as unknown as AxiosError;
      mockedAxios.isAxiosError.mockReturnValue(true);
      const parsed = api.parseError("getHealth", axiosError);
      expect(parsed.type).toBe("no_internet");
      expect(parsed.status).toBe(-2);
    });

    it('parses a "no server response" error', () => {
      const axiosError = {
        isAxiosError: true,
        request: {},
      } as unknown as AxiosError;
      mockedAxios.isAxiosError.mockReturnValue(true);
      const parsed = api.parseError("getHealth", axiosError);
      expect(parsed.type).toBe("no_server_response");
      expect(parsed.status).toBe(-3);
    });

    it('parses a "configuration issue" error', () => {
      const axiosError = {
        isAxiosError: true,
        message: "Config error",
      } as unknown as AxiosError;
      mockedAxios.isAxiosError.mockReturnValue(true);
      const parsed = api.parseError("getHealth", axiosError);
      expect(parsed.type).toBe("configuration_issue");
      expect(parsed.status).toBe(-4);
    });

    it("parses a request cancellation", () => {
      const cancelError = new axios.Cancel("Request aborted by user");
      mockedAxios.isCancel.mockReturnValue(true);

      const parsed = api.parseError("getUser", cancelError);

      expect(mockedAxios.isCancel).toHaveBeenCalledWith(cancelError);
      expect(parsed.type).toBe("aborted");
      expect(parsed.status).toBe(0);
      expect(parsed.rawError).toBe(cancelError);
    });

    it("parses a generic client exception", () => {
      const error = new Error("Something broke");
      mockedAxios.isAxiosError.mockReturnValue(false);
      const parsed = api.parseError("getUser", error);

      expect(parsed.type).toBe("client_exception");
      expect(parsed.status).toBe(-1);
      expect(parsed.rawError).toBe(error);
    });
  });

  describe("safeCall", () => {
    it("returns [true, data] on success", async () => {
      const responseData = { id: 1, name: "Test User" };
      mockedAxios.get.mockResolvedValue({ data: responseData });

      const [isSuccess, result] = await api.safeCall("getUser", {
        pathParams: { id: "1" },
        searchParams: { version: 1 },
      });

      expect(isSuccess).toBe(true);
      if (isSuccess) {
        expect(result).toEqual(responseData);
        expectTypeOf(result).toEqualTypeOf<{ id: number; name: string }>();
      }
    });

    it("returns [false, error] on failure", async () => {
      const axiosError = {
        isAxiosError: true,
        response: {
          status: 404,
          statusText: "user_not_found",
          data: { message: "User does not exist" },
        },
      } as unknown as AxiosError;
      mockedAxios.get.mockRejectedValue(axiosError);

      mockedAxios.isAxiosError.mockReturnValue(true);
      const [isSuccess, result] = await api.safeCall("getUser", {
        pathParams: { id: "1" },
        searchParams: { version: 1 },
      });

      expect(isSuccess).toBe(false);
      if (!isSuccess) {
        expect(result.status).toBe(404);
        expect(result.type).toBe("user_not_found");
        expect(result.message).toBe("User does not exist");
        expectTypeOf(result)
          .exclude<TestContracts["getUser"]["dto"]>()
          .toBeObject();
      }
    });
  });

  describe("Helper Functions", () => {
    it("returns input for pathParams and infers correct type", () => {
      const params = { id: "123" };
      const result = api.pathParams("getUser", params);
      expect(result).toBe(params);
      expectTypeOf(result).toEqualTypeOf<{ id: string }>();
    });

    it("returns input for searchParams and infers correct type", () => {
      const params = { version: 1 };
      const result = api.searchParams("getUser", params);
      expect(result).toBe(params);
      expectTypeOf(result).toEqualTypeOf<{ version: number }>();
    });

    it("returns input for payload and infers correct type", () => {
      const p = { name: "test" };
      const result = api.payload("createUser", p);
      expect(result).toBe(p);
      expectTypeOf(result).toEqualTypeOf<{ name: string }>();
    });

    it("returns input for dto and infers correct type", () => {
      const d = { id: 1, name: "test" };
      const result = api.dto("createUser", d);
      expect(result).toBe(d);
      expectTypeOf(result).toEqualTypeOf<{ id: number; name: string }>();
    });

    it("returns input for error and infers correct type", () => {
      const e: TestContracts["createUser"]["error"] = {
        type: "validation_error",
        status: 400,
        message: "",
        meta: { fields: ["name"] },
      };
      const result = api.error("createUser", e);
      expect(result).toBe(e);
      expectTypeOf(result).toEqualTypeOf<
        TestContracts["createUser"]["error"]
      >();
    });
  });
});
