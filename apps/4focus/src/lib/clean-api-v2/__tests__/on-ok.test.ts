import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

describe("onOk works when", () => {
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

  it("a single callback is called with correct arguments, config, and dto", async () => {
    const onOkCallback = vi.fn();
    apiWithConfig.onOk("get", onOkCallback);

    const expectedDto = { id: 1 };
    mockGetResolver.mockResolvedValue(expectedDto);
    const callArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };
    const result = await apiWithConfig.call("get", callArgs);

    expect(result).toEqual(expectedDto);
    expect(onOkCallback).toHaveBeenCalledTimes(1);
    expect(onOkCallback).toHaveBeenCalledWith({
      ...callArgs,
      config: { url: "https://api.example.com" },
      dto: expectedDto,
    });

    // Type assertion
    apiWithConfig.onOk("get", (input) => {
      expectTypeOf(input.config).toEqualTypeOf<{
        url: string;
      }>();
      expectTypeOf(input.pathParams).toEqualTypeOf<{
        id: string;
      }>();
      expectTypeOf(input.searchParams).toEqualTypeOf<{
        q: string;
      }>();
      expectTypeOf(input.dto).toEqualTypeOf<{
        id: number;
      }>();
    });
  });

  it("a single callback is called with correct arguments and dto when no config", async () => {
    const onOkCallback = vi.fn();
    apiWithoutConfig.onOk("get", onOkCallback);

    const expectedDto = { id: 1 };
    mockGetResolver.mockResolvedValue(expectedDto);
    const callArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };
    const result = await apiWithoutConfig.call("get", callArgs);

    expect(result).toEqual(expectedDto);
    expect(onOkCallback).toHaveBeenCalledTimes(1);
    expect(onOkCallback).toHaveBeenCalledWith({
      ...callArgs,
      dto: expectedDto,
    });

    // Type assertion
    apiWithoutConfig.onOk("get", (input) => {
      expectTypeOf(input).toHaveProperty("pathParams");
      expectTypeOf(input).toHaveProperty("searchParams");
      expectTypeOf(input).toHaveProperty("dto");
      expectTypeOf(input).not.toHaveProperty("config");
      expectTypeOf(input.dto).toEqualTypeOf<{ id: number }>();
    });
  });

  it("multiple callbacks are called with correct dto", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    apiWithConfig.onOk("get", callback1);
    apiWithConfig.onOk("get", callback2);

    const expectedDto = { id: 1 };
    mockGetResolver.mockResolvedValue(expectedDto);
    const callArgs = {
      pathParams: { id: "456" },
      searchParams: { q: "multi" },
    };
    const result = await apiWithConfig.call("get", callArgs);

    expect(result).toEqual(expectedDto);
    const expectedPayload = {
      ...callArgs,
      config: { url: "https://api.example.com" },
      dto: expectedDto,
    };
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledWith(expectedPayload);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith(expectedPayload);
  });

  it("unsubscribing a callback prevents it from being called", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const unsubscribe = apiWithConfig.onOk("post", callback1);
    apiWithConfig.onOk("post", callback2);

    unsubscribe();

    const expectedDto = { success: true };
    mockPostResolver.mockResolvedValue(expectedDto);
    const result = await apiWithConfig.call("post", {
      payload: { data: "test" },
    });

    expect(result).toEqual(expectedDto);
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith({
      payload: { data: "test" },
      config: { url: "https://api.example.com" },
      dto: expectedDto,
    });
  });

  it("callback is called for an api call with no input", async () => {
    const onOkCallback = vi.fn();
    apiWithConfig.onOk("noInput", onOkCallback);

    const expectedDto = { status: "ok" };
    mockNoInputResolver.mockResolvedValue(expectedDto);
    const result = await apiWithConfig.call("noInput");

    expect(result).toEqual(expectedDto);
    expect(onOkCallback).toHaveBeenCalledTimes(1);
    expect(onOkCallback).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
      dto: expectedDto,
    });

    // Type assertion
    apiWithConfig.onOk("noInput", (input) => {
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input).not.toHaveProperty("searchParams");
      expectTypeOf(input).not.toHaveProperty("payload");
      expectTypeOf(input).toHaveProperty("config");
      expectTypeOf(input).toHaveProperty("dto");
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
      expectTypeOf(input.dto).toEqualTypeOf<{ status: string }>();
    });
  });

  it("callbacks are only triggered for their specific endpoint", async () => {
    const onOkCallbackForGet = vi.fn();
    const onOkCallbackForPost = vi.fn();

    // Register callbacks for different endpoints
    apiWithConfig.onOk("get", onOkCallbackForGet);
    apiWithConfig.onOk("post", onOkCallbackForPost);

    // Call the 'post' endpoint
    const postDto = { success: true };
    mockPostResolver.mockResolvedValue(postDto);
    const postCallArgs = { payload: { data: "test-data" } };
    const postResult = await apiWithConfig.call("post", postCallArgs);

    expect(postResult).toEqual(postDto);

    // Only the 'post' callback should be triggered
    expect(onOkCallbackForPost).toHaveBeenCalledTimes(1);
    expect(onOkCallbackForPost).toHaveBeenCalledWith({
      ...postCallArgs,
      config: { url: "https://api.example.com" },
      dto: postDto,
    });

    // The 'get' callback should NOT be triggered
    expect(onOkCallbackForGet).not.toHaveBeenCalled();

    // Now call the 'get' endpoint
    const getDto = { id: 1 };
    mockGetResolver.mockResolvedValue(getDto);
    const getCallArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };
    const getResult = await apiWithConfig.call("get", getCallArgs);

    expect(getResult).toEqual(getDto);

    // Now the 'get' callback should be triggered
    expect(onOkCallbackForGet).toHaveBeenCalledTimes(1);
    expect(onOkCallbackForGet).toHaveBeenCalledWith({
      ...getCallArgs,
      config: { url: "https://api.example.com" },
      dto: getDto,
    });

    // The 'post' callback should still only have been called once
    expect(onOkCallbackForPost).toHaveBeenCalledTimes(1);
  });

  it("callback registered for one endpoint is NOT called for another", async () => {
    const onOkCallbackForGet = vi.fn();
    apiWithConfig.onOk("get", onOkCallbackForGet);

    const postDto = { success: true };
    mockPostResolver.mockResolvedValue(postDto);
    const postCallArgs = { payload: { data: "cross-call" } };
    const result = await apiWithConfig.call("post", postCallArgs);

    expect(result).toEqual(postDto);

    // The callback for 'get' should NOT be called when 'post' is called
    expect(onOkCallbackForGet).not.toHaveBeenCalled();
  });

  it("multiple endpoints with separate callbacks are properly isolated", async () => {
    const getCallback = vi.fn();
    const postCallback = vi.fn();
    const noInputCallback = vi.fn();

    // Register different callbacks for each endpoint
    apiWithConfig.onOk("get", getCallback);
    apiWithConfig.onOk("post", postCallback);
    apiWithConfig.onOk("noInput", noInputCallback);

    // Call each endpoint in sequence
    const getDto = { id: 1 };
    mockGetResolver.mockResolvedValue(getDto);
    const getResult = await apiWithConfig.call("get", {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    });

    const postDto = { success: true };
    mockPostResolver.mockResolvedValue(postDto);
    const postResult = await apiWithConfig.call("post", {
      payload: { data: "test" },
    });

    const noInputDto = { status: "ok" };
    mockNoInputResolver.mockResolvedValue(noInputDto);
    const noInputResult = await apiWithConfig.call("noInput");

    expect(getResult).toEqual(getDto);
    expect(postResult).toEqual(postDto);
    expect(noInputResult).toEqual(noInputDto);

    // Each callback should only be called once for its respective endpoint
    expect(getCallback).toHaveBeenCalledTimes(1);
    expect(postCallback).toHaveBeenCalledTimes(1);
    expect(noInputCallback).toHaveBeenCalledTimes(1);

    // Verify the arguments passed to each callback
    expect(getCallback).toHaveBeenCalledWith({
      pathParams: { id: "123" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
      dto: getDto,
    });

    expect(postCallback).toHaveBeenCalledWith({
      payload: { data: "test" },
      config: { url: "https://api.example.com" },
      dto: postDto,
    });

    expect(noInputCallback).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
      dto: noInputDto,
    });
  });

  it("callback passed to onOk has correct TS types inferred", () => {
    apiWithConfig.onOk("get", (input) => {
      expectTypeOf(input.pathParams).toEqualTypeOf<{ id: string }>();
      expectTypeOf(input.searchParams).toEqualTypeOf<{ q: string }>();
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
      expectTypeOf(input.dto).toEqualTypeOf<{ id: number }>();
    });
    apiWithConfig.onOk("post", (input) => {
      expectTypeOf(input.payload).toEqualTypeOf<{ data: string }>();
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
      expectTypeOf(input.dto).toEqualTypeOf<{ success: boolean }>();
    });
    apiWithConfig.onOk("noInput", (input) => {
      expectTypeOf(input).not.toHaveProperty("payload");
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input).toHaveProperty("config");
      expectTypeOf(input).toHaveProperty("dto");
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
      expectTypeOf(input.dto).toEqualTypeOf<{ status: string }>();
    });

    apiWithoutConfig.onOk("get", (input) => {
      expectTypeOf(input).not.toHaveProperty("config");
      expectTypeOf(input.dto).toEqualTypeOf<{ id: number }>();
    });
  });

  it("is NOT called when resolver throws an error", async () => {
    const onOkCallback = vi.fn();
    const onCallCallback = vi.fn();

    apiWithConfig.onOk("get", onOkCallback);
    apiWithConfig.onCall("get", onCallCallback);

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

    // onOk should NOT have been called since the resolver failed
    expect(onOkCallback).not.toHaveBeenCalled();
  });

  it("is called AFTER successful execution, not before", async () => {
    const callOrder: string[] = [];
    const onOkCallback = vi.fn(() => {
      callOrder.push("onOk");
    });
    const onCallCallback = vi.fn(() => {
      callOrder.push("onCall");
    });

    apiWithConfig.onOk("get", onOkCallback);
    apiWithConfig.onCall("get", onCallCallback);

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
  });

  it("handles multiple onOk and onCall callbacks in correct order", async () => {
    const callOrder: string[] = [];

    const onOkCallback1 = vi.fn(() => {
      callOrder.push("onOk1");
    });
    const onOkCallback2 = vi.fn(() => {
      callOrder.push("onOk2");
    });
    const onCallCallback1 = vi.fn(() => {
      callOrder.push("onCall1");
    });
    const onCallCallback2 = vi.fn(() => {
      callOrder.push("onCall2");
    });

    apiWithConfig.onCall("get", onCallCallback1);
    apiWithConfig.onCall("get", onCallCallback2);
    apiWithConfig.onOk("get", onOkCallback1);
    apiWithConfig.onOk("get", onOkCallback2);

    mockGetResolver.mockImplementation(async () => {
      callOrder.push("resolver");
      return { id: 1 };
    });

    const result = await apiWithConfig.call("get", {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    });

    expect(result).toEqual({ id: 1 });
    expect(callOrder).toEqual([
      "onCall1",
      "onCall2",
      "resolver",
      "onOk1",
      "onOk2",
    ]);
  });

  it("continues execution even if onOk callback throws an error", async () => {
    const onOkCallback1 = vi.fn(() => {
      throw new Error("onOk callback error");
    });
    const onOkCallback2 = vi.fn();

    apiWithConfig.onOk("get", onOkCallback1);
    apiWithConfig.onOk("get", onOkCallback2);

    // Spy on console.error to check error logging
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const expectedDto = { id: 1 };
    mockGetResolver.mockResolvedValue(expectedDto);

    const result = await apiWithConfig.call("get", {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    });

    expect(result).toEqual(expectedDto);
    expect(onOkCallback1).toHaveBeenCalledTimes(1);
    expect(onOkCallback2).toHaveBeenCalledTimes(1);

    // Check that error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "onOk callback error for endpoint 'get':",
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
