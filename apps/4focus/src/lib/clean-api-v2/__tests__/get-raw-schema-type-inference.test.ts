import { describe, expect, it, vi } from "vitest";
import { init } from "../core";
import { zodCheck } from "../adapters/zod";
import z from "zod";

describe("getRawSchema - Type Inference Tests", () => {
  // Define test schemas
  const userSchema = z.object({
    username: z.string(),
    email: z.string().email(),
  });

  const responseSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
  });

  type ApiContracts = {
    createUser: {
      payload: z.infer<typeof userSchema>;
      dto: z.infer<typeof responseSchema>;
      error: { message: string };
    };
    updateUser: {
      pathParams: { id: string };
      payload: z.infer<typeof userSchema>;
      dto: z.infer<typeof responseSchema>;
      error: { message: string };
    };
    deleteUser: {
      pathParams: { id: string };
      dto: void;
      error: { message: string };
    };
  };

  it("should infer correct types when all schemas have raw schemas", () => {
    const api = init()<ApiContracts>()({
      createUser: {
        resolver: vi.fn().mockResolvedValue({
          id: "user-123",
          username: "testuser",
          email: "test@example.com",
        }),
        schemas: {
          payload: zodCheck(userSchema),
          dto: zodCheck(responseSchema),
        },
      },
      updateUser: {
        resolver: vi.fn().mockResolvedValue({
          id: "user-123",
          username: "testuser",
          email: "test@example.com",
        }),
        schemas: {
          pathParams: zodCheck(z.object({ id: z.string() })),
          payload: zodCheck(userSchema),
          dto: zodCheck(responseSchema),
        },
      },
      deleteUser: {
        resolver: vi.fn().mockResolvedValue(undefined),
        schemas: {
          pathParams: zodCheck(z.object({ id: z.string() })),
        },
      },
    });

    // Test createUser - should have both payload and dto raw schemas
    const createUserRawSchemas = api.getRawSchema("createUser");
    expect(createUserRawSchemas).toBeDefined();
    expect(createUserRawSchemas.payload).toBe(userSchema);
    expect(createUserRawSchemas.dto).toBe(responseSchema);

    // TypeScript should infer these as Zod schemas
    const payloadSchema = createUserRawSchemas.payload;
    const dtoSchema = createUserRawSchemas.dto;

    // These should work because TypeScript infers the correct Zod types
    expect(
      payloadSchema.safeParse({ username: "test", email: "test@example.com" })
        .success,
    ).toBe(true);
    expect(
      dtoSchema.safeParse({
        id: "123",
        username: "test",
        email: "test@example.com",
      }).success,
    ).toBe(true);

    // Test updateUser - should have pathParams, payload, and dto raw schemas
    const updateUserRawSchemas = api.getRawSchema("updateUser");
    expect(updateUserRawSchemas).toBeDefined();
    expect(updateUserRawSchemas.pathParams).toBeDefined();
    expect(updateUserRawSchemas.payload).toBe(userSchema);
    expect(updateUserRawSchemas.dto).toBe(responseSchema);

    // Test deleteUser - should only have pathParams raw schema
    const deleteUserRawSchemas = api.getRawSchema("deleteUser");
    expect(deleteUserRawSchemas).toBeDefined();
    expect(deleteUserRawSchemas.pathParams).toBeDefined();
    // dto is not defined in the raw schemas because no raw schema was provided
    expect("dto" in deleteUserRawSchemas).toBe(false);
  });

  it("should infer correct types with mixed schema types", () => {
    const api = init()<{
      mixed: {
        payload: string;
        dto: number;
        pathParams: { id: string };
        error: { message: string };
      };
    }>()({
      mixed: {
        resolver: vi.fn(),
        schemas: {
          // Zod validator (has raw schema)
          payload: zodCheck(z.string().min(1)),
          // Custom validator (no raw schema)
          dto: (data: unknown) => {
            if (typeof data === "number") return data;
            throw new Error("Not a number");
          },
          // Zod validator (has raw schema)
          pathParams: zodCheck(z.object({ id: z.string() })),
        },
      },
    });

    const rawSchemas = api.getRawSchema("mixed");
    expect(rawSchemas).toBeDefined();

    // Should have raw schema for payload and pathParams (Zod)
    expect(rawSchemas.payload).toBeInstanceOf(z.ZodString);
    expect(rawSchemas.pathParams).toBeInstanceOf(z.ZodObject);

    // Should not have raw schema for dto (custom validator)
    expect("dto" in rawSchemas).toBe(false);

    // TypeScript should infer correct types
    const payloadSchema = rawSchemas.payload;
    const pathParamsSchema = rawSchemas.pathParams;

    // These should work because TypeScript infers the correct Zod types
    expect(payloadSchema.safeParse("test").success).toBe(true);
    expect(pathParamsSchema.safeParse({ id: "123" }).success).toBe(true);
  });

  it("should return undefined when no schemas are provided", () => {
    const api = init()<{
      noSchemas: {
        payload: string;
        dto: string;
        error: { message: string };
      };
    }>()({
      noSchemas: {
        resolver: vi.fn(),
        // No schemas provided
      },
    });

    const rawSchemas = api.getRawSchema("noSchemas");
    expect(rawSchemas).toBeUndefined();
  });

  it("should return undefined when schemas have no raw schemas attached", () => {
    const api = init()<{
      customValidators: {
        payload: string;
        dto: number;
        error: { message: string };
      };
    }>()({
      customValidators: {
        resolver: vi.fn(),
        schemas: {
          // Custom validators without raw schemas
          payload: (data: unknown) => {
            if (typeof data === "string") return data;
            throw new Error("Not a string");
          },
          dto: (data: unknown) => {
            if (typeof data === "number") return data;
            throw new Error("Not a number");
          },
        },
      },
    });

    const rawSchemas = api.getRawSchema("customValidators");
    expect(rawSchemas).toBeUndefined();
  });

  it("should work with complex nested Zod schemas", () => {
    const nestedSchema = z.object({
      user: z.object({
        profile: z.object({
          name: z.string(),
          age: z.number().optional(),
        }),
        preferences: z.array(z.string()),
      }),
      metadata: z.record(z.string(), z.unknown()),
    });

    const api = init()<{
      complex: {
        payload: z.infer<typeof nestedSchema>;
        dto: string;
        error: { message: string };
      };
    }>()({
      complex: {
        resolver: vi.fn(),
        schemas: {
          payload: zodCheck(nestedSchema),
        },
      },
    });

    const rawSchemas = api.getRawSchema("complex");
    expect(rawSchemas).toBeDefined();
    expect(rawSchemas.payload).toBe(nestedSchema);

    // TypeScript should infer the complex Zod schema type
    const complexSchema = rawSchemas.payload;

    // Test with valid complex data
    const validData = {
      user: {
        profile: { name: "John", age: 30 },
        preferences: ["dark-theme", "notifications"],
      },
      metadata: { source: "api", version: 1 },
    };

    expect(complexSchema.safeParse(validData).success).toBe(true);

    // Test with invalid data
    const invalidData = {
      user: {
        profile: { name: "John", age: "thirty" }, // age should be number
        preferences: ["dark-theme"],
      },
    };

    expect(complexSchema.safeParse(invalidData).success).toBe(false);
  });

  it("should preserve specific Zod schema features", () => {
    const refinedSchema = z
      .object({
        password: z.string().min(8),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });

    const api = init()<{
      advanced: {
        payload: z.infer<typeof refinedSchema>;
        dto: string;
        pathParams: { param: string };
        error: { message: string };
      };
    }>()({
      advanced: {
        resolver: vi.fn(),
        schemas: {
          payload: zodCheck(refinedSchema),
          // For pathParams, we need to handle it as an object
          pathParams: zodCheck(z.object({ param: z.string() })),
        },
      },
    });

    const rawSchemas = api.getRawSchema("advanced");
    expect(rawSchemas).toBeDefined();
    expect(rawSchemas.payload).toBe(refinedSchema);
    expect(rawSchemas.pathParams).toBeInstanceOf(z.ZodObject);

    // Test refined schema
    const refinedZodSchema = rawSchemas.payload;

    // Valid data
    const validRefinedData = {
      password: "password123",
      confirmPassword: "password123",
    };
    expect(refinedZodSchema.safeParse(validRefinedData).success).toBe(true);

    // Invalid data (refinement fails)
    const invalidRefinedData = {
      password: "password123",
      confirmPassword: "different",
    };
    const result = refinedZodSchema.safeParse(invalidRefinedData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some(
          (issue) => issue.message === "Passwords don't match",
        ),
      ).toBe(true);
    }

    // Test pathParams schema (object validation)
    const pathParamsZodSchema = rawSchemas.pathParams;
    const pathParamsResult = pathParamsZodSchema.safeParse({ param: "hello" });
    expect(pathParamsResult.success).toBe(true);
    if (pathParamsResult.success) {
      expect(pathParamsResult.data).toEqual({ param: "hello" });
    }
  });

  it("should handle simple string validation", () => {
    // This test demonstrates basic string validation works
    const api = init()<{
      stringTest: {
        payload: string;
        dto: string;
        error: { message: string };
      };
    }>()({
      stringTest: {
        resolver: vi.fn(),
        schemas: {
          payload: zodCheck(z.string().min(4)), // Simple string validation
        },
      },
    });

    const rawSchemas = api.getRawSchema("stringTest");
    expect(rawSchemas).toBeDefined();
    expect(rawSchemas.payload).toBeInstanceOf(z.ZodString);

    // The raw schema should work as expected
    const schema = rawSchemas.payload;
    expect(schema.safeParse("test").success).toBe(true);
    expect(schema.safeParse("bad").success).toBe(false);
  });
});
