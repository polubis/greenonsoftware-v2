import { describe, it, expect, vi, beforeEach } from "vitest";
import { init, check } from "../core";
import type { ErrorVariant } from "../models";

describe("Edge Coverage Tests - Final 100%", () => {
  type TestContracts = {
    test: {
      dto: { id: number };
      error: ErrorVariant<"not_found", 404>;
    };
  };

  const mockResolver = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("onFail Memory Cleanup - Lines 159-160", () => {
    it("should delete onFail map entry when last callback is removed", async () => {
      const api = init()<TestContracts>()({
        test: { resolver: mockResolver },
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // Add multiple callbacks
      const unsubscribe1 = api.onFail("test", callback1);
      const unsubscribe2 = api.onFail("test", callback2);

      // Test that callbacks work
      mockResolver.mockRejectedValue(new Error("Test error"));
      await expect(api.call("test")).rejects.toThrow("Test error");
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove first callback - map should still exist
      unsubscribe1();

      // Test that remaining callback still works
      vi.clearAllMocks();
      mockResolver.mockRejectedValue(new Error("Test error 2"));
      // @ts-expect-error - Missing resolver
      await expect(api.call("test", {})).rejects.toThrow("Test error 2");
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove last callback - this should trigger map cleanup (lines 159-160)
      unsubscribe2();

      // Test that no callbacks are called after complete cleanup
      vi.clearAllMocks();
      mockResolver.mockRejectedValue(new Error("Test error 3"));
      // @ts-expect-error - Missing resolver
      await expect(api.call("test", {})).rejects.toThrow("Test error 3");
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });

  describe("getRawSchema Empty Case - Lines 415-416", () => {
    it("should return undefined when no schemas have __rawSchema property", () => {
      const customValidator1 = check((data: unknown) => data as { id: number });
      const customValidator2 = check(
        (data: unknown) => data as { name: string },
      );

      const api = init()<TestContracts>()({
        test: {
          resolver: mockResolver,
          schemas: {
            dto: customValidator1, // No __rawSchema
            pathParams: customValidator2, // No __rawSchema
          },
        },
      });

      // This should trigger lines 415-416 (return undefined when no raw schemas found)
      const rawSchemas = api.getRawSchema("test");
      expect(rawSchemas).toBeUndefined();
    });

    it("should return undefined when schemas object exists but is effectively empty of raw schemas", () => {
      const funcWithoutRawSchema = (data: unknown) => data as { id: number };

      const api = init()<TestContracts>()({
        test: {
          resolver: mockResolver,
          schemas: {
            dto: funcWithoutRawSchema, // Function but no __rawSchema property
          },
        },
      });

      // This should also trigger lines 415-416
      const rawSchemas = api.getRawSchema("test");
      expect(rawSchemas).toBeUndefined();
    });

    it("should return undefined when no schemas are defined at all", () => {
      const api = init()<TestContracts>()({
        test: {
          resolver: mockResolver,
          // No schemas property at all
        },
      });

      // This should trigger the early return path for undefined schemas
      const rawSchemas = api.getRawSchema("test");
      expect(rawSchemas).toBeUndefined();
    });
  });

  describe("Additional Edge Cases for Complete Coverage", () => {
    it("should handle onOk map cleanup when last callback is removed", async () => {
      const api = init()<TestContracts>()({
        test: { resolver: mockResolver },
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // Add multiple onOk callbacks
      const unsubscribe1 = api.onOk("test", callback1);
      const unsubscribe2 = api.onOk("test", callback2);

      // Test that callbacks work
      mockResolver.mockResolvedValue({ id: 1 });
      // @ts-expect-error - Missing resolver
      await expect(api.call("test", {})).resolves.toEqual({ id: 1 });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove first callback
      unsubscribe1();

      // Test that remaining callback still works
      vi.clearAllMocks();
      mockResolver.mockResolvedValue({ id: 2 });
      // @ts-expect-error - Missing resolver
      await expect(api.call("test", {})).resolves.toEqual({ id: 2 });
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove last callback - this should trigger map cleanup
      unsubscribe2();

      // Test that no callbacks are called after complete cleanup
      vi.clearAllMocks();
      mockResolver.mockResolvedValue({ id: 3 });
      // @ts-expect-error - Missing resolver
      await expect(api.call("test", {})).resolves.toEqual({ id: 3 });
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });

    it("should handle onCall map cleanup when last callback is removed", async () => {
      const api = init()<TestContracts>()({
        test: { resolver: mockResolver },
      });

      const callback1 = vi.fn();
      const callback2 = vi.fn();

      // Add multiple onCall callbacks
      const unsubscribe1 = api.onCall("test", callback1);
      const unsubscribe2 = api.onCall("test", callback2);

      // Test that callbacks work
      mockResolver.mockResolvedValue({ id: 1 });
      // @ts-expect-error - Missing resolver
      await expect(api.call("test", {})).resolves.toEqual({ id: 1 });
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove first callback
      unsubscribe1();

      // Test that remaining callback still works
      vi.clearAllMocks();
      mockResolver.mockResolvedValue({ id: 2 });
      // @ts-expect-error - Missing resolver
      await expect(api.call("test", {})).resolves.toEqual({ id: 2 });
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledTimes(1);

      // Remove last callback - this should trigger map cleanup
      unsubscribe2();

      // Test that no callbacks are called after complete cleanup
      vi.clearAllMocks();
      mockResolver.mockResolvedValue({ id: 3 });
      // @ts-expect-error - Missing resolver
      await expect(api.call("test", {})).resolves.toEqual({ id: 3 });
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
    });
  });
});
