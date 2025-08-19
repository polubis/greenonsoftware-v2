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
import type { ErrorVariant } from "..";
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
  noInput: {
    dto: { success: boolean };
    error: ErrorVariant<"error", 500>;
  };
};

const testConfig = contract<TestContracts>()({
  getUser: { method: "get", path: "/users/:id" },
  createUser: { method: "post", path: "/users" },
  updateUser: { method: "put", path: "/users/:id" },
  patchUser: { method: "patch", path: "/users/:id" },
  deleteUser: { method: "delete", path: "/users/:id" },
  getHealth: { method: "get", path: "/health" },
  noInput: { method: "get", path: "/no-input" },
});

const api = cleanAPI<TestContracts>()(testConfig);

describe("API calling", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("call", () => {
    it("makes a GET request and returns data", async () => {
      const responseData = { id: 1, name: "Test User" };
      mockedAxios.get.mockResolvedValue({ data: responseData });

      const result = await api.call("getUser", {
        pathParams: { id: "1" },
        searchParams: { version: 2 },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith("/users/1", {
        params: { version: 2 },
      });
      expect(result).toEqual(responseData);
    });

    it("makes a POST request and returns data", async () => {
      const responseData = { id: 2, name: "New User" };
      mockedAxios.post.mockResolvedValue({ data: responseData });

      const result = await api.call("createUser", {
        payload: { name: "New User" },
      });

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/users",
        { name: "New User" },
        { params: undefined },
      );
      expect(result).toEqual(responseData);
    });

    it("makes a PUT request and returns data", async () => {
      const responseData = { id: 1, name: "Updated User" };
      mockedAxios.put.mockResolvedValue({ data: responseData });

      const result = await api.call("updateUser", {
        pathParams: { id: "1" },
        payload: { name: "Updated User" },
      });

      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/users/1",
        { name: "Updated User" },
        { params: undefined },
      );
      expect(result).toEqual(responseData);
    });

    it("makes a PATCH request and returns data", async () => {
      const responseData = { id: 1, name: "Patched User" };
      mockedAxios.patch.mockResolvedValue({ data: responseData });

      const result = await api.call("patchUser", {
        pathParams: { id: "1" },
        payload: { name: "Patched User" },
      });

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/users/1",
        { name: "Patched User" },
        { params: undefined },
      );
      expect(result).toEqual(responseData);
    });

    it("makes a DELETE request and returns data", async () => {
      const responseData = { success: true };
      mockedAxios.delete.mockResolvedValue({ data: responseData });

      const result = await api.call("deleteUser", {
        pathParams: { id: "1" },
      });

      expect(mockedAxios.delete).toHaveBeenCalledWith("/users/1", {
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it("handles calls with no arguments", async () => {
      const responseData = { status: "ok" };
      mockedAxios.get.mockResolvedValue({ data: responseData });

      const result = await api.call("getHealth");

      expect(mockedAxios.get).toHaveBeenCalledWith("/health", {
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it("handles noInput call correctly", async () => {
      const responseData = { success: true };
      mockedAxios.get.mockResolvedValue({ data: responseData });

      const result = await api.call("noInput");

      expect(mockedAxios.get).toHaveBeenCalledWith("/no-input", {
        params: undefined,
      });
      expect(result).toEqual(responseData);
    });

    it("propagates errors on failed requests", async () => {
      const error = new Error("Network Error");
      mockedAxios.get.mockRejectedValue(error);

      await expect(api.call("getHealth")).rejects.toThrow("Network Error");
    });

    it("fails type-checking for invalid arguments", () => {
      const responseData = { id: 2, name: "New User" };
      mockedAxios.get.mockResolvedValue({ data: responseData });

      // @ts-expect-error - Unexpected arguments for getHealth which takes no arguments
      api.call("getHealth", {});

      // @ts-expect-error - Missing pathParams
      api.call("getUser", { searchParams: { version: 1 } });

      // @ts-expect-error - Missing searchParams
      api.call("getUser", {
        pathParams: { id: "1" },
      });

      // @ts-expect-error - Missing all arguments
      api.call("getUser");

      api.call("getUser", {
        pathParams: { id: "1" },
        searchParams: { version: 1 },
      });
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

    it("returns [false, error] on server error", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          statusText: "user_not_found",
          data: { message: "User does not exist" },
        },
      } as AxiosError);

      const [isSuccess, result] = await api.safeCall("getUser", {
        pathParams: { id: "1" },
        searchParams: { version: 1 },
      });

      expect(isSuccess).toBe(false);

      if (!isSuccess) {
        expect(result.type).toBe("user_not_found");
        expect(result.status).toBe(404);
        expectTypeOf(result.rawError).toEqualTypeOf<unknown>();
      }
    });

    it("returns [false, error] on server error with meta", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.post.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 400,
          statusText: "validation_error",
          data: {
            message: "Validation failed",
            meta: { fields: ["name"] },
          },
        },
      } as AxiosError);

      const [isSuccess, result] = await api.safeCall("createUser", {
        payload: { name: "New User" },
      });

      expect(isSuccess).toBe(false);

      if (!isSuccess && result.type === "validation_error") {
        expect(result.meta.fields).toEqual(["name"]);
        expectTypeOf(result.meta).toEqualTypeOf<{ fields: string[] }>();
      }
    });

    it("returns [false, error] on server error without meta", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 404,
          statusText: "user_not_found",
          data: { message: "User does not exist" },
        },
      } as AxiosError);

      const [isSuccess, result] = await api.safeCall("getUser", {
        pathParams: { id: "1" },
        searchParams: { version: 1 },
      });

      expect(isSuccess).toBe(false);

      if (!isSuccess && result.type === "user_not_found") {
        // @ts-expect-error - meta does not exist on this error type
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _ = result.meta;
      }
    });

    it("returns [true, data] on successful PUT request", async () => {
      const responseData = { id: 1, name: "Updated User" };
      mockedAxios.put.mockResolvedValue({ data: responseData });

      const [isSuccess, result] = await api.safeCall("updateUser", {
        pathParams: { id: "1" },
        payload: { name: "Updated User" },
      });

      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/users/1",
        { name: "Updated User" },
        { params: undefined },
      );
      expect(isSuccess).toBe(true);
      if (isSuccess) {
        expect(result).toEqual(responseData);
      }
    });

    it("returns [false, error] on failed PUT request", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.put.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 500,
          statusText: "update_failed",
          data: { message: "Update operation failed" },
        },
      } as AxiosError);

      const [isSuccess, result] = await api.safeCall("updateUser", {
        pathParams: { id: "1" },
        payload: { name: "Updated User" },
      });

      expect(isSuccess).toBe(false);
      if (!isSuccess) {
        expect(result.type).toBe("update_failed");
        expect(result.status).toBe(500);
      }
    });

    it("returns [true, data] on successful PATCH request", async () => {
      const responseData = { id: 1, name: "Patched User" };
      mockedAxios.patch.mockResolvedValue({ data: responseData });

      const [isSuccess, result] = await api.safeCall("patchUser", {
        pathParams: { id: "1" },
        payload: { name: "Patched User" },
      });

      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/users/1",
        { name: "Patched User" },
        { params: undefined },
      );
      expect(isSuccess).toBe(true);
      if (isSuccess) {
        expect(result).toEqual(responseData);
      }
    });

    it("returns [true, data] on successful DELETE request", async () => {
      const responseData = { success: true };
      mockedAxios.delete.mockResolvedValue({ data: responseData });

      const [isSuccess, result] = await api.safeCall("deleteUser", {
        pathParams: { id: "1" },
      });

      expect(mockedAxios.delete).toHaveBeenCalledWith("/users/1", {
        params: undefined,
      });
      expect(isSuccess).toBe(true);
      if (isSuccess) {
        expect(result).toEqual(responseData);
      }
    });

    it("returns [false, error] on failed DELETE request", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.delete.mockRejectedValue({
        isAxiosError: true,
        response: {
          status: 500,
          statusText: "delete_failed",
          data: { message: "Delete operation failed" },
        },
      } as AxiosError);

      const [isSuccess, result] = await api.safeCall("deleteUser", {
        pathParams: { id: "1" },
      });

      expect(isSuccess).toBe(false);
      if (!isSuccess) {
        expect(result.type).toBe("delete_failed");
        expect(result.status).toBe(500);
      }
    });

    it("handles noInput safeCall correctly", async () => {
      const responseData = { success: true };
      mockedAxios.get.mockResolvedValue({ data: responseData });

      const [isSuccess, result] = await api.safeCall("noInput");

      expect(isSuccess).toBe(true);
      if (isSuccess) {
        expect(result).toEqual(responseData);
      }
    });

    it("returns [false, error] on network error for any method", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const networkError = { isAxiosError: true, request: {} } as AxiosError;
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

      mockedAxios.get.mockRejectedValue(networkError);
      mockedAxios.post.mockRejectedValue(networkError);
      mockedAxios.put.mockRejectedValue(networkError);
      mockedAxios.delete.mockRejectedValue(networkError);

      const calls = [
        api.safeCall("getHealth"),
        api.safeCall("createUser", { payload: { name: "test" } }),
        api.safeCall("updateUser", {
          pathParams: { id: "1" },
          payload: { name: "test" },
        }),
        api.safeCall("deleteUser", { pathParams: { id: "1" } }),
      ] as const;

      for (const call of calls) {
        const [isSuccess, result] = await call;
        expect(isSuccess).toBe(false);
        if (!isSuccess) {
          expect(result.type).toBe("no_internet");
          expect(result.status).toBe(-2);
        }
      }
    });

    it("fails type-checking for invalid arguments", () => {
      // @ts-expect-error - Unexpected arguments for getHealth which takes no arguments
      api.safeCall("getHealth", {});

      // @ts-expect-error - Missing payload for createUser
      api.safeCall("createUser", {});

      // @ts-expect-error - Missing pathParams
      api.safeCall("getUser", { searchParams: { version: 1 } });

      // @ts-expect-error - Missing searchParams
      api.safeCall("getUser", { pathParams: { id: "1" } });

      // @ts-expect-error - Missing all arguments
      api.safeCall("getUser");
    });
  });
});
