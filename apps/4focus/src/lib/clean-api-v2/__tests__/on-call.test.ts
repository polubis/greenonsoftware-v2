import { describe, it, expect, vi, beforeEach, expectTypeOf } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

describe("onCall works when", () => {
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

  it("a single callback is called with correct arguments and config", async () => {
    const onCallCallback = vi.fn();
    apiWithConfig.onCall("get", onCallCallback);

    mockGetResolver.mockResolvedValue({ id: 1 });
    const callArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };
    await apiWithConfig.call("get", callArgs);

    expect(onCallCallback).toHaveBeenCalledTimes(1);
    expect(onCallCallback).toHaveBeenCalledWith({
      ...callArgs,
      config: { url: "https://api.example.com" },
    });

    apiWithConfig.onCall("get", (input) => {
      expectTypeOf(input.config).toEqualTypeOf<{
        url: string;
      }>();
      expectTypeOf(input.pathParams).toEqualTypeOf<{
        id: string;
      }>();
      expectTypeOf(input.searchParams).toEqualTypeOf<{
        q: string;
      }>();
    });
  });

  it("a single callback is called with correct arguments when no config", async () => {
    const onCallCallback = vi.fn();
    apiWithoutConfig.onCall("get", onCallCallback);

    mockGetResolver.mockResolvedValue({ id: 1 });
    const callArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };
    await apiWithoutConfig.call("get", callArgs);

    expect(onCallCallback).toHaveBeenCalledTimes(1);
    expect(onCallCallback).toHaveBeenCalledWith(callArgs);

    // Type assertion
    apiWithoutConfig.onCall("get", (input) => {
      expectTypeOf(input).toHaveProperty("pathParams");
      expectTypeOf(input).toHaveProperty("searchParams");
      expectTypeOf(input).not.toHaveProperty("config");
    });
  });

  it("multiple callbacks are called", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    apiWithConfig.onCall("get", callback1);
    apiWithConfig.onCall("get", callback2);

    mockGetResolver.mockResolvedValue({ id: 1 });
    const callArgs = {
      pathParams: { id: "456" },
      searchParams: { q: "multi" },
    };
    await apiWithConfig.call("get", callArgs);

    const expectedPayload = {
      ...callArgs,
      config: { url: "https://api.example.com" },
    };
    expect(callback1).toHaveBeenCalledTimes(1);
    expect(callback1).toHaveBeenCalledWith(expectedPayload);
    expect(callback2).toHaveBeenCalledTimes(1);
    expect(callback2).toHaveBeenCalledWith(expectedPayload);
  });

  it("unsubscribing a callback prevents it from being called", async () => {
    const callback1 = vi.fn();
    const callback2 = vi.fn();
    const unsubscribe = apiWithConfig.onCall("post", callback1);
    apiWithConfig.onCall("post", callback2);

    unsubscribe();

    mockPostResolver.mockResolvedValue({ success: true });
    await apiWithConfig.call("post", { payload: { data: "test" } });

    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalledTimes(1);
  });

  it("callback is called for an api call with no input", async () => {
    const onCallCallback = vi.fn();
    apiWithConfig.onCall("noInput", onCallCallback);

    mockNoInputResolver.mockResolvedValue({ status: "ok" });
    await apiWithConfig.call("noInput");

    expect(onCallCallback).toHaveBeenCalledTimes(1);
    expect(onCallCallback).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
    });

    apiWithConfig.onCall("noInput", (input) => {
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input).not.toHaveProperty("searchParams");
      expectTypeOf(input).not.toHaveProperty("payload");
      expectTypeOf(input).toHaveProperty("config");
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
    });
  });

  it("callbacks are only triggered for their specific endpoint (correct behavior)", async () => {
    const onCallCallbackForGet = vi.fn();
    const onCallCallbackForPost = vi.fn();

    // Register callbacks for different endpoints
    apiWithConfig.onCall("get", onCallCallbackForGet);
    apiWithConfig.onCall("post", onCallCallbackForPost);

    // Call the 'post' endpoint
    mockPostResolver.mockResolvedValue({ success: true });
    const postCallArgs = { payload: { data: "test-data" } };
    await apiWithConfig.call("post", postCallArgs);

    // Only the 'post' callback should be triggered
    expect(onCallCallbackForPost).toHaveBeenCalledTimes(1);
    expect(onCallCallbackForPost).toHaveBeenCalledWith({
      ...postCallArgs,
      config: { url: "https://api.example.com" },
    });

    // The 'get' callback should NOT be triggered
    expect(onCallCallbackForGet).not.toHaveBeenCalled();

    // Now call the 'get' endpoint
    mockGetResolver.mockResolvedValue({ id: 1 });
    const getCallArgs = {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    };
    await apiWithConfig.call("get", getCallArgs);

    // Now the 'get' callback should be triggered
    expect(onCallCallbackForGet).toHaveBeenCalledTimes(1);
    expect(onCallCallbackForGet).toHaveBeenCalledWith({
      ...getCallArgs,
      config: { url: "https://api.example.com" },
    });

    // The 'post' callback should still only have been called once
    expect(onCallCallbackForPost).toHaveBeenCalledTimes(1);
  });

  it("callback registered for one endpoint is NOT called for another", async () => {
    const onCallCallbackForGet = vi.fn();
    apiWithConfig.onCall("get", onCallCallbackForGet);

    mockPostResolver.mockResolvedValue({ success: true });
    const postCallArgs = { payload: { data: "cross-call" } };
    await apiWithConfig.call("post", postCallArgs);

    // The callback for 'get' should NOT be called when 'post' is called
    expect(onCallCallbackForGet).not.toHaveBeenCalled();
  });

  it("multiple endpoints with separate callbacks are properly isolated", async () => {
    const getCallback = vi.fn();
    const postCallback = vi.fn();
    const noInputCallback = vi.fn();

    // Register different callbacks for each endpoint
    apiWithConfig.onCall("get", getCallback);
    apiWithConfig.onCall("post", postCallback);
    apiWithConfig.onCall("noInput", noInputCallback);

    // Call each endpoint in sequence
    mockGetResolver.mockResolvedValue({ id: 1 });
    await apiWithConfig.call("get", {
      pathParams: { id: "123" },
      searchParams: { q: "test" },
    });

    mockPostResolver.mockResolvedValue({ success: true });
    await apiWithConfig.call("post", { payload: { data: "test" } });

    mockNoInputResolver.mockResolvedValue({ status: "ok" });
    await apiWithConfig.call("noInput");

    // Each callback should only be called once for its respective endpoint
    expect(getCallback).toHaveBeenCalledTimes(1);
    expect(postCallback).toHaveBeenCalledTimes(1);
    expect(noInputCallback).toHaveBeenCalledTimes(1);

    // Verify the arguments passed to each callback
    expect(getCallback).toHaveBeenCalledWith({
      pathParams: { id: "123" },
      searchParams: { q: "test" },
      config: { url: "https://api.example.com" },
    });

    expect(postCallback).toHaveBeenCalledWith({
      payload: { data: "test" },
      config: { url: "https://api.example.com" },
    });

    expect(noInputCallback).toHaveBeenCalledWith({
      config: { url: "https://api.example.com" },
    });
  });

  it("callback passed to onCall has correct TS types inferred", () => {
    apiWithConfig.onCall("get", (input) => {
      expectTypeOf(input.pathParams).toEqualTypeOf<{ id: string }>();
      expectTypeOf(input.searchParams).toEqualTypeOf<{ q: string }>();
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
    });
    apiWithConfig.onCall("post", (input) => {
      expectTypeOf(input.payload).toEqualTypeOf<{ data: string }>();
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input.config).toEqualTypeOf<{ url: string }>();
    });
    apiWithConfig.onCall("noInput", (input) => {
      expectTypeOf(input).not.toHaveProperty("payload");
      expectTypeOf(input).not.toHaveProperty("pathParams");
      expectTypeOf(input).toHaveProperty("config");
      expectTypeOf(input).toEqualTypeOf<{ config: { url: string } }>();
    });

    apiWithoutConfig.onCall("get", (input) => {
      expectTypeOf(input).not.toHaveProperty("config");
    });
  });
});
