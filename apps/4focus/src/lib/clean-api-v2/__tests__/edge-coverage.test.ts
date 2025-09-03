import { describe, it, expect, vi, beforeEach } from "vitest";
import { init, check } from "../core";
import type { ErrorVariant } from "../models";

describe("API Edge Cases and Callback Management", () => {
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

  describe("when managing error callbacks", () => {
    it("should allow multiple callbacks and unsubscribe independently", async () => {
      const api = init()<TestContracts>()({
        test: { resolver: mockResolver },
      });

      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const unsubscribeFirst = api.onFail("test", firstCallback);
      const unsubscribeSecond = api.onFail("test", secondCallback);

      mockResolver.mockRejectedValue(new Error("Test error"));
      await expect(api.call("test")).rejects.toThrow("Test error");

      expect(firstCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).toHaveBeenCalledTimes(1);

      unsubscribeFirst();

      vi.clearAllMocks();
      mockResolver.mockRejectedValue(new Error("Second error"));
      await expect(api.call("test")).rejects.toThrow("Second error");

      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).toHaveBeenCalledTimes(1);

      unsubscribeSecond();

      vi.clearAllMocks();
      mockResolver.mockRejectedValue(new Error("Third error"));
      await expect(api.call("test")).rejects.toThrow("Third error");

      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).not.toHaveBeenCalled();
    });
  });

  describe("when managing success callbacks", () => {
    it("should allow multiple callbacks and unsubscribe independently", async () => {
      const api = init()<TestContracts>()({
        test: { resolver: mockResolver },
      });

      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const unsubscribeFirst = api.onOk("test", firstCallback);
      const unsubscribeSecond = api.onOk("test", secondCallback);

      mockResolver.mockResolvedValue({ id: 1 });
      const result = await api.call("test");

      expect(result).toEqual({ id: 1 });
      expect(firstCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).toHaveBeenCalledTimes(1);

      unsubscribeFirst();

      vi.clearAllMocks();
      mockResolver.mockResolvedValue({ id: 2 });
      const secondResult = await api.call("test");

      expect(secondResult).toEqual({ id: 2 });
      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).toHaveBeenCalledTimes(1);

      unsubscribeSecond();

      vi.clearAllMocks();
      mockResolver.mockResolvedValue({ id: 3 });
      const thirdResult = await api.call("test");

      expect(thirdResult).toEqual({ id: 3 });
      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).not.toHaveBeenCalled();
    });
  });

  describe("when managing call callbacks", () => {
    it("should allow multiple callbacks and unsubscribe independently", async () => {
      const api = init()<TestContracts>()({
        test: { resolver: mockResolver },
      });

      const firstCallback = vi.fn();
      const secondCallback = vi.fn();

      const unsubscribeFirst = api.onCall("test", firstCallback);
      const unsubscribeSecond = api.onCall("test", secondCallback);

      mockResolver.mockResolvedValue({ id: 1 });
      const result = await api.call("test");

      expect(result).toEqual({ id: 1 });
      expect(firstCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).toHaveBeenCalledTimes(1);

      unsubscribeFirst();

      vi.clearAllMocks();
      mockResolver.mockResolvedValue({ id: 2 });
      const secondResult = await api.call("test");

      expect(secondResult).toEqual({ id: 2 });
      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).toHaveBeenCalledTimes(1);

      unsubscribeSecond();

      vi.clearAllMocks();
      mockResolver.mockResolvedValue({ id: 3 });
      const thirdResult = await api.call("test");

      expect(thirdResult).toEqual({ id: 3 });
      expect(firstCallback).not.toHaveBeenCalled();
      expect(secondCallback).not.toHaveBeenCalled();
    });
  });

  describe("when retrieving schema information", () => {
    it("should return undefined when no schemas are configured", () => {
      const api = init()<TestContracts>()({
        test: {
          resolver: mockResolver,
        },
      });

      const schemas = api.getRawSchema("test");
      expect(schemas).toBeUndefined();
    });

    it("should return undefined when schemas lack raw schema information", () => {
      const customValidator = check((data: unknown) => data as { id: number });

      const api = init()<TestContracts>()({
        test: {
          resolver: mockResolver,
          schemas: {
            dto: customValidator,
          },
        },
      });

      const schemas = api.getRawSchema("test");
      expect(schemas).toBeUndefined();
    });

    it("should return undefined when using function validators without raw schemas", () => {
      const functionValidator = (data: unknown) => data as { id: number };

      const api = init()<TestContracts>()({
        test: {
          resolver: mockResolver,
          schemas: {
            dto: functionValidator,
          },
        },
      });

      const schemas = api.getRawSchema("test");
      expect(schemas).toBeUndefined();
    });
  });

  describe("when handling multiple validator types", () => {
    it("should work with mixed validator configurations", () => {
      const customValidator = check((data: unknown) => data as { id: number });
      const functionValidator = (data: unknown) => data as { name: string };

      const api = init()<TestContracts>()({
        test: {
          resolver: mockResolver,
          schemas: {
            dto: customValidator,
            pathParams: functionValidator,
          },
        },
      });

      const schemas = api.getRawSchema("test");
      expect(schemas).toBeUndefined();
    });
  });
});
