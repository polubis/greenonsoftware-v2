/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { init } from "../core";
import { ValidationException } from "../models";
import type { ErrorVariant } from "../models";

describe("Schema Validation Edge Cases", () => {
  type APIContracts = {
    get: {
      dto: { id: number; name: string };
      error: ErrorVariant<"not_found", 404>;
      pathParams: { id: string };
    };
    post: {
      dto: { success: boolean };
      error: ErrorVariant<"bad_request", 400>;
      payload: { data: string; count: number };
    };
    complex: {
      dto: { nested: { deep: { value: string } } };
      error: ErrorVariant<"error", 500>;
      searchParams: { filters: string[] };
      extra: { metadata: Record<string, unknown> };
    };
  };

  const mockGetResolver = vi.fn();
  const mockPostResolver = vi.fn();
  const mockComplexResolver = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Non-ValidationException Errors in Schemas", () => {
    it("handles schemas that throw regular Error instances", () => {
      const api = init()<APIContracts>()({
        get: {
          resolver: mockGetResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            pathParams: () => {
              throw new Error("Regular error in validation");
            },
          },
        },
        post: { resolver: mockPostResolver },
        complex: { resolver: mockComplexResolver },
      });

      expect(() => api.pathParams("get", { id: "123" })).toThrow(
        "Regular error in validation",
      );
    });

    it("handles schemas that throw custom error types", () => {
      class CustomValidationError extends Error {
        constructor(
          public field: string,
          message: string,
        ) {
          super(message);
          this.name = "CustomValidationError";
        }
      }

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: {
          resolver: mockPostResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            payload: () => {
              throw new CustomValidationError(
                "data",
                "Custom validation failed",
              );
            },
          },
        },
        complex: { resolver: mockComplexResolver },
      });

      expect(() => api.payload("post", { data: "test", count: 1 })).toThrow(
        CustomValidationError,
      );
    });

    it("handles schemas that throw non-Error objects", () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        complex: {
          resolver: mockComplexResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            dto: () => {
              throw "String error";
            },
          },
        },
      });

      expect(() =>
        api.dto("complex", { nested: { deep: { value: "test" } } }),
      ).toThrow("String error");
    });

    it("handles schemas that throw null or undefined", () => {
      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        complex: {
          resolver: mockComplexResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            searchParams: () => {
              throw null;
            },
          },
        },
      });

      expect(() =>
        api.searchParams("complex", { filters: ["test"] }),
      ).toThrow();
    });
  });

  describe("Schemas Returning Unexpected Types", () => {
    it("handles schema that returns undefined", () => {
      const undefinedValidator = vi.fn(
        () => undefined as unknown as { id: string },
      );

      const api = init()<APIContracts>()({
        get: {
          resolver: mockGetResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            pathParams: undefinedValidator,
          },
        },
        post: { resolver: mockPostResolver },
        complex: { resolver: mockComplexResolver },
      });

      const input = { id: "123" };
      const result = api.pathParams("get", input);

      // ✅ Validator was called and returned undefined
      expect(undefinedValidator).toHaveBeenCalledWith(input);

      // ✅ But API always returns the original input
      expect(result).toBe(input);
      expect(result).not.toBeUndefined();
    });

    it("handles schema that returns null", () => {
      const nullValidator = vi.fn(
        () => null as unknown as { data: string; count: number },
      );

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: {
          resolver: mockPostResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            payload: nullValidator,
          },
        },
        complex: { resolver: mockComplexResolver },
      });

      const input = { data: "test", count: 1 };
      const result = api.payload("post", input);

      // ✅ Validator was called and returned null
      expect(nullValidator).toHaveBeenCalledWith(input);

      // ✅ But API always returns the original input
      expect(result).toBe(input);
      expect(result).not.toBeNull();
    });

    it("handles schema that returns wrong primitive type", () => {
      const wrongTypeValidator = vi.fn(
        () => "wrong type" as unknown as { id: number; name: string },
      );

      const api = init()<APIContracts>()({
        get: {
          resolver: mockGetResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            dto: wrongTypeValidator,
          },
        },
        post: { resolver: mockPostResolver },
        complex: { resolver: mockComplexResolver },
      });

      const input = { id: 1, name: "test" };
      const result = api.dto("get", input);

      // ✅ Validator was called and returned wrong type
      expect(wrongTypeValidator).toHaveBeenCalledWith(input);

      // ✅ But API always returns the original input
      expect(result).toBe(input);
      expect(result).not.toBe("wrong type");
    });

    it("handles schema that returns completely different object structure", () => {
      const differentStructureValidator = vi.fn(
        () =>
          ({
            wrongStructure: true,
            notMetadata: "wrong",
          }) as unknown as { metadata: Record<string, unknown> },
      );

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        complex: {
          resolver: mockComplexResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            extra: differentStructureValidator,
          },
        },
      });

      const input = { metadata: { key: "value" } };
      const result = api.extra("complex", input);

      // ✅ Validator was called and returned different structure
      expect(differentStructureValidator).toHaveBeenCalledWith(input);

      // ✅ But API always returns the original input
      expect(result).toBe(input);
      expect(result).not.toEqual({
        wrongStructure: true,
        notMetadata: "wrong",
      });
    });
  });

  describe("Schema Performance and Memory Edge Cases", () => {
    it("handles schema validation on very large objects", () => {
      const largeObject = {
        data: Array(10000)
          .fill(0)
          .map((_, i) => `item-${i}`)
          .join(","),
        count: 10000,
      };

      const heavyValidator = vi.fn((data: unknown) => {
        // Simulate heavy validation work
        const str = JSON.stringify(data);
        return str.length > 0 ? data : data;
      });

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: {
          resolver: mockPostResolver,
          schemas: {
            payload: heavyValidator as any,
          },
        },
        complex: { resolver: mockComplexResolver },
      });

      const result = api.payload("post", largeObject);
      expect(heavyValidator).toHaveBeenCalledWith(largeObject);
      expect(result).toEqual(largeObject);
    });

    it("handles schema with deeply nested validation", () => {
      const deeplyNested = {
        nested: {
          deep: {
            value: "test",
            deeper: {
              evenDeeper: {
                stillGoing: {
                  almostThere: {
                    finalValue: "deep",
                  },
                },
              },
            },
          },
        },
      };

      const deepValidator = vi.fn((data: unknown) => {
        // Simulate recursive validation
        const validateRecursively = (obj: unknown, depth = 0): unknown => {
          if (depth > 100) return obj; // Prevent infinite recursion
          if (typeof obj === "object" && obj !== null) {
            Object.values(obj).forEach((value) =>
              validateRecursively(value, depth + 1),
            );
          }
          return obj;
        };
        return validateRecursively(data);
      });

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        complex: {
          resolver: mockComplexResolver,
          schemas: {
            dto: deepValidator as any,
          },
        },
      });

      const result = api.dto("complex", deeplyNested);
      expect(deepValidator).toHaveBeenCalledWith(deeplyNested);
      expect(result).toEqual(deeplyNested);
    });
  });

  describe("Circular Reference Scenarios", () => {
    it("handles objects with circular references in validation", () => {
      const circularObj: Record<string, unknown> = {
        metadata: { key: "value" },
      };
      circularObj.self = circularObj; // Create circular reference

      const circularValidator = vi.fn((data: unknown) => {
        // Simple validation that doesn't traverse the entire object
        if (typeof data === "object" && data !== null) {
          return data;
        }
        throw new ValidationException([{ path: [], message: "Invalid type" }]);
      });

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        complex: {
          resolver: mockComplexResolver,
          schemas: {
            extra: circularValidator as any,
          },
        },
      });

      const result = api.extra("complex", circularObj as any);
      expect(circularValidator).toHaveBeenCalledWith(circularObj);
      expect(result).toBe(circularObj);
    });

    it("handles schema that creates circular references in return value", () => {
      let validatorResult: any;
      const createCircularValidator = vi.fn((data: unknown) => {
        const result: Record<string, unknown> = {
          ...(data as Record<string, unknown>),
        };
        result.circular = result; // Create circular reference in return
        validatorResult = result; // Capture the result for testing
        return result;
      });

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        complex: {
          resolver: mockComplexResolver,
          schemas: {
            extra: createCircularValidator as any,
          },
        },
      });

      const input = { metadata: { key: "value" } };
      const result = api.extra("complex", input);

      expect(createCircularValidator).toHaveBeenCalledWith(input);

      // ✅ Test that the validator created the circular reference internally
      expect(validatorResult.circular).toBe(validatorResult);

      // ✅ But the API returns the original input (not the validator's return)
      expect(result).toBe(input);
      expect(result).not.toHaveProperty("circular");
    });
  });

  describe("Schema State and Side Effects", () => {
    it("handles schema validators with internal state", () => {
      let callCount = 0;
      const statefulValidator = vi.fn((data: unknown) => {
        callCount++; // Track state in closure
        // Just validate, don't transform
        return data; // Return value is ignored anyway
      });

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: {
          resolver: mockPostResolver,
          schemas: {
            dto: statefulValidator as any,
          },
        },
        complex: { resolver: mockComplexResolver },
      });

      const input1 = { success: true };
      const input2 = { success: false };

      const result1 = api.dto("post", input1);
      const result2 = api.dto("post", input2);

      // ✅ CORRECT - expects original input back
      expect(result1).toEqual({ success: true }); // No validationCount
      expect(result2).toEqual({ success: false }); // No validationCount

      // ✅ Test the side effects separately
      expect(callCount).toBe(2);
      expect(statefulValidator).toHaveBeenCalledTimes(2);
      expect(statefulValidator).toHaveBeenNthCalledWith(1, input1);
      expect(statefulValidator).toHaveBeenNthCalledWith(2, input2);
    });

    it("handles schema validators that modify input objects", () => {
      const mutatingValidator = vi.fn((data: unknown) => {
        const obj = data as Record<string, unknown>;
        obj.mutated = true; // This mutates the original object
        return obj;
      });

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        complex: {
          resolver: mockComplexResolver,
          schemas: {
            extra: mutatingValidator as any,
          },
        },
      });

      const input = { metadata: { key: "value" } };
      const result = api.extra("complex", input);

      // ✅ The validator mutated the input object
      expect(input).toHaveProperty("mutated", true);
      expect(result).toBe(input); // Same object reference
      expect(result).toHaveProperty("mutated", true);
    });

    it("handles schema validators with async-like behavior (but synchronous)", () => {
      const asyncLikeValidator = vi.fn((data: unknown) => {
        // Simulate async-like work with synchronous delays
        const start = Date.now();
        while (Date.now() - start < 10) {
          // Busy wait for 10ms
        }
        return data;
      });

      const api = init()<APIContracts>()({
        get: {
          resolver: mockGetResolver,
          schemas: {
            pathParams: asyncLikeValidator as any,
          },
        },
        post: { resolver: mockPostResolver },
        complex: { resolver: mockComplexResolver },
      });

      const start = Date.now();
      const result = api.pathParams("get", { id: "123" });
      const duration = Date.now() - start;

      expect(asyncLikeValidator).toHaveBeenCalledWith({ id: "123" });
      expect(result).toEqual({ id: "123" });
      expect(duration).toBeGreaterThanOrEqual(10);
    });
  });

  describe("Multiple Schema Interactions", () => {
    it("handles validation errors in multiple schemas for same endpoint", () => {
      const failingPayloadValidator = vi.fn(() => {
        throw new ValidationException([
          { path: ["data"], message: "Invalid data" },
        ]);
      });

      const passingDtoValidator = vi.fn((data: unknown) => data);

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: {
          resolver: mockPostResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            payload: failingPayloadValidator,
            dto: passingDtoValidator as any,
          },
        },
        complex: { resolver: mockComplexResolver },
      });

      expect(() => api.payload("post", { data: "test", count: 1 })).toThrow(
        ValidationException,
      );

      // DTO validator should still work independently
      expect(() => api.dto("post", { success: true })).not.toThrow();

      expect(failingPayloadValidator).toHaveBeenCalled();
      expect(passingDtoValidator).toHaveBeenCalled();
    });

    it("handles schemas that depend on each other's side effects", () => {
      const sharedState = { validationOrder: [] as string[] };

      const firstValidator = vi.fn((data: unknown) => {
        sharedState.validationOrder.push("first");
        return data;
      });

      const secondValidator = vi.fn((data: unknown) => {
        sharedState.validationOrder.push("second");
        return data;
      });

      const api = init()<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
        complex: {
          resolver: mockComplexResolver,
          schemas: {
            searchParams: firstValidator as any,
            extra: secondValidator as any,
          },
        },
      });

      api.searchParams("complex", { filters: ["test"] });
      api.extra("complex", { metadata: { key: "value" } });

      expect(sharedState.validationOrder).toEqual(["first", "second"]);
      expect(firstValidator).toHaveBeenCalledWith({ filters: ["test"] });
      expect(secondValidator).toHaveBeenCalledWith({
        metadata: { key: "value" },
      });
    });
  });
});
