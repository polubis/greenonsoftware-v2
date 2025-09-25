/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect } from "vitest";
import * as z from "zod";
import { zodCheck, zodCheckAsync } from "../zod";
import { ValidationException } from "../../models";

describe("Zod adapter works when", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().positive(),
  });

  it("validation passes for valid data", () => {
    const data = { name: "John", age: 30 };
    const result = zodCheck(schema)(data);
    expect(result).toEqual(data);
  });

  it("validation throws ValidationException for invalid data", () => {
    const invalidData = { name: "", age: -5 };
    try {
      zodCheck(schema)(invalidData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      if (error instanceof ValidationException) {
        expect(error.issues).toEqual([
          {
            path: ["name"],
            message: "Too small: expected string to have >=1 characters",
          },
          { path: ["age"], message: "Too small: expected number to be >0" },
        ]);
      }
    }
  });

  it("validation returns the parsed data on success", () => {
    const data = { name: "Jane", age: 25, extra: "field" };
    const result = zodCheck(schema)(data);
    expect(result).toEqual({ name: "Jane", age: 25 });
  });
});

describe("Zod adapter type inference works when", () => {
  it("simple object schema infers correct types", () => {
    const userSchema = z.object({
      id: z.number(),
      name: z.string(),
      isActive: z.boolean(),
    });

    const validator = zodCheck(userSchema);
    const result = validator({ id: 1, name: "Alice", isActive: true });

    // TypeScript should infer the correct types
    expect(typeof result.id).toBe("number");
    expect(typeof result.name).toBe("string");
    expect(typeof result.isActive).toBe("boolean");

    // These assertions help verify type inference at compile time
    const _id: number = result.id;
    const _name: string = result.name;
    const _isActive: boolean = result.isActive;

    expect(result).toEqual({ id: 1, name: "Alice", isActive: true });
  });

  it("nested object schema infers correct types", () => {
    const addressSchema = z.object({
      street: z.string(),
      city: z.string(),
      zipCode: z.string(),
    });

    const personSchema = z.object({
      name: z.string(),
      age: z.number(),
      address: addressSchema,
    });

    const validator = zodCheck(personSchema);
    const testData = {
      name: "Bob",
      age: 30,
      address: {
        street: "123 Main St",
        city: "Anytown",
        zipCode: "12345",
      },
    };

    const result = validator(testData);

    // TypeScript should infer nested types correctly
    expect(typeof result.name).toBe("string");
    expect(typeof result.age).toBe("number");
    expect(typeof result.address).toBe("object");
    expect(typeof result.address.street).toBe("string");
    expect(typeof result.address.city).toBe("string");
    expect(typeof result.address.zipCode).toBe("string");

    // Type assertions for compile-time verification
    const _name: string = result.name;
    const _age: number = result.age;
    const _address: { street: string; city: string; zipCode: string } =
      result.address;
    const _street: string = result.address.street;

    expect(result).toEqual(testData);
  });

  it("array schema infers correct types", () => {
    const tagsSchema = z.array(z.string());
    const validator = zodCheck(tagsSchema);

    const result = validator(["tag1", "tag2", "tag3"]);

    // TypeScript should infer array type
    expect(Array.isArray(result)).toBe(true);
    expect(typeof result[0]).toBe("string");

    // Type assertion for compile-time verification
    const _tags: string[] = result;
    const _firstTag: string = result[0];

    expect(result).toEqual(["tag1", "tag2", "tag3"]);
  });

  it("union schema infers correct types", () => {
    const statusSchema = z.union([
      z.literal("pending"),
      z.literal("approved"),
      z.literal("rejected"),
    ]);

    const validator = zodCheck(statusSchema);

    const result1 = validator("pending");
    const result2 = validator("approved");
    const result3 = validator("rejected");

    // TypeScript should infer union type
    expect(typeof result1).toBe("string");
    expect(typeof result2).toBe("string");
    expect(typeof result3).toBe("string");

    // Type assertions for compile-time verification
    const _status1: "pending" | "approved" | "rejected" = result1;
    const _status2: "pending" | "approved" | "rejected" = result2;
    const _status3: "pending" | "approved" | "rejected" = result3;

    expect(result1).toBe("pending");
    expect(result2).toBe("approved");
    expect(result3).toBe("rejected");
  });

  it("optional fields schema infers correct types", () => {
    const productSchema = z.object({
      id: z.number(),
      name: z.string(),
      description: z.string().optional(),
      price: z.number(),
      discount: z.number().optional(),
    });

    const validator = zodCheck(productSchema);

    const fullProduct = {
      id: 1,
      name: "Widget",
      description: "A useful widget",
      price: 29.99,
      discount: 0.1,
    };

    const minimalProduct = {
      id: 2,
      name: "Gadget",
      price: 19.99,
    };

    const result1 = validator(fullProduct);
    const result2 = validator(minimalProduct);

    // TypeScript should infer optional fields correctly
    expect(typeof result1.id).toBe("number");
    expect(typeof result1.name).toBe("string");
    expect(typeof result1.description).toBe("string");
    expect(typeof result1.price).toBe("number");
    expect(typeof result1.discount).toBe("number");

    expect(typeof result2.id).toBe("number");
    expect(typeof result2.name).toBe("string");
    expect(result2.description).toBeUndefined();
    expect(typeof result2.price).toBe("number");
    expect(result2.discount).toBeUndefined();

    // Type assertions for compile-time verification
    const _fullProduct: {
      id: number;
      name: string;
      description?: string;
      price: number;
      discount?: number;
    } = result1;

    const _minimalProduct: {
      id: number;
      name: string;
      description?: string;
      price: number;
      discount?: number;
    } = result2;

    expect(result1).toEqual(fullProduct);
    expect(result2).toEqual(minimalProduct);
  });

  it("transformed schema infers correct output types", () => {
    const dateStringSchema = z.string().transform((str) => new Date(str));
    const validator = zodCheck(dateStringSchema);

    const result = validator("2023-12-01");

    // TypeScript should infer transformed type (Date, not string)
    expect(result instanceof Date).toBe(true);
    expect(typeof result.getFullYear).toBe("function");

    // Type assertion for compile-time verification
    const _date: Date = result;

    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(11); // December is month 11
    expect(result.getDate()).toBe(1);
  });

  it("enum schema infers correct types", () => {
    enum Color {
      RED = "red",
      GREEN = "green",
      BLUE = "blue",
    }

    const colorSchema = z.nativeEnum(Color);
    const validator = zodCheck(colorSchema);

    const result = validator("red");

    // TypeScript should infer enum type
    expect(typeof result).toBe("string");
    expect(Object.values(Color)).toContain(result);

    // Type assertion for compile-time verification
    const _color: Color = result;

    expect(result).toBe(Color.RED);
  });

  it("record schema infers correct types", () => {
    const configSchema = z.record(z.string(), z.number());
    const validator = zodCheck(configSchema);

    const result = validator({
      timeout: 5000,
      retries: 3,
      batchSize: 100,
    });

    // TypeScript should infer Record<string, number>
    expect(typeof result).toBe("object");
    expect(typeof result.timeout).toBe("number");
    expect(typeof result.retries).toBe("number");
    expect(typeof result.batchSize).toBe("number");

    // Type assertion for compile-time verification
    const _config: Record<string, number> = result;
    const _timeout: number = result.timeout;

    expect(result.timeout).toBe(5000);
    expect(result.retries).toBe(3);
    expect(result.batchSize).toBe(100);
  });

  it("complex mixed schema infers correct types", () => {
    const apiResponseSchema = z.object({
      success: z.boolean(),
      data: z.array(
        z.object({
          id: z.number(),
          title: z.string(),
          tags: z.array(z.string()),
          metadata: z.record(z.string(), z.union([z.string(), z.number()])),
        }),
      ),
      pagination: z
        .object({
          page: z.number(),
          totalPages: z.number(),
          hasNext: z.boolean(),
        })
        .optional(),
    });

    const validator = zodCheck(apiResponseSchema);

    const testData = {
      success: true,
      data: [
        {
          id: 1,
          title: "First Item",
          tags: ["tag1", "tag2"],
          metadata: {
            priority: "high",
            score: 95,
          },
        },
        {
          id: 2,
          title: "Second Item",
          tags: ["tag3"],
          metadata: {
            category: "test",
            count: 42,
          },
        },
      ],
      pagination: {
        page: 1,
        totalPages: 5,
        hasNext: true,
      },
    };

    const result = validator(testData);

    // TypeScript should infer all nested types correctly
    expect(typeof result.success).toBe("boolean");
    expect(Array.isArray(result.data)).toBe(true);
    expect(typeof result.data[0].id).toBe("number");
    expect(typeof result.data[0].title).toBe("string");
    expect(Array.isArray(result.data[0].tags)).toBe(true);
    expect(typeof result.data[0].tags[0]).toBe("string");
    expect(typeof result.data[0].metadata).toBe("object");
    expect(typeof result.pagination).toBe("object");
    expect(typeof result.pagination!.page).toBe("number");

    // Complex type assertion for compile-time verification
    const _response: {
      success: boolean;
      data: Array<{
        id: number;
        title: string;
        tags: string[];
        metadata: Record<string, string | number>;
      }>;
      pagination?: {
        page: number;
        totalPages: number;
        hasNext: boolean;
      };
    } = result;

    expect(result).toEqual(testData);
  });
});

