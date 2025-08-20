import { describe, expect, expectTypeOf, it, vi, beforeEach } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

describe("calls works when", () => {
  type APIContracts = {
    get: {
      dto: { id: number };
      error: ErrorVariant<"not_found", 404>;
      pathParams: { id: string };
      searchParams: { q: string };
    };
    post: {
      dto: { success: boolean };
      error: ErrorVariant<"bad_request", 400>;
      payload: { data: string };
    };
    noInput: {
      dto: { status: string };
      error: never;
    };
  };

  const mockGetResolver = vi.fn();
  const mockPostResolver = vi.fn();
  const mockNoInputResolver = vi.fn();

  const contractWithConfig = init({ url: "https://api.example.com" });
  const api = contractWithConfig<APIContracts>()({
    get: { resolver: mockGetResolver },
    post: { resolver: mockPostResolver },
    noInput: { resolver: mockNoInputResolver },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolver is called with all inputs and config", async () => {
    mockGetResolver.mockResolvedValue({ id: 1 });
    const result = await api.call("get", {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    });

    expect(mockGetResolver).toHaveBeenCalledWith({
      pathParams: { id: "123" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
    });
    expect(result).toEqual({ id: 1 });
    expectTypeOf(result).toEqualTypeOf<{ id: number }>();
  });

  it("handles calls with no input arguments", async () => {
    mockNoInputResolver.mockResolvedValue({ status: "ok" });
    await api.call("noInput");
    expect(mockNoInputResolver).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
    });
  });

  it("rejects when the resolver throws an error", async () => {
    const error = new Error("Something went wrong");
    mockPostResolver.mockRejectedValue(error);
    await expect(
      api.call("post", { payload: { data: "test" } }),
    ).rejects.toThrow("Something went wrong");
  });

  it("returns a success tuple on resolution", async () => {
    mockPostResolver.mockResolvedValue({ success: true });
    const result = await api.safeCall("post", {
      payload: { data: "test" },
    });

    expect(result).toEqual([true, { success: true }]);
    if (result[0]) {
      expectTypeOf(result).toEqualTypeOf<[true, { success: boolean }]>();
    }
  });

  it("returns a failure tuple on rejection with an Error", async () => {
    const error = new Error("Resolver failed");
    mockGetResolver.mockRejectedValue(error);
    const result = await api.safeCall("get", {
      pathParams: { id: "1" },
      searchParams: { q: "error" },
    });

    expect(result[0]).toBe(false);
    expect(result[1]).toBe(error);
    if (!result[0]) {
      expectTypeOf(result).toEqualTypeOf<[false, unknown]>();
    }
  });

  it("returns a failure tuple on rejection with a custom object", async () => {
    const customError = { code: "E_CUSTOM", message: "A custom error" };
    mockNoInputResolver.mockRejectedValue(customError);
    const result = await api.safeCall("noInput");

    expect(result).toEqual([false, customError]);
  });

  it("returns a failure tuple on rejection with a non-object value", async () => {
    const errorString = "just a string error";
    mockPostResolver.mockRejectedValue(errorString);
    const result = await api.safeCall("post", {
      payload: { data: "fail" },
    });
    expect(result).toEqual([false, errorString]);
  });

  it("returns a failure tuple on rejection with null or undefined", async () => {
    mockPostResolver.mockRejectedValue(null);
    const resultNull = await api.safeCall("post", {
      payload: { data: "fail" },
    });
    expect(resultNull).toEqual([false, null]);

    mockPostResolver.mockRejectedValue(undefined);
    const resultUndefined = await api.safeCall("post", {
      payload: { data: "fail" },
    });
    expect(resultUndefined).toEqual([false, undefined]);
  });
});
