/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { zodResolver } from "@hookform/resolvers/zod";
import { init } from "../core";
import { zodCheck } from "../adapters/zod";
import z from "zod";

describe("Zod Integration with getRawSchema", () => {
  // Define Zod schemas
  const userSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
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
  };

  it("should demonstrate complete Zod + zodResolver integration", () => {
    // 1. Create API with Zod validators
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
    });

    // 2. Extract raw schemas for client-side validation
    const rawSchemas = api.getRawSchema("createUser") as any;

    // Verify we get the original Zod schemas
    expect(rawSchemas.payload).toBe(userSchema);
    expect(rawSchemas.dto).toBe(responseSchema);

    // 3. Use raw schema with zodResolver (react-hook-form integration)
    const formSchema = rawSchemas.payload;
    const resolver = zodResolver(formSchema);

    // Verify zodResolver is created successfully
    expect(typeof resolver).toBe("function");

    // 4. Test the resolver with valid data
    const validData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    // The resolver should accept valid data
    const validResult = formSchema.safeParse(validData);
    expect(validResult.success).toBe(true);

    // 5. Test the resolver with invalid data
    const invalidData = {
      username: "ab", // too short
      email: "invalid-email",
      password: "short", // too short
    };

    const invalidResult = formSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);

    if (!invalidResult.success) {
      expect(invalidResult.error.issues).toHaveLength(3);

      // Check specific error messages
      const errorMessages = invalidResult.error.issues.map(
        (issue: any) => issue.message,
      );
      expect(errorMessages).toContain("Username must be at least 3 characters");
      expect(errorMessages).toContain("Invalid email address");
      expect(errorMessages).toContain("Password must be at least 8 characters");
    }
  });

  it("should work with server and client validation independently", () => {
    const api = init()<ApiContracts>()({
      createUser: {
        resolver: vi.fn(),
        schemas: {
          payload: zodCheck(userSchema),
          dto: zodCheck(responseSchema),
        },
      },
    });

    // Get both server and client validators
    const apiSchemas = api.getSchema("createUser");
    const rawSchemas = api.getRawSchema("createUser") as any;

    const testData = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    };

    // Server validation
    expect(() => apiSchemas.payload(testData)).not.toThrow();

    // Client validation
    const clientResult = rawSchemas.payload.safeParse(testData);
    expect(clientResult.success).toBe(true);
    expect(clientResult.data).toEqual(testData);
  });

  it("should demonstrate practical react-hook-form usage pattern", () => {
    // This is the exact pattern developers would use in their components

    const registrationSchema = z
      .object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(8),
        confirmPassword: z.string(),
      })
      .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
      });

    const api = init()<{
      register: {
        payload: z.infer<typeof registrationSchema>;
        dto: { id: string; username: string };
        error: { message: string };
      };
    }>()({
      register: {
        resolver: vi.fn(),
        schemas: {
          payload: zodCheck(registrationSchema),
        },
      },
    });

    // Developer usage pattern:

    // Step 1: Get raw schema for client-side validation
    const rawSchemas = api.getRawSchema("register") as any;
    const formSchema = rawSchemas.payload;

    // Step 2: Create react-hook-form resolver
    const resolver = zodResolver(formSchema);
    expect(typeof resolver).toBe("function");

    // Step 3: Use in component (pseudocode)
    // const { register, handleSubmit, formState: { errors } } = useForm({
    //   resolver: resolver
    // });

    // Step 4: Verify the schema works with complex validation
    const validForm = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    const invalidForm = {
      username: "ab",
      email: "invalid",
      password: "short",
      confirmPassword: "different",
    };

    expect(formSchema.safeParse(validForm).success).toBe(true);

    const invalidResult = formSchema.safeParse(invalidForm);
    expect(invalidResult.success).toBe(false);

    if (!invalidResult.success) {
      // Should include all validation errors including refinement
      expect(invalidResult.error.issues.length).toBeGreaterThanOrEqual(4);

      const errorPaths = invalidResult.error.issues.map(
        (issue: any) => issue.path,
      );
      expect(errorPaths).toContainEqual(["username"]);
      expect(errorPaths).toContainEqual(["email"]);
      expect(errorPaths).toContainEqual(["password"]);
      expect(errorPaths).toContainEqual(["confirmPassword"]);
    }
  });

  it("should handle mixed schema types correctly", () => {
    // Test with some validators having raw schemas and others not
    const api = init()<{
      mixed: {
        payload: string;
        dto: string;
        error: { message: string };
      };
    }>()({
      mixed: {
        resolver: vi.fn(),
        schemas: {
          // Zod validator (has raw schema)
          payload: zodCheck(z.string().min(1)),
          // Custom validator (no raw schema)
          // @ts-expect-error - no raw schema attached with metadata property
          dto: (data: unknown) => {
            if (typeof data === "string") return data;
            throw new Error("Not a string");
          },
        },
      },
    });

    const rawSchemas = api.getRawSchema("mixed") as any;

    // Should have raw schema for payload (Zod)
    expect(rawSchemas.payload).toBeInstanceOf(z.ZodString);
    expect(typeof rawSchemas.payload.safeParse).toBe("function");

    // Should not have raw schema for dto (custom validator)
    expect(rawSchemas.dto).toBeUndefined();
  });

  it("should return undefined for contracts without schemas", () => {
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

  it("should demonstrate type safety with provided schemas", () => {
    const api = init()<ApiContracts>()({
      createUser: {
        resolver: vi.fn(),
        schemas: {
          payload: zodCheck(userSchema),
          dto: zodCheck(responseSchema),
          // Note: no 'error' schema provided
        },
      },
    });

    const schemas = api.getSchema("createUser");
    const rawSchemas = api.getRawSchema("createUser") as any;

    // Should have payload and dto (provided)
    expect(typeof schemas.payload).toBe("function");
    expect(typeof schemas.dto).toBe("function");
    expect(typeof rawSchemas.payload).toBe("object");
    expect(typeof rawSchemas.dto).toBe("object");

    // Raw schemas should be the original Zod schemas
    expect(rawSchemas.payload).toBe(userSchema);
    expect(rawSchemas.dto).toBe(responseSchema);

    // TypeScript prevents access to non-provided schemas
    // Note: TypeScript inference for getRawSchema return type is still being refined
    // schemas.error;      // Would be a compile error - not provided
    // schemas.pathParams; // Would be a compile error - not provided
  });
});
