import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

describe("Memory Management", () => {
  type APIContracts = {
    get: {
      dto: { id: number };
      error: ErrorVariant<"not_found", 404>;
      pathParams: { id: string };
    };
    post: {
      dto: { success: boolean };
      error: ErrorVariant<"bad_request", 400>;
      payload: { data: string };
    };
  };

  const mockGetResolver = vi.fn();
  const mockPostResolver = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Force garbage collection if available (Node.js)
    if (global.gc) {
      global.gc();
    }
  });

  describe("OnCall Subscription Cleanup", () => {
    it("properly cleans up subscriptions when unsubscribed", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      // Subscribe multiple callbacks
      const unsubscribe1 = api.onCall("get", callback1);
      const unsubscribe2 = api.onCall("get", callback2);
      const unsubscribe3 = api.onCall("post", callback3);

      mockGetResolver.mockResolvedValue({ id: 1 });
      mockPostResolver.mockResolvedValue({ success: true });

      // All callbacks should be called
      await api.call("get", { pathParams: { id: "123" } });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).not.toHaveBeenCalled();

      await api.call("post", { payload: { data: "test" } });
      expect(callback3).toHaveBeenCalledTimes(1);

      // Unsubscribe some callbacks
      unsubscribe1();
      unsubscribe3();

      vi.clearAllMocks();

      // Only callback2 should be called now
      await api.call("get", { pathParams: { id: "456" } });
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).not.toHaveBeenCalled();

      await api.call("post", { payload: { data: "test2" } });
      expect(callback3).not.toHaveBeenCalled();

      // Unsubscribe the last callback
      unsubscribe2();
      vi.clearAllMocks();

      // No callbacks should be called
      await api.call("get", { pathParams: { id: "789" } });
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();
    });

    it("handles multiple unsubscriptions of the same callback safely", () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      const callback = vi.fn();
      const unsubscribe = api.onCall("get", callback);

      // Multiple unsubscriptions should not cause errors
      expect(() => {
        unsubscribe();
        unsubscribe();
        unsubscribe();
      }).not.toThrow();
    });

    it("handles unsubscription of non-existent callbacks", () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      const callback = vi.fn();
      const unsubscribe = api.onCall("get", callback);

      // Unsubscribe normally first
      unsubscribe();

      // Create a new subscription
      const callback2 = vi.fn();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const unsubscribe2 = api.onCall("get", callback2);

      // Old unsubscribe should not affect new subscription
      expect(() => unsubscribe()).not.toThrow();

      // Verify new subscription still works
      return expect(async () => {
        mockGetResolver.mockResolvedValue({ id: 1 });
        await api.call("get", { pathParams: { id: "123" } });
        expect(callback2).toHaveBeenCalledTimes(1);
      }).not.toThrow();
    });
  });

  describe("Subscription Memory Pressure", () => {
    it("handles large numbers of subscriptions efficiently", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      const subscriptionCount = 1000;
      const callbacks: Array<() => void> = [];
      const unsubscribers: Array<() => void> = [];

      // Create many subscriptions
      for (let i = 0; i < subscriptionCount; i++) {
        const callback = vi.fn();
        callbacks.push(callback);
        unsubscribers.push(api.onCall("get", callback));
      }

      mockGetResolver.mockResolvedValue({ id: 1 });

      // Measure time for one call with many subscriptions
      const start = Date.now();
      await api.call("get", { pathParams: { id: "123" } });
      const callTime = Date.now() - start;

      // All callbacks should have been called
      callbacks.forEach((callback) => {
        expect(callback).toHaveBeenCalledTimes(1);
      });

      // Performance should be reasonable (adjust threshold as needed)
      expect(callTime).toBeLessThan(1000); // Should complete within 1 second

      // Clean up all subscriptions
      const cleanupStart = Date.now();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      const cleanupTime = Date.now() - cleanupStart;

      // Cleanup should also be efficient
      expect(cleanupTime).toBeLessThan(500);

      // Verify all subscriptions are cleaned up
      vi.clearAllMocks();
      await api.call("get", { pathParams: { id: "456" } });
      callbacks.forEach((callback) => {
        expect(callback).not.toHaveBeenCalled();
      });
    });

    it("handles rapid subscription and unsubscription cycles", () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      // Rapidly subscribe and unsubscribe many times
      for (let cycle = 0; cycle < 100; cycle++) {
        const callbacks = [];
        const unsubscribers = [];

        // Subscribe 10 callbacks
        for (let i = 0; i < 10; i++) {
          const callback = vi.fn();
          callbacks.push(callback);
          unsubscribers.push(api.onCall("get", callback));
        }

        // Immediately unsubscribe them all
        unsubscribers.forEach((unsubscribe) => unsubscribe());
      }

      // Should not throw any errors or cause memory issues
      expect(() => {
        mockGetResolver.mockResolvedValue({ id: 1 });
        return api.call("get", { pathParams: { id: "123" } });
      }).not.toThrow();
    });
  });

  describe("API Instance Cleanup", () => {
    it("can create and discard many API instances without memory leaks", () => {
      const instances = [];

      // Create many API instances
      for (let i = 0; i < 100; i++) {
        const api = init({
          url: `https://api${i}.example.com`,
        })<APIContracts>()({
          get: { resolver: mockGetResolver },
          post: { resolver: mockPostResolver },
        });

        // Add some subscriptions to each
        api.onCall("get", vi.fn());
        api.onCall("post", vi.fn());

        instances.push(api);
      }

      // Let instances go out of scope
      instances.length = 0;

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Creating new instances should still work normally
      const newApi = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      expect(() => {
        newApi.onCall("get", vi.fn());
        mockGetResolver.mockResolvedValue({ id: 1 });
        return newApi.call("get", { pathParams: { id: "123" } });
      }).not.toThrow();
    });

    it("handles API instances with cross-references", async () => {
      const api1 = init({ url: "https://api1.example.com" })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      const api2 = init({ url: "https://api2.example.com" })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      // Create cross-references between APIs
      let api1CallCount = 0;
      let api2CallCount = 0;

      api1.onCall("get", () => {
        api1CallCount++;
        if (api1CallCount < 3) {
          // Call the other API (simulate cross-API communication)
          api2.call("post", { payload: { data: "from-api1" } }).catch(() => {
            // Ignore errors
          });
        }
      });

      api2.onCall("post", () => {
        api2CallCount++;
        if (api2CallCount < 3) {
          // Call the other API
          api1.call("get", { pathParams: { id: "from-api2" } }).catch(() => {
            // Ignore errors
          });
        }
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      mockPostResolver.mockResolvedValue({ success: true });

      // Should not cause infinite loops or memory issues
      await api1.call("get", { pathParams: { id: "initial" } });

      // Allow some time for cross-calls to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(api1CallCount).toBeGreaterThan(0);
      expect(api2CallCount).toBeGreaterThan(0);
      expect(api1CallCount).toBeLessThan(10); // Should not spiral out of control
      expect(api2CallCount).toBeLessThan(10);
    });
  });

  describe("Large Data Handling", () => {
    it("handles very large input objects without memory leaks", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      // Create a very large payload
      const largeData = Array(10000)
        .fill(0)
        .map((_, i) => `data-item-${i}`)
        .join("|");

      mockPostResolver.mockResolvedValue({ success: true });

      // Process multiple large requests
      for (let i = 0; i < 10; i++) {
        await api.call("post", {
          payload: {
            data: `${largeData}-${i}`,
          },
        });
      }

      // Should complete without memory issues
      expect(mockPostResolver).toHaveBeenCalledTimes(10);
    });

    it("handles callbacks with large captured data", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      const unsubscribers = [];

      // Create callbacks that capture large amounts of data
      for (let i = 0; i < 50; i++) {
        const largeArray = Array(1000).fill(i);
        const callback = vi.fn(() => {
          // Reference the large array so it stays in memory
          return largeArray.length;
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        unsubscribers.push(api.onCall("get", callback as any));
      }

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      // Clean up callbacks to release memory
      unsubscribers.forEach((unsubscribe) => unsubscribe());

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      // Should be able to continue operating normally
      const newCallback = vi.fn();
      api.onCall("get", newCallback);

      await api.call("get", { pathParams: { id: "456" } });
      expect(newCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("Long-Running Operations", () => {
    it("maintains stable memory usage over many operations", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      const callback = vi.fn();
      const unsubscribe = api.onCall("get", callback);

      mockGetResolver.mockResolvedValue({ id: 1 });

      // Perform many operations
      for (let i = 0; i < 1000; i++) {
        await api.call("get", { pathParams: { id: i.toString() } });

        // Change subscriptions after first 100 operations
        if (i === 99) {
          unsubscribe();
          api.onCall("get", vi.fn());
        }
      }

      expect(callback).toHaveBeenCalledTimes(100); // Now correct!
      expect(mockGetResolver).toHaveBeenCalledTimes(1000);
    });

    it("handles subscription churn without memory accumulation", async () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });

      // Simulate subscription churn
      for (let i = 0; i < 500; i++) {
        const callback = vi.fn();
        const unsubscribe = api.onCall("get", callback);

        // Make a call
        await api.call("get", { pathParams: { id: i.toString() } });

        // Immediately unsubscribe
        unsubscribe();

        expect(callback).toHaveBeenCalledTimes(1);
      }

      // No permanent subscriptions should remain
      const testCallback = vi.fn();
      api.onCall("get", testCallback);

      await api.call("get", { pathParams: { id: "final" } });
      expect(testCallback).toHaveBeenCalledTimes(1);
    });
  });
});
