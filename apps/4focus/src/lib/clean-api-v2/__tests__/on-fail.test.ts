import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

describe("onFail works when", () => {
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

  // API with config
  const apiWithConfig = init({
    url: "https://api.example.com",
  })<APIContracts>()({
    get: { resolver: mockGetResolver },
    post: { resolver: mockPostResolver },
    noInput: { resolver: mockNoInputResolver },
  });

  const apiWithoutConfig = init()<APIContracts>()({
    get: { resolver: mockGetResolver },
    post: { resolver: mockPostResolver },
    noInput: { resolver: mockNoInputResolver },
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("a single callback is called with correct arguments, config, and error", async () => {
    const onFailCallback = vi.fn();
    apiWithConfig.onFail("get", onFailCallback);

    const error = new Error("Network error");
    mockGetResolver.mockRejectedValue(error);
    const callArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };

    await expect(apiWithConfig.call("get", callArgs)).rejects.toThrow(
      "Network error",
    );

    expect(onFailCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).toHaveBeenCalledWith({
      ...callArgs,
      config: { url: "https://api.example.com" },
      error: error,
    });

    // Type assertion
    apiWithConfig.onFail("get", (input) => {
      expectTypeOf(input.config).toEqualTypeOf<{
        url: string;
      }>();
      expectTypeOf(input.pathParams).toEqualTypeOf<{
        id: string;
      }>();
      expectTypeOf(input.searchParams).toEqualTypeOf<{
        q: string;
      }>();
      expectTypeOf(input.error).toEqualTypeOf<unknown>();
    });
  });

  it("a single callback is called with correct arguments and error when no config", async () => {
    const onFailCallback = vi.fn();
    apiWithoutConfig.onFail("get", onFailCallback);

    const error = new Error("Network error");
    mockGetResolver.mockRejectedValue(error);
    const callArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };

    await expect(apiWithoutConfig.call("get", callArgs)).rejects.toThrow(
      "Network error",
    );

    expect(onFailCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).toHaveBeenCalledWith({
      ...callArgs,
      error: error,
    });

    // Type assertion
    apiWithoutConfig.onFail("get", (input) => {
      expectTypeOf(input).toHaveProperty("pathParams");
      expectTypeOf(input).toHaveProperty("searchParams");
      expectTypeOf(input).toHaveProperty("error");
      expectTypeOf(input).not.toHaveProperty("config");
      expectTypeOf(input.error).toEqualTypeOf<unknown>();
    });
  });

  it("multiple callbacks are called with correct error", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    apiWithConfig.onFail("get", callback1);
    apiWithConfig.onFail("get", callback2);

    const error = new Error("Network error");
    mockGetResolver.mockRejectedValue(error);
    const callArgs = {
      pathParams: { id: "456" },
      searchParams: { q: "multi" },
    };

    await expect(apiWithConfig.call("get", callArgs)).rejects.toThrow(
      "Network error",
    );

    const expectedPayload = {
      ...callArgs,
      config: { url: "https://api.example.com" },
      error: error,
    };
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledWith(expectedPayload);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith(expectedPayload);
  });

  it("unsubscribing a callback prevents it from being called", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const unsubscribe = apiWithConfig.onFail("post", callback1);
    apiWithConfig.onFail("post", callback2);

    unsubscribe();

    const error = new Error("Server error");
    mockPostResolver.mockRejectedValue(error);

    await expect(
      apiWithConfig.call("post", { payload: { data: "test" } }),
    ).rejects.toThrow("Server error");

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith({
      payload: { data: "test" },
      config: { url: "https://api.example.com" },
      error: error,
    });
  });

  it("callback is called for an api call with no input", async () => {
    const onFailCallback = vi.fn();
    apiWithConfig.onFail("noInput", onFailCallback);

    const error = new Error("Service unavailable");
    mockNoInputResolver.mockRejectedValue(error);

    await expect(apiWithConfig.call("noInput")).rejects.toThrow(
      "Service unavailable",
    );

    expect(onFailCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
      error: error,
    });

    // Type assertion
    apiWithConfig.onFail("noInput", (input) => {
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input).not.toHaveProperty("searchParams");
      expectTypeOf(input).not.toHaveProperty("payload");
      expectTypeOf(input).toHaveProperty("config");
      expectTypeOf(input).toHaveProperty("error");
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
      expectTypeOf(input.error).toEqualTypeOf<unknown>();
    });
  });

  it("callbacks are only triggered for their specific endpoint", async () => {
    const onFailCallbackForGet = vi.fn();
    const onFailCallbackForPost = vi.fn();

    // Register callbacks for different endpoints
    apiWithConfig.onFail("get", onFailCallbackForGet);
    apiWithConfig.onFail("post", onFailCallbackForPost);

    // Call the 'post' endpoint with error
    const postError = new Error("Post failed");
    mockPostResolver.mockRejectedValue(postError);
    const postCallArgs = { payload: { data: "test-data" } };

    await expect(apiWithConfig.call("post", postCallArgs)).rejects.toThrow(
      "Post failed",
    );

    // Only the 'post' callback should be triggered
    expect(onFailCallbackForPost).toHaveBeenCalledTimes(1);
    expect(onFailCallbackForPost).toHaveBeenCalledWith({
      ...postCallArgs,
      config: { url: "https://api.example.com" },
      error: postError,
    });

    // The 'get' callback should NOT be triggered
    expect(onFailCallbackForGet).not.toHaveBeenCalled();

    // Now call the 'get' endpoint with error
    const getError = new Error("Get failed");
    mockGetResolver.mockRejectedValue(getError);
    const getCallArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };

    await expect(apiWithConfig.call("get", getCallArgs)).rejects.toThrow(
      "Get failed",
    );

    // Now the 'get' callback should be triggered
    expect(onFailCallbackForGet).toHaveBeenCalledTimes(1);
    expect(onFailCallbackForGet).toHaveBeenCalledWith({
      ...getCallArgs,
      config: { url: "https://api.example.com" },
      error: getError,
    });

    // The 'post' callback should still only have been called once
    expect(onFailCallbackForPost).toHaveBeenCalledTimes(1);
  });

  it("callback registered for one endpoint is NOT called for another", async () => {
    const onFailCallbackForGet = vi.fn();
    apiWithConfig.onFail("get", onFailCallbackForGet);

    const postError = new Error("Post failed");
    mockPostResolver.mockRejectedValue(postError);
    const postCallArgs = { payload: { data: "cross-call" } };

    await expect(apiWithConfig.call("post", postCallArgs)).rejects.toThrow(
      "Post failed",
    );

    // The callback for 'get' should NOT be called when 'post' fails
    expect(onFailCallbackForGet).not.toHaveBeenCalled();
  });

  it("multiple endpoints with separate callbacks are properly isolated", async () => {
    const getCallback = vi.fn();
    const postCallback = vi.fn();
    const noInputCallback = vi.fn();

    // Register different callbacks for each endpoint
    apiWithConfig.onFail("get", getCallback);
    apiWithConfig.onFail("post", postCallback);
    apiWithConfig.onFail("noInput", noInputCallback);

    // Call each endpoint in sequence with errors
    const getError = new Error("Get error");
    mockGetResolver.mockRejectedValue(getError);
    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Get error");

    const postError = new Error("Post error");
    mockPostResolver.mockRejectedValue(postError);
    await expect(
      apiWithConfig.call("post", { payload: { data: "test" } }),
    ).rejects.toThrow("Post error");

    const noInputError = new Error("NoInput error");
    mockNoInputResolver.mockRejectedValue(noInputError);
    await expect(apiWithConfig.call("noInput")).rejects.toThrow(
      "NoInput error",
    );

    // Each callback should only be called once for its respective endpoint
    expect(getCallback).toHaveBeenCalledTimes(1);
    expect(postCallback).toHaveBeenCalledTimes(1);
    expect(noInputCallback).toHaveBeenCalledTimes(1);

    // Verify the arguments passed to each callback
    expect(getCallback).toHaveBeenCalledWith({
      pathParams: { id: "123" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      error: getError,
    });

    expect(postCallback).toHaveBeenCalledWith({
      payload: { data: "test" },
      config: { url: "https://api.example.com" },
      error: postError,
    });

    expect(noInputCallback).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
      error: noInputError,
    });
  });

  it("callback passed to onFail has correct TS types inferred", () => {
    apiWithConfig.onFail("get", (input) => {
      expectTypeOf(input.pathParams).toEqualTypeOf<{ id: string }>();
      expectTypeOf(input.searchParams).toEqualTypeOf<{ q: string }>();
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
      expectTypeOf(input.error).toEqualTypeOf<unknown>();
    });
    apiWithConfig.onFail("post", (input) => {
      expectTypeOf(input.payload).toEqualTypeOf<{ data: string }>();
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
      expectTypeOf(input.error).toEqualTypeOf<unknown>();
    });
    apiWithConfig.onFail("noInput", (input) => {
      expectTypeOf(input).not.toHaveProperty("payload");
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input).toHaveProperty("config");
      expectTypeOf(input).toHaveProperty("error");
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
      expectTypeOf(input.error).toEqualTypeOf<unknown>();
    });

    apiWithoutConfig.onFail("get", (input) => {
      expectTypeOf(input).not.toHaveProperty("config");
      expectTypeOf(input.error).toEqualTypeOf<unknown>();
    });
  });

  it("is called when resolver throws an error", async () => {
    const onFailCallback = vi.fn();
    const onCallCallback = vi.fn();
    const onOkCallback = vi.fn();

    apiWithConfig.onFail("get", onFailCallback);
    apiWithConfig.onCall("get", onCallCallback);
    apiWithConfig.onOk("get", onOkCallback);

    const error = new Error("Resolver failed");
    mockGetResolver.mockRejectedValue(error);

    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Resolver failed");

    // onCall should have been called before the resolver
    expect(onCallCallback).toHaveBeenCalledTimes(1);

    // onFail should have been called since the resolver failed
    expect(onFailCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).toHaveBeenCalledWith({
      pathParams: { id: "123" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      error: error,
    });

    // onOk should NOT have been called since the resolver failed
    expect(onOkCallback).not.toHaveBeenCalled();
  });

  it("is called AFTER onCall but NOT after onOk", async () => {
    const callOrder: string[] = [];
    const onFailCallback = vi.fn(() => {
      callOrder.push("onFail");
    });
    const onCallCallback = vi.fn(() => {
      callOrder.push("onCall");
    });
    const onOkCallback = vi.fn(() => {
      callOrder.push("onOk");
    });

    apiWithConfig.onFail("get", onFailCallback);
    apiWithConfig.onCall("get", onCallCallback);
    apiWithConfig.onOk("get", onOkCallback);

    mockGetResolver.mockImplementation(async () => {
      callOrder.push("resolver");
      throw new Error("Resolver failed");
    });

    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Resolver failed");

    expect(callOrder).toEqual(["onCall", "resolver", "onFail"]);
    expect(onCallCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).toHaveBeenCalledTimes(1);
    expect(onOkCallback).not.toHaveBeenCalled();
  });

  it("handles multiple onFail and onCall callbacks in correct order", async () => {
    const callOrder: string[] = [];

    const onFailCallback1 = vi.fn(() => {
      callOrder.push("onFail1");
    });
    const onFailCallback2 = vi.fn(() => {
      callOrder.push("onFail2");
    });
    const onCallCallback1 = vi.fn(() => {
      callOrder.push("onCall1");
    });
    const onCallCallback2 = vi.fn(() => {
      callOrder.push("onCall2");
    });

    apiWithConfig.onCall("get", onCallCallback1);
    apiWithConfig.onCall("get", onCallCallback2);
    apiWithConfig.onFail("get", onFailCallback1);
    apiWithConfig.onFail("get", onFailCallback2);

    mockGetResolver.mockImplementation(async () => {
      callOrder.push("resolver");
      throw new Error("Resolver failed");
    });

    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Resolver failed");

    expect(callOrder).toEqual([
      "onCall1",
      "onCall2",
      "resolver",
      "onFail1",
      "onFail2",
    ]);
  });

  it("continues execution and re-throws error even if onFail callback throws", async () => {
    const onFailCallback1 = vi.fn(() => {
      throw new Error("onFail callback error");
    });
    const onFailCallback2 = vi.fn();

    apiWithConfig.onFail("get", onFailCallback1);
    apiWithConfig.onFail("get", onFailCallback2);

    // Spy on console.error to check error logging
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const originalError = new Error("Original resolver error");
    mockGetResolver.mockRejectedValue(originalError);

    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Original resolver error");

    expect(onFailCallback1).toHaveBeenCalledTimes(1);
    expect(onFailCallback2).toHaveBeenCalledTimes(1);

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "onFail callback error for endpoint 'get':",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });

  it("works correctly with different error types", async () => {
    const onFailCallback = vi.fn();
    apiWithConfig.onFail("get", onFailCallback);

    // Test with Error object
    const error1 = new Error("Network error");
    mockGetResolver.mockRejectedValueOnce(error1);

    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "1" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Network error");

    expect(onFailCallback).toHaveBeenCalledWith({
      pathParams: { id: "1" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      error: error1,
    });

    // Test with string error
    const error2 = "String error";
    mockGetResolver.mockRejectedValueOnce(error2);

    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "2" },
        searchParams: { q: "test" },
      }),
    ).rejects.toBe("String error");

    expect(onFailCallback).toHaveBeenCalledWith({
      pathParams: { id: "2" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      error: error2,
    });

    // Test with object error
    const error3 = { type: "custom", message: "Custom error" };
    mockGetResolver.mockRejectedValueOnce(error3);

    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "3" },
        searchParams: { q: "test" },
      }),
    ).rejects.toBe(error3);

    expect(onFailCallback).toHaveBeenCalledWith({
      pathParams: { id: "3" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      error: error3,
    });

    expect(onFailCallback).toHaveBeenCalledTimes(3);
  });

  it("integration with onCall, onOk, and onFail - success scenario", async () => {
    const callOrder: string[] = [];

    const onCallCallback = vi.fn(() => {
      callOrder.push("onCall");
    });
    const onOkCallback = vi.fn(() => {
      callOrder.push("onOk");
    });
    const onFailCallback = vi.fn(() => {
      callOrder.push("onFail");
    });

    apiWithConfig.onCall("get", onCallCallback);
    apiWithConfig.onOk("get", onOkCallback);
    apiWithConfig.onFail("get", onFailCallback);

    mockGetResolver.mockImplementation(async () => {
      callOrder.push("resolver");
      return { id: 1 };
    });

    const result = await apiWithConfig.call("get", {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    });

    expect(result).toEqual({ id: 1 });
    expect(callOrder).toEqual(["onCall", "resolver", "onOk"]);
    expect(onCallCallback).toHaveBeenCalledTimes(1);
    expect(onOkCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).not.toHaveBeenCalled();
  });

  it("integration with onCall, onOk, and onFail - failure scenario", async () => {
    const callOrder: string[] = [];

    const onCallCallback = vi.fn(() => {
      callOrder.push("onCall");
    });
    const onOkCallback = vi.fn(() => {
      callOrder.push("onOk");
    });
    const onFailCallback = vi.fn(() => {
      callOrder.push("onFail");
    });

    apiWithConfig.onCall("get", onCallCallback);
    apiWithConfig.onOk("get", onOkCallback);
    apiWithConfig.onFail("get", onFailCallback);

    const error = new Error("Test error");
    mockGetResolver.mockImplementation(async () => {
      callOrder.push("resolver");
      throw error;
    });

    await expect(
      apiWithConfig.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Test error");

    expect(callOrder).toEqual(["onCall", "resolver", "onFail"]);
    expect(onCallCallback).toHaveBeenCalledTimes(1);
    expect(onOkCallback).not.toHaveBeenCalled();
    expect(onFailCallback).toHaveBeenCalledTimes(1);
  });

  it("is triggered for input validation errors", async () => {
    const onFailCallback = vi.fn();

    // Create API with schema validation that will fail
    const apiWithValidation = init({
      url: "https://api.example.com",
    })<APIContracts>()({
      get: {
        resolver: mockGetResolver,
        schemas: {
          // @ts-expect-error - no raw schema attached with metadata property
          pathParams: (data: unknown): { id: string } => {
            if (!data || typeof data !== "object" || !("id" in data)) {
              throw new Error("Invalid pathParams: id is required");
            }
            return data as { id: string };
          },
        },
      },
      post: { resolver: mockPostResolver },
      noInput: { resolver: mockNoInputResolver },
    });

    apiWithValidation.onFail("get", onFailCallback);

    // Call with invalid pathParams that will fail validation
    await expect(
      apiWithValidation.call("get", {
        // @ts-expect-error - Missing required 'id' field
        pathParams: {},
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Invalid pathParams: id is required");

    // onFail should have been called for the validation error
    expect(onFailCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).toHaveBeenCalledWith({
      pathParams: {},
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      error: expect.objectContaining({
        message: "Invalid pathParams: id is required",
      }),
    });

    // Resolver should never have been called due to early validation failure
    expect(mockGetResolver).not.toHaveBeenCalled();
  });

  it("is triggered for DTO validation errors after successful resolver", async () => {
    const onFailCallback = vi.fn();
    const onOkCallback = vi.fn();

    // Create API with DTO validation that will fail
    const apiWithValidation = init({
      url: "https://api.example.com",
    })<APIContracts>()({
      get: {
        resolver: mockGetResolver,
        schemas: {
          // @ts-expect-error - no raw schema attached with metadata property
          dto: (data: unknown): { id: number } => {
            if (!data || typeof data !== "object" || !("id" in data)) {
              throw new Error("Invalid DTO: id is required");
            }
            return data as { id: number };
          },
        },
      },
      post: { resolver: mockPostResolver },
      noInput: { resolver: mockNoInputResolver },
    });

    apiWithValidation.onFail("get", onFailCallback);
    apiWithValidation.onOk("get", onOkCallback);

    // Mock resolver to return invalid DTO
    mockGetResolver.mockResolvedValue({ invalidField: "test" }); // Missing 'id' field

    await expect(
      apiWithValidation.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Invalid DTO: id is required");

    // Resolver should have been called successfully
    expect(mockGetResolver).toHaveBeenCalledTimes(1);

    // onFail should have been called for the DTO validation error
    expect(onFailCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).toHaveBeenCalledWith({
      pathParams: { id: "123" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      error: expect.objectContaining({
        message: "Invalid DTO: id is required",
      }),
    });

    // onOk should NOT have been called due to DTO validation failure
    expect(onOkCallback).not.toHaveBeenCalled();
  });

  it("comprehensive error handling - any error in call triggers onFail", async () => {
    const onFailCallback = vi.fn();
    let testCase = "";

    const apiWithValidation = init({
      url: "https://api.example.com",
    })<APIContracts>()({
      get: {
        resolver: mockGetResolver,
        schemas: {
          // @ts-expect-error - no raw schema attached with metadata property
          pathParams: (data: unknown): { id: string } => {
            if (testCase === "input-validation") {
              throw new Error("Input validation failed");
            }
            return data as { id: string };
          },
          // @ts-expect-error - no raw schema attached with metadata property
          dto: (data: unknown): { id: number } => {
            if (testCase === "dto-validation") {
              throw new Error("DTO validation failed");
            }
            return data as { id: number };
          },
        },
      },
      post: { resolver: mockPostResolver },
      noInput: { resolver: mockNoInputResolver },
    });

    apiWithValidation.onFail("get", onFailCallback);

    // Test Case 1: Input validation error
    testCase = "input-validation";
    await expect(
      apiWithValidation.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Input validation failed");
    expect(onFailCallback).toHaveBeenCalledTimes(1);

    // Test Case 2: Resolver error
    testCase = "resolver-error";
    mockGetResolver.mockRejectedValueOnce(new Error("Resolver failed"));
    await expect(
      apiWithValidation.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("Resolver failed");
    expect(onFailCallback).toHaveBeenCalledTimes(2);

    // Test Case 3: DTO validation error
    testCase = "dto-validation";
    mockGetResolver.mockResolvedValueOnce({ id: 1 });
    await expect(
      apiWithValidation.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow("DTO validation failed");
    expect(onFailCallback).toHaveBeenCalledTimes(3);

    // All three different error types should have triggered onFail
    expect(onFailCallback).toHaveBeenCalledTimes(3);
  });

  it("is triggered for contract access errors (missing resolver)", async () => {
    const onFailCallback = vi.fn();

    // Create an API with missing resolver to simulate contract access error
    const brokenAPI = init({
      url: "https://api.example.com",
    })<APIContracts>()({
      // @ts-expect-error - Missing resolver
      get: {},
      post: { resolver: mockPostResolver },
      noInput: { resolver: mockNoInputResolver },
    });

    brokenAPI.onFail("get", onFailCallback);

    // This should trigger onFail due to resolver access error
    await expect(
      brokenAPI.call("get", {
        pathParams: { id: "123" },
        searchParams: { q: "test" },
      }),
    ).rejects.toThrow();

    // onFail should have been called for the contract access error
    expect(onFailCallback).toHaveBeenCalledTimes(1);
    expect(onFailCallback).toHaveBeenCalledWith({
      pathParams: { id: "123" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      error: expect.any(Error),
    });
  });

  it("comprehensive try/catch wrapping - NO exception bypasses onFail", async () => {
    // This test documents that the entire call function is wrapped
    // ANY error during call processing will trigger onFail callbacks
    const errorScenarios = [
      {
        name: "Contract access error",
        api: init({ url: "https://api.example.com" })<APIContracts>()({
          // @ts-expect-error - Missing resolver
          get: {},
          post: { resolver: mockPostResolver },
          noInput: { resolver: mockNoInputResolver },
        }),
        expectError: true,
      },
      {
        name: "Input validation error",
        api: init({ url: "https://api.example.com" })<APIContracts>()({
          get: {
            resolver: mockGetResolver,
            schemas: {
              // @ts-expect-error - no raw schema attached with metadata property
              pathParams: () => {
                throw new Error("Validation failed");
              },
            },
          },
          post: { resolver: mockPostResolver },
          noInput: { resolver: mockNoInputResolver },
        }),
        expectError: true,
      },
    ];

    for (const scenario of errorScenarios) {
      const callback = vi.fn();
      scenario.api.onFail("get", callback);

      await expect(
        scenario.api.call("get", {
          pathParams: { id: "123" },
          searchParams: { q: "test" },
        }),
      ).rejects.toThrow();

      // Every error scenario should trigger onFail
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback.mock.calls[0][0]).toHaveProperty("error");
    }
  });
});
