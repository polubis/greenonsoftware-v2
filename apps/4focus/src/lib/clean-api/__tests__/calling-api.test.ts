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
  deleteUser: {
    dto: { success: boolean };
    error: ErrorVariant<"delete_failed", 500>;
    pathParams: { id: string };
  };
  getHealth: {
    dto: { status: "ok" };
    error: ErrorVariant<"service_unavailable", 503>;
  };
};

const testConfig = contract<TestContracts>()({
  getUser: { method: "get", path: "/users/:id" },
  createUser: { method: "post", path: "/users" },
  updateUser: { method: "put", path: "/users/:id" },
  deleteUser: { method: "delete", path: "/users/:id" },
  getHealth: { method: "get", path: "/health" },
});

const api = cleanAPI<TestContracts>()(testConfig);

describe("API calling works when", () => {
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

    it("handles calls with no arguments", async () => {
      const responseData = { status: "ok" };
      mockedAxios.get.mockResolvedValue({ data: responseData });

      const result = await api.call("getHealth");

      expect(mockedAxios.get).toHaveBeenCalledWith("/health", {
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

    it("returns [false, error] on network error", async () => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      mockedAxios.get.mockRejectedValue({
        isAxiosError: true,
        request: {},
      } as AxiosError);
      vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);

      const [isSuccess, result] = await api.safeCall("getHealth");

      expect(isSuccess).toBe(false);

      if (!isSuccess) {
        expect(result.type).toBe("no_internet");
        expect(result.status).toBe(-2);
      }
    });

    it("fails type-checking for invalid arguments", () => {
      // @ts-expect-error - Unexpected arguments for getHealth which takes no arguments
      api.safeCall("getHealth", {});

      // @ts-expect-error - Missing payload for createUser
      api.safeCall("createUser", {});
    });
  });
});
