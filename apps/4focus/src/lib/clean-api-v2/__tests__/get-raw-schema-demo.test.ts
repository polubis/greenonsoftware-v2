/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { init } from "../core";
import { zodCheck } from "../adapters/zod";
import z from "zod";

describe("getRawSchema - Working Demo", () => {
  // Define schemas
  const userSchema = z.object({
    username: z.string().min(3),
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
  };

  it("should demonstrate the core functionality working", () => {
    // Create API with Zod validators that have raw schemas attached
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

    // 1. Get API validators for server-side validation
    const apiSchemas = api.getSchema("createUser");
    console.log("API schemas available:", Object.keys(apiSchemas));

    // 2. Get raw schemas for client-side validation
    const rawSchemas = api.getRawSchema("createUser") as any;
    console.log("Raw schemas available:", Object.keys(rawSchemas));

    // 3. Verify we get the original Zod schemas
    expect(rawSchemas.payload).toBe(userSchema);
    expect(rawSchemas.dto).toBe(responseSchema);

    // 4. Demonstrate server validation works
    const validData = { username: "testuser", email: "test@example.com" };
    const invalidData = { username: "ab", email: "invalid" };

    expect(() => apiSchemas.payload(validData)).not.toThrow();
    expect(() => apiSchemas.payload(invalidData)).toThrow();

    // 5. Demonstrate client validation works with raw schemas
    expect(rawSchemas.payload.safeParse(validData).success).toBe(true);
    expect(rawSchemas.payload.safeParse(invalidData).success).toBe(false);

    // 6. Show this enables react-hook-form integration
    // In a real app: const resolver = zodResolver(rawSchemas.payload);
    expect(typeof rawSchemas.payload.safeParse).toBe("function");
    expect(rawSchemas.payload._def).toBeDefined();
  });

  it("should work with mixed schema types", () => {
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
          // Some with raw schema (Zod)
          payload: zodCheck(z.string().min(1)),
          // Some without raw schema (custom)
          dto: (data: unknown) => {
            if (typeof data === "string") return data;
            throw new Error("Not a string");
          },
        },
      },
    });

    const rawSchemas = api.getRawSchema("mixed") as any;

    // Should have the Zod schema for payload
    expect(rawSchemas.payload).toBeInstanceOf(z.ZodString);

    // Should not have anything for dto (no raw schema attached)
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

  it("should demonstrate practical react-hook-form pattern", () => {
    const registrationSchema = z
      .object({
        username: z.string().min(3, "Username too short"),
        email: z.string().email("Invalid email"),
        password: z.string().min(8, "Password too short"),
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

    // This is the pattern developers would use:

    // 1. Get raw schema for client-side form validation
    const rawSchemas = api.getRawSchema("register") as any;
    const formSchema = rawSchemas.payload;

    // 2. Verify it's the original Zod schema
    expect(formSchema).toBe(registrationSchema);

    // 3. It can be used with react-hook-form
    // const { register, handleSubmit, formState: { errors } } = useForm({
    //   resolver: zodResolver(formSchema)
    // });

    // 4. Test the schema works
    const validForm = {
      username: "testuser",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    };

    const invalidForm = {
      username: "ab", // too short
      email: "invalid-email",
      password: "short",
      confirmPassword: "different",
    };

    expect(formSchema.safeParse(validForm).success).toBe(true);
    expect(formSchema.safeParse(invalidForm).success).toBe(false);

    // 5. Server validation still works independently
    const apiSchemas = api.getSchema("register");
    expect(() => apiSchemas.payload(validForm)).not.toThrow();
    expect(() => apiSchemas.payload(invalidForm)).toThrow();
  });
});
