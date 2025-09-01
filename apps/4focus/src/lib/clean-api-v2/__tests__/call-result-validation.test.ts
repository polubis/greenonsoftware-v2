/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { init, check } from "../core";
import { zodCheck } from "../adapters/zod";
import { ValidationException } from "../models";
import z from "zod";

describe("Call Result Validation", () => {
  describe("DTO Schema Validation", () => {
    const userResponseSchema = z.object({
      id: z.string(),
      username: z.string(),
      email: z.string().email(),
      createdAt: z.string().datetime(),
    });

    type ApiContracts = {
      createUser: {
        payload: { username: string; email: string };
        dto: z.infer<typeof userResponseSchema>;
        error: { message: string };
      };
      getUserById: {
        pathParams: { id: string };
        dto: z.infer<typeof userResponseSchema>;
        error: { message: string };
      };
    };

    it("should validate successful result against dto schema", async () => {
      const validResult = {
        id: "user-123",
        username: "testuser",
        email: "test@example.com",
        createdAt: new Date().toISOString(),
      };

      const mockResolver = vi.fn().mockResolvedValue(validResult);

      const api = init()<ApiContracts>()({
        createUser: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(userResponseSchema),
          },
        },
        getUserById: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(userResponseSchema),
          },
        },
      });

      // Test call with valid result
      const result = await api.call("createUser", {
        payload: { username: "testuser", email: "test@example.com" },
      });

      expect(result).toEqual(validResult);
      expect(mockResolver).toHaveBeenCalledTimes(1);
    });

    it("should throw ValidationException when result doesn't match dto schema", async () => {
      const invalidResult = {
        id: "user-123",
        username: "testuser",
        email: "invalid-email", // Invalid email
        createdAt: "not-a-datetime", // Invalid datetime
      };

      const mockResolver = vi.fn().mockResolvedValue(invalidResult);

      const api = init()<ApiContracts>()({
        createUser: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(userResponseSchema),
          },
        },
        getUserById: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(userResponseSchema),
          },
        },
      });

      // Test call with invalid result
      await expect(
        api.call("createUser", {
          payload: { username: "testuser", email: "test@example.com" },
        }),
      ).rejects.toThrow(ValidationException);

      expect(mockResolver).toHaveBeenCalledTimes(1);
    });

    it("should not validate when no dto schema is provided", async () => {
      const anyResult = {
        someProp: "anything",
        anotherProp: 123,
        evenInvalid: null,
      };

      const mockResolver = vi.fn().mockResolvedValue(anyResult);

      const api = init()<{
        noSchema: {
          payload: { data: string };
          dto: any;
          error: { message: string };
        };
      }>()({
        noSchema: {
          resolver: mockResolver,
          // No schemas provided
        },
      });

      // Should not throw even with "invalid" result
      const result = await api.call("noSchema", {
        payload: { data: "test" },
      });

      expect(result).toEqual(anyResult);
      expect(mockResolver).toHaveBeenCalledTimes(1);
    });

    it("should validate with custom dto validator", async () => {
      const customValidator = check((data: unknown) => {
        if (
          typeof data === "object" &&
          data !== null &&
          "id" in data &&
          "name" in data
        ) {
          return data as { id: string; name: string };
        }
        throw new ValidationException([
          { path: [], message: "Must be object with id and name" },
        ]);
      });

      const validResult = { id: "123", name: "Test" };
      const invalidResult = { id: "123" }; // Missing name

      const mockResolver = vi.fn();

      const api = init()<{
        customValidation: {
          payload: { data: string };
          dto: { id: string; name: string };
          error: { message: string };
        };
      }>()({
        customValidation: {
          resolver: mockResolver,
          schemas: {
            dto: customValidator,
          },
        },
      });

      // Test valid result
      mockResolver.mockResolvedValueOnce(validResult);
      const result1 = await api.call("customValidation", {
        payload: { data: "test" },
      });
      expect(result1).toEqual(validResult);

      // Test invalid result
      mockResolver.mockResolvedValueOnce(invalidResult);
      await expect(
        api.call("customValidation", {
          payload: { data: "test" },
        }),
      ).rejects.toThrow(ValidationException);

      expect(mockResolver).toHaveBeenCalledTimes(2);
    });
  });

  describe("SafeCall Result Validation", () => {
    const responseSchema = z.object({
      success: z.boolean(),
      data: z.string(),
    });

    type ApiContracts = {
      testEndpoint: {
        payload: { input: string };
        dto: z.infer<typeof responseSchema>;
        error: { message: string };
      };
    };

    it("should handle successful validation in safeCall", async () => {
      const validResult = { success: true, data: "test-data" };
      const mockResolver = vi.fn().mockResolvedValue(validResult);

      const api = init()<ApiContracts>()({
        testEndpoint: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(responseSchema),
          },
        },
      });

      const [success, result] = await api.safeCall("testEndpoint", {
        payload: { input: "test" },
      });

      expect(success).toBe(true);
      expect(result).toEqual(validResult);
    });

    it("should handle validation errors in safeCall", async () => {
      const invalidResult = { success: "not-boolean", data: 123 }; // Invalid types
      const mockResolver = vi.fn().mockResolvedValue(invalidResult);

      const api = init()<ApiContracts>()({
        testEndpoint: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(responseSchema),
          },
        },
      });

      const [success, error] = await api.safeCall("testEndpoint", {
        payload: { input: "test" },
      });

      expect(success).toBe(false);
      expect(error).toBeInstanceOf(ValidationException);
      expect((error as ValidationException).issues).toBeDefined();
    });

    it("should handle resolver errors separately from validation errors", async () => {
      const mockResolver = vi
        .fn()
        .mockRejectedValue(new Error("Resolver error"));

      const api = init()<ApiContracts>()({
        testEndpoint: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(responseSchema),
          },
        },
      });

      const [success, error] = await api.safeCall("testEndpoint", {
        payload: { input: "test" },
      });

      expect(success).toBe(false);
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe("Resolver error");
    });
  });

  describe("Complex Validation Scenarios", () => {
    it("should validate nested object structures", async () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            name: z.string(),
            age: z.number().min(0),
            preferences: z.object({
              theme: z.enum(["light", "dark"]),
              notifications: z.boolean(),
            }),
          }),
        }),
        metadata: z.object({
          version: z.string(),
          timestamp: z.number(),
        }),
      });

      const validResult = {
        user: {
          profile: {
            name: "John Doe",
            age: 30,
            preferences: {
              theme: "dark" as const,
              notifications: true,
            },
          },
        },
        metadata: {
          version: "1.0.0",
          timestamp: Date.now(),
        },
      };

      const invalidResult = {
        user: {
          profile: {
            name: "John Doe",
            age: -5, // Invalid age
            preferences: {
              theme: "blue", // Invalid theme
              notifications: true,
            },
          },
        },
        metadata: {
          version: "1.0.0",
          timestamp: "not-a-number", // Invalid timestamp
        },
      };

      const mockResolver = vi.fn();

      const api = init()<{
        complex: {
          payload: { data: string };
          dto: z.infer<typeof nestedSchema>;
          error: { message: string };
        };
      }>()({
        complex: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(nestedSchema),
          },
        },
      });

      // Test valid nested structure
      mockResolver.mockResolvedValueOnce(validResult);
      const result1 = await api.call("complex", { payload: { data: "test" } });
      expect(result1).toEqual(validResult);

      // Test invalid nested structure
      mockResolver.mockResolvedValueOnce(invalidResult);
      await expect(
        api.call("complex", { payload: { data: "test" } }),
      ).rejects.toThrow(ValidationException);
    });

    it("should validate array results", async () => {
      const arraySchema = z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          active: z.boolean(),
        }),
      );

      const validArray = [
        { id: "1", name: "Item 1", active: true },
        { id: "2", name: "Item 2", active: false },
        { id: "3", name: "Item 3", active: true },
      ];

      const invalidArray = [
        { id: "1", name: "Item 1", active: true },
        { id: 2, name: "Item 2", active: false }, // id should be string
        { id: "3", name: "Item 3" }, // missing active
      ];

      const mockResolver = vi.fn();

      const api = init()<{
        listItems: {
          payload: { filter: string };
          dto: z.infer<typeof arraySchema>;
          error: { message: string };
        };
      }>()({
        listItems: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(arraySchema),
          },
        },
      });

      // Test valid array
      mockResolver.mockResolvedValueOnce(validArray);
      const result1 = await api.call("listItems", {
        payload: { filter: "all" },
      });
      expect(result1).toEqual(validArray);

      // Test invalid array
      mockResolver.mockResolvedValueOnce(invalidArray);
      await expect(
        api.call("listItems", { payload: { filter: "all" } }),
      ).rejects.toThrow(ValidationException);
    });

    it("should validate optional and nullable fields", async () => {
      const optionalSchema = z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
        deletedAt: z.string().datetime().nullable(),
        tags: z.array(z.string()).optional(),
      });

      const validResults = [
        {
          id: "1",
          name: "Test",
          description: "A test item",
          deletedAt: null,
          tags: ["tag1", "tag2"],
        },
        {
          id: "2",
          name: "Test 2",
          deletedAt: null,
          // description and tags are optional
        },
        {
          id: "3",
          name: "Test 3",
          description: "Deleted item",
          deletedAt: new Date().toISOString(),
          tags: [],
        },
      ];

      const invalidResult = {
        id: "1",
        name: "Test",
        description: "A test item",
        deletedAt: "not-a-datetime", // Invalid datetime
        tags: ["tag1", 123], // Invalid tag type
      };

      const mockResolver = vi.fn();

      const api = init()<{
        getItem: {
          pathParams: { id: string };
          dto: z.infer<typeof optionalSchema>;
          error: { message: string };
        };
      }>()({
        getItem: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(optionalSchema),
          },
        },
      });

      // Test all valid variations
      for (const validResult of validResults) {
        mockResolver.mockResolvedValueOnce(validResult);
        const result = await api.call("getItem", {
          pathParams: { id: validResult.id },
        });
        expect(result).toEqual(validResult);
      }

      // Test invalid result
      mockResolver.mockResolvedValueOnce(invalidResult);
      await expect(
        api.call("getItem", { pathParams: { id: "1" } }),
      ).rejects.toThrow(ValidationException);
    });
  });

  describe("Performance and Error Details", () => {
    it("should provide detailed error information for validation failures", async () => {
      const strictSchema = z.object({
        user: z.object({
          id: z.string(),
          email: z.string().email(),
          age: z.number().min(18).max(100),
        }),
        settings: z.object({
          theme: z.enum(["light", "dark"]),
          language: z.string().min(2).max(5),
        }),
      });

      const invalidResult = {
        user: {
          id: 123, // Should be string
          email: "invalid-email", // Invalid email
          age: 15, // Too young
        },
        settings: {
          theme: "blue", // Invalid enum
          language: "toolongcode", // Too long
        },
      };

      const mockResolver = vi.fn().mockResolvedValue(invalidResult);

      const api = init()<{
        getUser: {
          pathParams: { id: string };
          dto: z.infer<typeof strictSchema>;
          error: { message: string };
        };
      }>()({
        getUser: {
          resolver: mockResolver,
          schemas: {
            dto: zodCheck(strictSchema),
          },
        },
      });

      try {
        await api.call("getUser", { pathParams: { id: "123" } });
        expect.fail("Should have thrown ValidationException");
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationException);
        const validationError = error as ValidationException;

        // Should have multiple validation issues
        expect(validationError.issues.length).toBeGreaterThanOrEqual(5);

        // Check specific error paths
        const errorPaths = validationError.issues.map((issue) => issue.path);
        expect(errorPaths).toContainEqual(["user", "id"]);
        expect(errorPaths).toContainEqual(["user", "email"]);
        expect(errorPaths).toContainEqual(["user", "age"]);
        expect(errorPaths).toContainEqual(["settings", "theme"]);
        expect(errorPaths).toContainEqual(["settings", "language"]);
      }
    });

    it("should not affect performance when no dto schema is provided", async () => {
      const largeResult = {
        data: new Array(10000).fill(0).map((_, i) => ({
          id: `item-${i}`,
          name: `Item ${i}`,
          description: `Description for item ${i}`.repeat(10),
        })),
      };

      const mockResolver = vi.fn().mockResolvedValue(largeResult);

      const api = init()<{
        getBulkData: {
          payload: { limit: number };
          dto: any;
          error: { message: string };
        };
      }>()({
        getBulkData: {
          resolver: mockResolver,
          // No schemas - should skip validation
        },
      });

      const start = performance.now();
      const result = await api.call("getBulkData", {
        payload: { limit: 10000 },
      });
      const end = performance.now();

      expect(result).toEqual(largeResult);
      // Should be fast since no validation occurs
      expect(end - start).toBeLessThan(100); // Should complete in under 100ms
    });
  });

  describe("Integration with Input Validation", () => {
    it("should validate both input and output when both schemas are provided", async () => {
      const inputSchema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      });

      const outputSchema = z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        status: z.enum(["active", "inactive"]),
      });

      const mockResolver = vi.fn().mockImplementation(({ payload }) => {
        return Promise.resolve({
          id: "user-123",
          name: payload.name,
          email: payload.email,
          status: "active" as const,
        });
      });

      const api = init()<{
        createUser: {
          payload: z.infer<typeof inputSchema>;
          dto: z.infer<typeof outputSchema>;
          error: { message: string };
        };
      }>()({
        createUser: {
          resolver: mockResolver,
          schemas: {
            payload: zodCheck(inputSchema),
            dto: zodCheck(outputSchema),
          },
        },
      });

      // Test valid input and output
      const result = await api.call("createUser", {
        payload: { name: "John", email: "john@example.com" },
      });

      expect(result).toEqual({
        id: "user-123",
        name: "John",
        email: "john@example.com",
        status: "active",
      });

      // Test invalid input (should fail before resolver is called)
      await expect(
        api.call("createUser", {
          payload: { name: "", email: "invalid-email" }, // Invalid input
        }),
      ).rejects.toThrow(ValidationException);

      // Test scenario where input is valid but output is invalid
      mockResolver.mockResolvedValueOnce({
        id: "user-123",
        name: "John",
        email: "john@example.com",
        status: "unknown", // Invalid status
      });

      await expect(
        api.call("createUser", {
          payload: { name: "John", email: "john@example.com" },
        }),
      ).rejects.toThrow(ValidationException);
    });
  });
});
