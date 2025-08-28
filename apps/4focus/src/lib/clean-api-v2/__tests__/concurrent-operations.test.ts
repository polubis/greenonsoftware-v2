import { describe, expect, it, vi, beforeEach } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

describe("Concurrent Operations", () => {
  type APIContracts = {
    get: {
      dto: { id: number; timestamp: number };
      error: ErrorVariant<"not_found", 404>;
      pathParams: { id: string };
    };
    post: {
      dto: { success: boolean; created: number };
      error: ErrorVariant<"bad_request", 400>;
      payload: { data: string };
    };
    slow: {
      dto: { result: string };
      error: ErrorVariant<"timeout", 408>;
      payload: { delay: number };
    };
  };

  const mockGetResolver = vi.fn();
  const mockPostResolver = vi.fn();
  const mockSlowResolver = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Parallel API Calls", () => {
    it("handles multiple concurrent calls to the same endpoint", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      // Set up resolvers to return unique values
      mockGetResolver
        .mockResolvedValueOnce({ id: 1, timestamp: 1001 })
        .mockResolvedValueOnce({ id: 2, timestamp: 1002 })
        .mockResolvedValueOnce({ id: 3, timestamp: 1003 });

      // Start multiple concurrent calls
      const promises = [
        api.call("get", { pathParams: { id: "1" } }),
        api.call("get", { pathParams: { id: "2" } }),
        api.call("get", { pathParams: { id: "3" } }),
      ];

      // Wait for all to complete
      const results = await Promise.all(promises);

      // Verify each call got its unique result
      expect(results).toEqual([
        { id: 1, timestamp: 1001 },
        { id: 2, timestamp: 1002 },
        { id: 3, timestamp: 1003 },
      ]);

      expect(mockGetResolver).toHaveBeenCalledTimes(3);
      expect(mockGetResolver).toHaveBeenCalledWith({ pathParams: { id: "1" } });
      expect(mockGetResolver).toHaveBeenCalledWith({ pathParams: { id: "2" } });
      expect(mockGetResolver).toHaveBeenCalledWith({ pathParams: { id: "3" } });
    });

    it("handles concurrent calls to different endpoints", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });
      mockPostResolver.mockResolvedValue({
        success: true,
        created: Date.now(),
      });
      mockSlowResolver.mockResolvedValue({ result: "slow-result" });

      // Start concurrent calls to different endpoints
      const promises = [
        api.call("get", { pathParams: { id: "1" } }),
        api.call("post", { payload: { data: "test" } }),
        api.call("slow", { payload: { delay: 100 } }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toHaveProperty("id", 1);
      expect(results[1]).toHaveProperty("success", true);
      expect(results[2]).toHaveProperty("result", "slow-result");

      expect(mockGetResolver).toHaveBeenCalledTimes(1);
      expect(mockPostResolver).toHaveBeenCalledTimes(1);
      expect(mockSlowResolver).toHaveBeenCalledTimes(1);
    });

    it("handles mixed successful and failed concurrent calls", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });
      mockPostResolver.mockRejectedValue(new Error("Post failed"));
      mockSlowResolver.mockResolvedValue({ result: "success" });

      const promises = [
        api.call("get", { pathParams: { id: "1" } }),
        api
          .call("post", { payload: { data: "test" } })
          .catch((err) => ({ error: err.message })),
        api.call("slow", { payload: { delay: 50 } }),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual({ id: 1, timestamp: expect.any(Number) });
      expect(results[1]).toEqual({ error: "Post failed" });
      expect(results[2]).toEqual({ result: "success" });
    });

    it("handles high-frequency concurrent calls", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      // Set up resolver to return unique values based on call order
      let callCount = 0;
      mockGetResolver.mockImplementation(async (input) => {
        const currentCall = ++callCount;
        // Add small random delay to simulate real network conditions
        await new Promise((resolve) => setTimeout(resolve, Math.random() * 10));
        return {
          id: parseInt(input.pathParams.id),
          timestamp: currentCall,
        };
      });

      // Create many concurrent calls
      const promises = Array(50)
        .fill(0)
        .map((_, i) => api.call("get", { pathParams: { id: i.toString() } }));

      const results = await Promise.all(promises);

      // Verify all calls completed
      expect(results).toHaveLength(50);
      expect(mockGetResolver).toHaveBeenCalledTimes(50);

      // Verify each call got a unique timestamp (call order)
      const timestamps = results.map((r) => r.timestamp);
      const uniqueTimestamps = new Set(timestamps);
      expect(uniqueTimestamps.size).toBe(50);
    });
  });

  describe("Concurrent OnCall Subscriptions", () => {
    it("handles concurrent subscription and unsubscription", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      const callbacks = Array(20)
        .fill(0)
        .map(() => vi.fn());
      const unsubscribers: Array<() => void> = new Array(20); // Pre-allocate

      // Subscribe all callbacks concurrently
      await Promise.all(
        callbacks.map(async (callback, i) => {
          // Add small delay to simulate concurrent operations
          await new Promise((resolve) => setTimeout(resolve, i % 5));
          unsubscribers[i] = api.onCall("get", callback); // ✅ Maintain order!
        }),
      );

      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });
      await api.call("get", { pathParams: { id: "test" } });

      // All callbacks should have been called
      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Unsubscribe half of them concurrently
      await Promise.all(
        unsubscribers.slice(0, 10).map(async (unsubscribe, i) => {
          await new Promise((resolve) => setTimeout(resolve, i % 3));
          unsubscribe();
        }),
      );

      vi.clearAllMocks();
      await api.call("get", { pathParams: { id: "test2" } });

      // Only the remaining callbacks should be called
      callbacks.slice(0, 10).forEach((callback) => {
        expect(callback).not.toHaveBeenCalled();
      });
      callbacks.slice(10).forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });
    });

    it("handles race conditions between onCall registration and API calls", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      const callback = vi.fn();
      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });

      // Start API call and subscription registration concurrently
      const [callResult] = await Promise.all([
        api.call("get", { pathParams: { id: "race" } }),
        new Promise<void>((resolve) => {
          // Register callback after a small delay
          setTimeout(() => {
            api.onCall("get", callback);
            resolve();
          }, 5);
        }),
      ]);

      expect(callResult).toEqual({ id: 1, timestamp: expect.any(Number) });

      // The callback should not have been called for the racing call
      expect(callback).not.toHaveBeenCalled();

      // But should be called for subsequent calls
      await api.call("get", { pathParams: { id: "after" } });
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("handles concurrent callbacks modifying shared state", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      const sharedCounter = { value: 0 };
      const callbacks = Array(10)
        .fill(0)
        .map(() =>
          vi.fn(() => {
            // Simulate concurrent modification of shared state
            const current = sharedCounter.value;
            // Small delay to increase chance of race conditions
            setTimeout(() => {
              sharedCounter.value = current + 1;
            }, 0);
          }),
        );

      callbacks.forEach((callback) => api.onCall("get", callback));

      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });
      await api.call("get", { pathParams: { id: "concurrent" } });

      // All callbacks should have been called
      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Wait for all async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Final counter value might be less than 10 due to race conditions
      // but should be at least 1
      expect(sharedCounter.value).toBeGreaterThan(0);
      expect(sharedCounter.value).toBeLessThanOrEqual(10);
    });
  });

  describe("Concurrent SafeCall Operations", () => {
    it("handles concurrent safeCall operations with mixed results", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });
      mockPostResolver.mockRejectedValue(new Error("Failed"));
      mockSlowResolver.mockResolvedValue({ result: "ok" });

      const promises = [
        api.safeCall("get", { pathParams: { id: "1" } }),
        api.safeCall("post", { payload: { data: "test" } }),
        api.safeCall("slow", { payload: { delay: 10 } }),
      ];

      const results = await Promise.all(promises);

      expect(results[0][0]).toBe(true); // Success
      expect(results[0][1]).toEqual({ id: 1, timestamp: expect.any(Number) });

      expect(results[1][0]).toBe(false); // Failure
      expect(results[1][1]).toBeInstanceOf(Error);

      expect(results[2][0]).toBe(true); // Success
      expect(results[2][1]).toEqual({ result: "ok" });
    });

    it("handles concurrent safeCall and regular call mixing", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });
      mockPostResolver.mockRejectedValue(new Error("Failed"));

      const promises = [
        api.safeCall("get", { pathParams: { id: "1" } }),
        api.call("get", { pathParams: { id: "2" } }),
        api.safeCall("post", { payload: { data: "test" } }),
        api
          .call("post", { payload: { data: "test2" } })
          .catch((err) => ({ caught: err.message })),
      ];

      const results = await Promise.all(promises);

      expect(results[0]).toEqual([
        true,
        { id: 1, timestamp: expect.any(Number) },
      ]);
      expect(results[1]).toEqual({ id: 1, timestamp: expect.any(Number) });
      expect(Array.isArray(results[2]) && results[2][0]).toBe(false);
      expect(results[3]).toEqual({ caught: "Failed" });
    });
  });

  describe("Resolver Concurrency", () => {
    it("handles concurrent calls with slow resolvers", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      // Set up slow resolver that takes varying amounts of time
      mockSlowResolver.mockImplementation(async (input) => {
        const delay = input.payload.delay;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return { result: `completed-after-${delay}ms` };
      });

      const startTime = Date.now();

      // Start calls with different delays - they should run in parallel
      const promises = [
        api.call("slow", { payload: { delay: 100 } }),
        api.call("slow", { payload: { delay: 50 } }),
        api.call("slow", { payload: { delay: 25 } }),
      ];

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // Verify results
      expect(results).toEqual([
        { result: "completed-after-100ms" },
        { result: "completed-after-50ms" },
        { result: "completed-after-25ms" },
      ]);

      // Total time should be close to the longest delay (100ms) plus some overhead
      // rather than the sum of all delays (175ms)
      expect(totalTime).toBeLessThan(150); // Should be much less than sequential execution
      expect(totalTime).toBeGreaterThan(90); // Should be at least as long as the longest delay
    });

    it("handles resolver errors during concurrent execution", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      // Set up resolvers with different behaviors
      mockGetResolver.mockImplementation(async (input) => {
        if (input.pathParams.id === "error") {
          throw new Error("Get error");
        }
        return { id: parseInt(input.pathParams.id), timestamp: Date.now() };
      });

      mockPostResolver.mockImplementation(async (input) => {
        if (input.payload.data === "error") {
          throw new Error("Post error");
        }
        return { success: true, created: Date.now() };
      });

      const promises = [
        api.safeCall("get", { pathParams: { id: "1" } }),
        api.safeCall("get", { pathParams: { id: "error" } }),
        api.safeCall("post", { payload: { data: "success" } }),
        api.safeCall("post", { payload: { data: "error" } }),
      ];

      const results = await Promise.all(promises);

      expect(results[0][0]).toBe(true);
      expect(results[1][0]).toBe(false);
      expect(results[1][1]).toBeInstanceOf(Error);
      expect(results[2][0]).toBe(true);
      expect(results[3][0]).toBe(false);
      expect(results[3][1]).toBeInstanceOf(Error);
    });
  });

  describe("Subscription Callback Concurrency", () => {
    it("handles concurrent execution of multiple callbacks", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      const executionOrder: number[] = [];
      const callbacks = Array(5)
        .fill(0)
        .map((_, i) =>
          vi.fn(async () => {
            executionOrder.push(i);
            // Simulate async work with varying delays
            await new Promise((resolve) => setTimeout(resolve, (5 - i) * 10));
            executionOrder.push(i + 100); // Mark completion
          }),
        );

      callbacks.forEach((callback) => api.onCall("get", callback));

      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });
      await api.call("get", { pathParams: { id: "concurrent-callbacks" } });

      // All callbacks should have been called
      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Wait for all async operations to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify execution order shows concurrency
      // Start order should be 0,1,2,3,4 but completion order may vary
      const startOrder = executionOrder.filter((x) => x < 100);
      const endOrder = executionOrder.filter((x) => x >= 100);

      expect(startOrder).toEqual([0, 1, 2, 3, 4]);
      expect(endOrder).toHaveLength(5);
      // Last callback (index 4) should complete first since it has shortest delay
      expect(endOrder[0]).toBe(104);
    });

    it("handles callback errors during concurrent execution", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        slow: { resolver: mockSlowResolver },
      });

      const goodCallback = vi.fn();
      const errorCallback = vi.fn(() => {
        throw new Error("Callback error");
      });
      const anotherGoodCallback = vi.fn();

      api.onCall("get", goodCallback);
      api.onCall("get", errorCallback);
      api.onCall("get", anotherGoodCallback);

      mockGetResolver.mockResolvedValue({ id: 1, timestamp: Date.now() });

      // Mock console.error to verify error logging
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Should not throw despite callback error - call should complete successfully
      const result = await api.call("get", {
        pathParams: { id: "callback-error" },
      });
      expect(result).toEqual({ id: 1, timestamp: expect.any(Number) });

      // All callbacks should have been called
      expect(goodCallback).toHaveBeenCalledTimes(1);
      expect(errorCallback).toHaveBeenCalledTimes(1);
      expect(anotherGoodCallback).toHaveBeenCalledTimes(1);

      // Verify error was logged to console
      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "onCall callback error for endpoint 'get':",
        expect.any(Error),
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });
  });
});