describe("Zod async adapter works when", () => {
  const userSchema = z.object({
    name: z.string().min(1),
    age: z.number().positive(),
    email: z.string().email(),
  });

  it("async validation passes for valid data", async () => {
    const validator = zodCheckAsync(userSchema);
    const data = { name: "John", age: 30, email: "john@example.com" };

    const result = await validator(data);
    expect(result).toEqual(data);
  });

  it("async validation throws ValidationException for invalid data", async () => {
    const validator = zodCheckAsync(userSchema);
    const invalidData = { name: "", age: -5, email: "invalid-email" };

    await expect(validator(invalidData)).rejects.toThrow(ValidationException);

    try {
      await validator(invalidData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      if (error instanceof ValidationException) {
        expect(error.issues.length).toBeGreaterThan(0);
        expect(error.issues.some((issue) => issue.path.includes("name"))).toBe(
          true,
        );
        expect(error.issues.some((issue) => issue.path.includes("age"))).toBe(
          true,
        );
        expect(error.issues.some((issue) => issue.path.includes("email"))).toBe(
          true,
        );
      }
    }
  });

  it("async validation returns parsed data on success", async () => {
    const validator = zodCheckAsync(userSchema);
    const data = {
      name: "Jane",
      age: 25,
      email: "jane@example.com",
      extra: "field",
    };

    const result = await validator(data);
    expect(result).toEqual({
      name: "Jane",
      age: 25,
      email: "jane@example.com",
    });
  });

  it("async validation with transformations works correctly", async () => {
    const transformSchema = z.object({
      name: z.string().transform((s) => s.trim().toLowerCase()),
      createdAt: z.string().transform((s) => new Date(s)),
      tags: z.array(z.string()).transform((arr) => arr.map((s) => s.trim())),
    });

    const validator = zodCheckAsync(transformSchema);
    const data = {
      name: "  ALICE  ",
      createdAt: "2023-12-01T10:00:00Z",
      tags: ["  tag1  ", "  tag2  "],
    };

    const result = await validator(data);

    expect(result.name).toBe("alice");
    expect(result.createdAt).toBeInstanceOf(Date);
    expect(result.createdAt.getFullYear()).toBe(2023);
    expect(result.tags).toEqual(["tag1", "tag2"]);

    // Type assertions for compile-time verification
    const _name: string = result.name;
    const _date: Date = result.createdAt;
    const _tags: string[] = result.tags;
  });

  it("async validation with async transformations", async () => {
    const asyncTransformSchema = z.string().transform(async (str) => {
      // Simulate async operation (e.g., database lookup)
      await new Promise((resolve) => setTimeout(resolve, 1));
      return str.toUpperCase();
    });

    const validator = zodCheckAsync(asyncTransformSchema);

    const result = await validator("hello world");
    expect(result).toBe("HELLO WORLD");

    // Type assertion for compile-time verification
    const _result: string = result;
  });

  it("async validation preserves type inference for complex schemas", async () => {
    const complexSchema = z.object({
      id: z.number(),
      profile: z.object({
        firstName: z.string(),
        lastName: z.string(),
        preferences: z.object({
          theme: z.enum(["light", "dark"]),
          notifications: z.boolean(),
        }),
      }),
      roles: z.array(z.string()),
      metadata: z.record(z.string(), z.union([z.string(), z.number()])),
    });

    const validator = zodCheckAsync(complexSchema);
    const testData = {
      id: 1,
      profile: {
        firstName: "Alice",
        lastName: "Smith",
        preferences: {
          theme: "dark" as const,
          notifications: true,
        },
      },
      roles: ["user", "admin"],
      metadata: {
        score: 95,
        level: "expert",
        version: 1.2,
      },
    };

    const result = await validator(testData);

    // Runtime checks
    expect(typeof result.id).toBe("number");
    expect(typeof result.profile.firstName).toBe("string");
    expect(typeof result.profile.preferences.theme).toBe("string");
    expect(typeof result.profile.preferences.notifications).toBe("boolean");
    expect(Array.isArray(result.roles)).toBe(true);
    expect(typeof result.metadata.score).toBe("number");
    expect(typeof result.metadata.level).toBe("string");

    // Type assertions for compile-time verification
    const _result: {
      id: number;
      profile: {
        firstName: string;
        lastName: string;
        preferences: {
          theme: "light" | "dark";
          notifications: boolean;
        };
      };
      roles: string[];
      metadata: Record<string, string | number>;
    } = result;

    expect(result).toEqual(testData);
  });
});

describe("Zod adapter factories integration", () => {
  const simpleSchema = z.object({
    value: z.string(),
    count: z.number(),
  });

  it("sync and async validators produce identical results for same valid data", async () => {
    const syncValidator = zodCheck(simpleSchema);
    const asyncValidator = zodCheckAsync(simpleSchema);

    const testData = { value: "test", count: 42 };

    const syncResult = syncValidator(testData);
    const asyncResult = await asyncValidator(testData);

    expect(syncResult).toEqual(asyncResult);
    expect(syncResult).toEqual(testData);
  });

  it("sync and async validators both throw ValidationException for same invalid data", async () => {
    const syncValidator = zodCheck(simpleSchema);
    const asyncValidator = zodCheckAsync(simpleSchema);

    const invalidData = { value: 123, count: "not a number" };

    // Sync validator should throw
    expect(() => syncValidator(invalidData)).toThrow(ValidationException);

    // Async validator should also throw
    await expect(asyncValidator(invalidData)).rejects.toThrow(
      ValidationException,
    );
  });

  it("both validators maintain proper type inference", () => {
    const syncValidator = zodCheck(simpleSchema);
    // const asyncValidator = zodCheckAsync(simpleSchema);

    const testData = { value: "test", count: 42 };

    // Sync validator type check
    const syncResult = syncValidator(testData);
    const _syncValue: string = syncResult.value;
    const _syncCount: number = syncResult.count;

    // Async validator type check (compile-time only)
    // const asyncPromise = asyncValidator(testData);
    // const _asyncPromise: Promise<{ value: string; count: number }> =
    //   asyncPromise;

    expect(syncResult.value).toBe("test");
    expect(syncResult.count).toBe(42);
  });
});

describe("Zod adapter error handling edge cases", () => {
  it("handles schemas with custom error messages", async () => {
    const customErrorSchema = z.object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      password: z.string().min(8, "Password must be at least 8 characters"),
    });

    const syncValidator = zodCheck(customErrorSchema);
    const asyncValidator = zodCheckAsync(customErrorSchema);

    const invalidData = { username: "ab", password: "123" };

    // Test sync validator
    try {
      syncValidator(invalidData);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      if (error instanceof ValidationException) {
        expect(
          error.issues.some((issue) =>
            issue.message.includes("Username must be at least 3 characters"),
          ),
        ).toBe(true);
        expect(
          error.issues.some((issue) =>
            issue.message.includes("Password must be at least 8 characters"),
          ),
        ).toBe(true);
      }
    }

    // Test async validator
    try {
      await asyncValidator(invalidData);
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      if (error instanceof ValidationException) {
        expect(
          error.issues.some((issue) =>
            issue.message.includes("Username must be at least 3 characters"),
          ),
        ).toBe(true);
        expect(
          error.issues.some((issue) =>
            issue.message.includes("Password must be at least 8 characters"),
          ),
        ).toBe(true);
      }
    }
  });

  it("handles deeply nested validation errors", async () => {
    const nestedSchema = z.object({
      user: z.object({
        profile: z.object({
          settings: z.object({
            preferences: z.object({
              theme: z.enum(["light", "dark"]),
            }),
          }),
        }),
      }),
    });

    const syncValidator = zodCheck(nestedSchema);
    const asyncValidator = zodCheckAsync(nestedSchema);

    const invalidData = {
      user: {
        profile: {
          settings: {
            preferences: {
              theme: "invalid-theme",
            },
          },
        },
      },
    };

    // Test sync validator
    try {
      syncValidator(invalidData);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      if (error instanceof ValidationException) {
        expect(
          error.issues.some(
            (issue) =>
              issue.path.includes("user") &&
              issue.path.includes("profile") &&
              issue.path.includes("settings") &&
              issue.path.includes("preferences") &&
              issue.path.includes("theme"),
          ),
        ).toBe(true);
      }
    }

    // Test async validator
    await expect(asyncValidator(invalidData)).rejects.toThrow(
      ValidationException,
    );
  });
});
