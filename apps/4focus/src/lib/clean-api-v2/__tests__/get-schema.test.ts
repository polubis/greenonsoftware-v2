/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { init, check } from "../core";
import { ValidationException } from "../models";
import { zodCheck } from "../adapters/zod";
import z from "zod";
import type { ErrorVariant } from "../models";

describe("getSchema Function", () => {
  type TestContracts = {
    withAllSchemas: {
      dto: { id: number; name: string };
      error: ErrorVariant<"not_found", 404>;
      pathParams: { id: string };
      searchParams: { filter: string };
      payload: { data: string };
      extra: { metadata: Record<string, unknown> };
    };
    withSomeSchemas: {
      dto: { success: boolean };
      error: ErrorVariant<"error", 500>;
      payload: { input: string };
    };
    withNoSchemas: {
      dto: { result: string };
      error: ErrorVariant<"error", 400>;
    };
    withZodSchemas: {
      dto: { user: { name: string; email: string } };
      error: { message: string; code: number };
      payload: { name: string; email: string };
    };
  };

  const userSchema = z.object({
    name: z.string(),
    email: z.string().email(),
  });

  const userDtoSchema = z.object({
    user: userSchema,
  });

  const errorSchema = z.object({
    message: z.string(),
    code: z.number(),
  });

  describe("Basic Functionality", () => {
    it("should return object with all provided schema validators and correct type inference", () => {
      // Create diverse validators with different types and validation logic
      const dtoValidator = check(
        (data: unknown): { id: number; name: string } => {
          const obj = data as any;
          if (typeof obj.id !== "number" || typeof obj.name !== "string") {
            throw new ValidationException([
              { path: [], message: "Invalid DTO structure" },
            ]);
          }
          return obj;
        },
      );

      const errorValidator = check(
        (
          data: unknown,
        ): { type: "not_found"; status: 404; message: string } => {
          const obj = data as any;
          if (
            obj.type !== "not_found" ||
            obj.status !== 404 ||
            typeof obj.message !== "string"
          ) {
            throw new ValidationException([
              { path: [], message: "Invalid error structure" },
            ]);
          }
          return obj;
        },
      );

      const pathParamsValidator = check((data: unknown): { id: string } => {
        const obj = data as any;
        if (typeof obj.id !== "string") {
          throw new ValidationException([
            { path: ["id"], message: "ID must be a string" },
          ]);
        }
        return obj;
      });

      const searchParamsValidator = check(
        (data: unknown): { filter: string } => {
          const obj = data as any;
          if (typeof obj.filter !== "string") {
            throw new ValidationException([
              { path: ["filter"], message: "Filter must be a string" },
            ]);
          }
          return obj;
        },
      );

      const payloadValidator = check((data: unknown): { data: string } => {
        const obj = data as any;
        if (typeof obj.data !== "string") {
          throw new ValidationException([
            { path: ["data"], message: "Data must be a string" },
          ]);
        }
        return obj;
      });

      const extraValidator = check(
        (data: unknown): { metadata: Record<string, unknown> } => {
          const obj = data as any;
          if (typeof obj.metadata !== "object" || obj.metadata === null) {
            throw new ValidationException([
              { path: ["metadata"], message: "Metadata must be an object" },
            ]);
          }
          return obj;
        },
      );

      // Create validators with different complexities for comprehensive testing
      const complexDtoValidator = check(
        (data: unknown): { success: boolean } => {
          const obj = data as any;
          if (typeof obj.success !== "boolean") {
            throw new ValidationException([
              { path: ["success"], message: "Success must be a boolean" },
            ]);
          }
          return obj;
        },
      );

      const complexErrorValidator = check(
        (data: unknown): { type: "error"; status: 500; message: string } => {
          const obj = data as any;
          if (
            obj.type !== "error" ||
            obj.status !== 500 ||
            typeof obj.message !== "string"
          ) {
            throw new ValidationException([
              { path: [], message: "Invalid complex error structure" },
            ]);
          }
          return obj;
        },
      );

      const complexPayloadValidator = check(
        (data: unknown): { input: string } => {
          const obj = data as any;
          if (typeof obj.input !== "string") {
            throw new ValidationException([
              { path: ["input"], message: "Input must be a string" },
            ]);
          }
          return obj;
        },
      );

      const api = init()<TestContracts>()({
        withAllSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: dtoValidator,
            error: errorValidator,
            pathParams: pathParamsValidator,
            searchParams: searchParamsValidator,
            payload: payloadValidator,
            extra: extraValidator,
          },
        },
        withSomeSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: complexDtoValidator,
            error: complexErrorValidator,
            payload: complexPayloadValidator,
          },
        },
        withNoSchemas: {
          resolver: vi.fn(),
        },
        withZodSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: zodCheck(userDtoSchema),
            error: zodCheck(errorSchema),
            payload: zodCheck(userSchema),
          },
        },
      });

      // Test getting schemas for contract with all schemas
      const allSchemas = api.getSchema("withAllSchemas");

      // Verify all expected schemas are present with correct references
      expect(allSchemas).toHaveProperty("dto", dtoValidator);
      expect(allSchemas).toHaveProperty("error", errorValidator);
      expect(allSchemas).toHaveProperty("pathParams", pathParamsValidator);
      expect(allSchemas).toHaveProperty("searchParams", searchParamsValidator);
      expect(allSchemas).toHaveProperty("payload", payloadValidator);
      expect(allSchemas).toHaveProperty("extra", extraValidator);

      // Test that all validators are functions
      expect(typeof allSchemas.dto).toBe("function");
      expect(typeof allSchemas.error).toBe("function");
      expect(typeof allSchemas.pathParams).toBe("function");
      expect(typeof allSchemas.searchParams).toBe("function");
      expect(typeof allSchemas.payload).toBe("function");
      expect(typeof allSchemas.extra).toBe("function");

      // Test actual validation functionality with correct types
      expect(() => allSchemas.dto({ id: 123, name: "test" })).not.toThrow();
      expect(() => allSchemas.dto({ id: "invalid", name: "test" })).toThrow(
        ValidationException,
      );

      expect(() =>
        allSchemas.error({
          type: "not_found",
          status: 404,
          message: "Not found",
        }),
      ).not.toThrow();
      expect(() =>
        allSchemas.error({ type: "wrong", status: 404, message: "Not found" }),
      ).toThrow(ValidationException);

      expect(() => allSchemas.pathParams({ id: "123" })).not.toThrow();
      expect(() => allSchemas.pathParams({ id: 123 })).toThrow(
        ValidationException,
      );

      expect(() => allSchemas.searchParams({ filter: "active" })).not.toThrow();
      expect(() => allSchemas.searchParams({ filter: true })).toThrow(
        ValidationException,
      );

      expect(() => allSchemas.payload({ data: "payload data" })).not.toThrow();
      expect(() => allSchemas.payload({ data: 123 })).toThrow(
        ValidationException,
      );

      expect(() =>
        allSchemas.extra({ metadata: { key: "value" } }),
      ).not.toThrow();
      expect(() => allSchemas.extra({ metadata: "invalid" })).toThrow(
        ValidationException,
      );

      // Test getting schemas for contract with some schemas
      const someSchemas = api.getSchema("withSomeSchemas");

      // Verify only provided schemas are present
      expect(someSchemas).toHaveProperty("dto");
      expect(someSchemas).toHaveProperty("error");
      expect(someSchemas).toHaveProperty("payload");
      expect(someSchemas).not.toHaveProperty("pathParams");
      expect(someSchemas).not.toHaveProperty("searchParams");
      expect(someSchemas).not.toHaveProperty("extra");

      // Test functionality of provided schemas
      expect(typeof someSchemas.dto).toBe("function");
      expect(typeof someSchemas.error).toBe("function");
      expect(typeof someSchemas.payload).toBe("function");

      expect(() => someSchemas.dto({ success: true })).not.toThrow();
      expect(() => someSchemas.dto({ success: "invalid" })).toThrow(
        ValidationException,
      );

      expect(() =>
        someSchemas.error({
          type: "error",
          status: 500,
          message: "Server error",
        }),
      ).not.toThrow();
      expect(() =>
        someSchemas.error({
          type: "error",
          status: 400,
          message: "Server error",
        }),
      ).toThrow(ValidationException);

      expect(() => someSchemas.payload({ input: "test input" })).not.toThrow();
      expect(() => someSchemas.payload({ input: 123 })).toThrow(
        ValidationException,
      );

      // Test Zod schemas with complex type inference
      const zodSchemas = api.getSchema("withZodSchemas");

      expect(zodSchemas).toHaveProperty("dto");
      expect(zodSchemas).toHaveProperty("error");
      expect(zodSchemas).toHaveProperty("payload");
      expect(zodSchemas).not.toHaveProperty("pathParams");
      expect(zodSchemas).not.toHaveProperty("searchParams");
      expect(zodSchemas).not.toHaveProperty("extra");

      // Test Zod validation functionality
      expect(() =>
        zodSchemas.dto({ user: { name: "John", email: "john@example.com" } }),
      ).not.toThrow();
      expect(() => zodSchemas.dto({ user: { name: "John" } })).toThrow(
        ValidationException,
      ); // missing email

      expect(() =>
        zodSchemas.error({ message: "Error occurred", code: 500 }),
      ).not.toThrow();
      expect(() =>
        zodSchemas.error({ message: "Error", code: "invalid" }),
      ).toThrow(ValidationException);

      expect(() =>
        zodSchemas.payload({ name: "Jane", email: "jane@example.com" }),
      ).not.toThrow();
      expect(() =>
        zodSchemas.payload({ name: "Jane", email: "invalid-email" }),
      ).toThrow(ValidationException);

      // Verify no cross-contamination between schema objects
      expect(allSchemas.dto).not.toBe(someSchemas.dto);
      expect(allSchemas.error).not.toBe(someSchemas.error);
      expect(allSchemas.payload).not.toBe(someSchemas.payload);
    });

    it("should return working validation functions in schemas object", () => {
      const api = init()<TestContracts>()({
        withZodSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: zodCheck(userDtoSchema),
            error: zodCheck(errorSchema),
            payload: zodCheck(userSchema),
          },
        },
        withAllSchemas: { resolver: vi.fn() },
        withSomeSchemas: { resolver: vi.fn() },
        withNoSchemas: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("withZodSchemas");

      // Verify schemas exist before using them
      expect(schemas).toBeDefined();
      expect(schemas).toHaveProperty("payload");
      expect(schemas).toHaveProperty("dto");

      // Extract validators from the schemas object
      const payloadValidator = schemas.payload;
      const dtoValidator = schemas.dto;

      // Test that the returned validators work correctly
      const validPayload = { name: "John", email: "john@example.com" };
      const validDto = { user: { name: "Jane", email: "jane@example.com" } };

      expect(() => payloadValidator(validPayload)).not.toThrow();
      expect(() => dtoValidator(validDto)).not.toThrow();

      // Test that validation fails for invalid data
      const invalidPayload = { name: "John", email: "invalid-email" };
      const invalidDto = { user: { name: "Jane" } }; // missing email

      expect(() => payloadValidator(invalidPayload)).toThrow(
        ValidationException,
      );
      expect(() => dtoValidator(invalidDto)).toThrow(ValidationException);
    });
  });

  describe("Edge Cases", () => {
    it("should return undefined for contract with no schemas", () => {
      const api = init()<TestContracts>()({
        withNoSchemas: {
          resolver: vi.fn(),
          // No schemas provided
        },
        withAllSchemas: { resolver: vi.fn() },
        withSomeSchemas: { resolver: vi.fn() },
        withZodSchemas: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("withNoSchemas");
      expect(schemas).toBeUndefined();
    });

    it("should handle contract that exists but has empty schemas object", () => {
      const api = init()<TestContracts>()({
        withSomeSchemas: {
          resolver: vi.fn(),
          schemas: {
            // All schemas are undefined (not provided)
          },
        },
        withAllSchemas: { resolver: vi.fn() },
        withNoSchemas: { resolver: vi.fn() },
        withZodSchemas: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("withSomeSchemas");
      expect(schemas).toBeUndefined();
    });

    it("should not include undefined schemas in returned object", () => {
      const api = init()<TestContracts>()({
        withSomeSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: check((data: unknown) => data as any),
            error: check((data: unknown) => data as any),
            // payload is intentionally omitted/undefined
          },
        },
        withAllSchemas: { resolver: vi.fn() },
        withNoSchemas: { resolver: vi.fn() },
        withZodSchemas: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("withSomeSchemas");
      expect(schemas).toHaveProperty("dto");
      expect(schemas).toHaveProperty("error");
      expect(schemas).not.toHaveProperty("payload");
      expect(schemas).not.toHaveProperty("pathParams");
      expect(schemas).not.toHaveProperty("searchParams");
      expect(schemas).not.toHaveProperty("extra");
    });
  });

  describe("Integration with Different Schema Types", () => {
    it("should work with Zod schemas", () => {
      const api = init()<TestContracts>()({
        withZodSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: zodCheck(userDtoSchema),
            error: zodCheck(errorSchema),
            payload: zodCheck(userSchema),
          },
        },
        withAllSchemas: { resolver: vi.fn() },
        withSomeSchemas: { resolver: vi.fn() },
        withNoSchemas: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("withZodSchemas");

      expect(schemas).toBeDefined();
      expect(schemas).toHaveProperty("payload");
      expect(schemas).toHaveProperty("error");

      const { payload: payloadValidator, error: errorValidator } = schemas;

      // Test valid data
      const validUser = { name: "John", email: "john@example.com" };
      const validError = { message: "Error occurred", code: 500 };

      const userResult = payloadValidator(validUser);
      const errorResult = errorValidator(validError);

      expect(userResult).toEqual(validUser);
      expect(errorResult).toEqual(validError);

      // Test invalid data
      const invalidUser = { name: "John", email: "invalid-email" };
      const invalidError = { message: "Error", code: "not-a-number" };

      expect(() => payloadValidator(invalidUser)).toThrow(ValidationException);
      expect(() => errorValidator(invalidError)).toThrow(ValidationException);
    });

    it("should work with custom check validators", () => {
      const customValidator = check((data: unknown): { id: number } => {
        const obj = data as any;
        if (typeof obj.id !== "number") {
          throw new ValidationException([
            { path: ["id"], message: "ID must be a number" },
          ]);
        }
        return obj;
      });

      const api = init()<TestContracts>()({
        withSomeSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: customValidator as any,
          },
        },
        withAllSchemas: { resolver: vi.fn() },
        withNoSchemas: { resolver: vi.fn() },
        withZodSchemas: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("withSomeSchemas");

      expect(schemas).toBeDefined();
      expect(schemas).toHaveProperty("dto");

      const { dto: dtoValidator } = schemas;

      expect(() => dtoValidator({ id: 123 })).not.toThrow();
      expect(() => dtoValidator({ id: "not-a-number" })).toThrow(
        ValidationException,
      );
    });
  });

  describe("Type Safety", () => {
    it("should provide proper TypeScript typing for schemas object", () => {
      const api = init()<TestContracts>()({
        withAllSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: check((data: unknown) => data as any),
            error: check((data: unknown) => data as any),
            pathParams: check((data: unknown) => data as any),
            searchParams: check((data: unknown) => data as any),
            payload: check((data: unknown) => data as any),
            extra: check((data: unknown) => data as any),
          },
        },
        withSomeSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: check((data: unknown) => data as any),
            error: check((data: unknown) => data as any),
            payload: check((data: unknown) => data as any),
          },
        },
        withNoSchemas: { resolver: vi.fn() },
        withZodSchemas: { resolver: vi.fn() },
      });

      // These should compile without TypeScript errors
      const allSchemas = api.getSchema("withAllSchemas");
      const someSchemas = api.getSchema("withSomeSchemas");
      const noSchemas = api.getSchema("withNoSchemas");

      // Verify we can access all the expected schemas
      expect(typeof allSchemas.dto).toBe("function");
      expect(typeof allSchemas.error).toBe("function");
      expect(typeof allSchemas.pathParams).toBe("function");
      expect(typeof allSchemas.searchParams).toBe("function");
      expect(typeof allSchemas.payload).toBe("function");
      expect(typeof allSchemas.extra).toBe("function");

      expect(typeof someSchemas.dto).toBe("function");
      expect(typeof someSchemas.error).toBe("function");
      expect(typeof someSchemas.payload).toBe("function");

      expect(noSchemas).toBeUndefined();

      // Verify TypeScript errors for non-existent schemas
      // @ts-expect-error - Property 'pathParams' does not exist on withSomeSchemas (only dto, error, payload provided)
      someSchemas.pathParams;
      // @ts-expect-error - Property 'searchParams' does not exist on withSomeSchemas
      someSchemas.searchParams;
      // @ts-expect-error - Property 'extra' does not exist on withSomeSchemas
      someSchemas.extra;
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should work with react-hook-form style usage", () => {
      const formSchema = z.object({
        name: z.string().min(1, "Name is required"),
        email: z.string().email("Invalid email"),
        age: z.number().min(18, "Must be at least 18"),
      });

      const api = init()<{
        submitForm: {
          dto: { success: boolean; id: string };
          error: { message: string; field?: string };
          payload: z.infer<typeof formSchema>;
        };
      }>()({
        submitForm: {
          resolver: vi.fn().mockResolvedValue({ success: true, id: "123" }),
          schemas: {
            payload: zodCheck(formSchema),
            dto: zodCheck(z.object({ success: z.boolean(), id: z.string() })),
            error: zodCheck(
              z.object({
                message: z.string(),
                field: z.string().optional(),
              }),
            ),
          },
        },
      });

      // Get the schemas object containing all validators
      const schemas = api.getSchema("submitForm");

      expect(schemas).toBeDefined();
      expect(schemas).toHaveProperty("payload");

      const { payload: validateFormData } = schemas;

      // Simulate react-hook-form validation
      const formData = { name: "John Doe", email: "john@example.com", age: 25 };
      const invalidFormData = { name: "", email: "invalid", age: 16 };

      expect(() => validateFormData(formData)).not.toThrow();
      expect(() => validateFormData(invalidFormData)).toThrow(
        ValidationException,
      );

      // Verify the validation exception contains proper error details
      try {
        validateFormData(invalidFormData);
      } catch (error) {
        expect(ValidationException.is(error)).toBe(true);
        if (ValidationException.is(error)) {
          expect(error.issues).toHaveLength(3); // name, email, age errors
          expect(
            error.issues.some((issue) => issue.path.includes("name")),
          ).toBe(true);
          expect(
            error.issues.some((issue) => issue.path.includes("email")),
          ).toBe(true);
          expect(error.issues.some((issue) => issue.path.includes("age"))).toBe(
            true,
          );
        }
      }
    });

    it("should work with manual validation scenarios", () => {
      const api = init()<TestContracts>()({
        withZodSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: zodCheck(userDtoSchema),
            payload: zodCheck(userSchema),
          },
        },
        withAllSchemas: { resolver: vi.fn() },
        withSomeSchemas: { resolver: vi.fn() },
        withNoSchemas: { resolver: vi.fn() },
      });

      // Get all schemas at once
      const schemas = api.getSchema("withZodSchemas");

      expect(schemas).toBeDefined();
      expect(schemas).toHaveProperty("payload");
      expect(schemas).toHaveProperty("dto");

      const { payload: validateUser, dto: validateResponse } = schemas;

      // Simulate manual validation in business logic
      const userData = { name: "Alice", email: "alice@example.com" };
      const responseData = {
        user: { name: "Alice", email: "alice@example.com" },
      };

      // Validate input before processing
      const validatedInput = validateUser(userData);
      expect(validatedInput).toEqual(userData);

      // Validate response before returning
      const validatedResponse = validateResponse(responseData);
      expect(validatedResponse).toEqual(responseData);
    });

    it("should allow selective usage of schemas from the returned object", () => {
      const api = init()<TestContracts>()({
        withAllSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: check((data: unknown) => data as any),
            error: check((data: unknown) => data as any),
            pathParams: check((data: unknown) => data as any),
            searchParams: check((data: unknown) => data as any),
            payload: check((data: unknown) => data as any),
            extra: check((data: unknown) => data as any),
          },
        },
        withSomeSchemas: { resolver: vi.fn() },
        withNoSchemas: { resolver: vi.fn() },
        withZodSchemas: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("withAllSchemas");

      // Can destructure only the schemas you need
      const { dto, payload } = schemas;

      // Can access schemas by property
      const pathParamsValidator = schemas.pathParams;

      // Can check if a schema exists
      if ("extra" in schemas) {
        const extraValidator = schemas.extra;
        expect(typeof extraValidator).toBe("function");
      }

      expect(typeof dto).toBe("function");
      expect(typeof payload).toBe("function");
      expect(typeof pathParamsValidator).toBe("function");
    });
  });

  describe("Edge Cases", () => {
    it("should handle schemas with side effects consistently", () => {
      let callCount = 0;
      const sideEffectValidator = check((data: unknown) => {
        callCount++;
        return data;
      });

      const api = init()<TestContracts>()({
        withSomeSchemas: {
          resolver: vi.fn(),
          schemas: {
            dto: sideEffectValidator as any,
          },
        },
        withAllSchemas: { resolver: vi.fn() },
        withNoSchemas: { resolver: vi.fn() },
        withZodSchemas: { resolver: vi.fn() },
      });

      // Multiple calls to getSchema should return the same object reference
      const schemas1 = api.getSchema("withSomeSchemas");
      const schemas2 = api.getSchema("withSomeSchemas");

      expect(schemas1).toBeDefined();
      expect(schemas2).toBeDefined();
      expect(schemas1).toHaveProperty("dto");
      expect(schemas2).toHaveProperty("dto");

      expect(schemas1.dto).toBe(schemas2.dto);

      // Using the validator should trigger side effects
      schemas1.dto({ success: true });
      expect(callCount).toBe(1);

      schemas2.dto({ success: false });
      expect(callCount).toBe(2);
    });

    it("should handle complex nested validation through schemas object", () => {
      const nestedSchema = z.object({
        user: z.object({
          profile: z.object({
            personal: z.object({
              name: z.string(),
              age: z.number(),
            }),
            preferences: z.object({
              theme: z.enum(["light", "dark"]),
              notifications: z.boolean(),
            }),
          }),
        }),
      });

      const api = init()<{
        complex: {
          dto: z.infer<typeof nestedSchema>;
          error: { code: number };
        };
      }>()({
        complex: {
          resolver: vi.fn(),
          schemas: {
            dto: zodCheck(nestedSchema),
          },
        },
      });

      const schemas = api.getSchema("complex");

      expect(schemas).toBeDefined();
      expect(schemas).toHaveProperty("dto");

      const { dto: complexValidator } = schemas;

      const validData = {
        user: {
          profile: {
            personal: { name: "John", age: 30 },
            preferences: { theme: "dark" as const, notifications: true },
          },
        },
      };

      const invalidData = {
        user: {
          profile: {
            personal: { name: "John", age: "30" }, // age should be number
            preferences: { theme: "purple", notifications: true }, // invalid theme
          },
        },
      };

      expect(() => complexValidator(validData)).not.toThrow();
      expect(() => complexValidator(invalidData)).toThrow(ValidationException);
    });
  });
});
