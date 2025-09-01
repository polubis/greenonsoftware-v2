/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { init, check } from "../core";
import { zodCheck } from "../adapters/zod";
import z from "zod";
import type { ErrorVariant } from "../models";

describe("Type Inference Verification for getSchema", () => {
  type TestContracts = {
    onlyDto: {
      dto: { id: number };
      error: ErrorVariant<"error", 500>;
    };
    onlyPayload: {
      dto: { success: boolean };
      error: ErrorVariant<"error", 400>;
      payload: { data: string };
    };
    noSchemas: {
      dto: { result: string };
      error: ErrorVariant<"error", 400>;
    };
    allSchemas: {
      dto: { id: number; name: string };
      error: ErrorVariant<"not_found", 404>;
      pathParams: { id: string };
      searchParams: { filter: string };
      payload: { data: string };
      extra: { metadata: Record<string, unknown> };
    };
  };

  it("should have correct type inference - contract with only dto schema", () => {
    const api = init()<TestContracts>()({
      onlyDto: {
        resolver: vi.fn().mockResolvedValue({ id: 123 }),
        schemas: {
          dto: check((data: unknown): { id: number } => data as any),
          // No other schemas provided
        },
      },
      onlyPayload: { resolver: vi.fn() },
      noSchemas: { resolver: vi.fn() },
      allSchemas: { resolver: vi.fn() },
    });

    const schemas = api.getSchema("onlyDto");

    // Should only have dto property
    expect(schemas).toHaveProperty("dto");
    expect(schemas).not.toHaveProperty("error");
    expect(schemas).not.toHaveProperty("payload");
    expect(schemas).not.toHaveProperty("pathParams");
    expect(schemas).not.toHaveProperty("searchParams");
    expect(schemas).not.toHaveProperty("extra");

    // TypeScript should only allow access to dto
    expect(typeof schemas.dto).toBe("function");

    // Verify TypeScript errors for non-existent schemas
    // @ts-expect-error - Property 'error' does not exist on schemas with only dto
    schemas.error;
    // @ts-expect-error - Property 'payload' does not exist on schemas with only dto
    schemas.payload;
    // @ts-expect-error - Property 'pathParams' does not exist on schemas with only dto
    schemas.pathParams;
    // @ts-expect-error - Property 'searchParams' does not exist on schemas with only dto
    schemas.searchParams;
    // @ts-expect-error - Property 'extra' does not exist on schemas with only dto
    schemas.extra;
  });

  it("should have correct type inference - contract with dto and payload schemas", () => {
    const api = init()<TestContracts>()({
      onlyPayload: {
        resolver: vi.fn().mockResolvedValue({ success: true }),
        schemas: {
          dto: check((data: unknown): { success: boolean } => data as any),
          payload: check((data: unknown): { data: string } => data as any),
          // No other schemas provided
        },
      },
      onlyDto: { resolver: vi.fn() },
      noSchemas: { resolver: vi.fn() },
      allSchemas: { resolver: vi.fn() },
    });

    const schemas = api.getSchema("onlyPayload");

    // Should have both dto and payload properties
    expect(schemas).toHaveProperty("dto");
    expect(schemas).toHaveProperty("payload");
    expect(schemas).not.toHaveProperty("error");
    expect(schemas).not.toHaveProperty("pathParams");
    expect(schemas).not.toHaveProperty("searchParams");
    expect(schemas).not.toHaveProperty("extra");

    // TypeScript should allow access to both dto and payload
    expect(typeof schemas.dto).toBe("function");
    expect(typeof schemas.payload).toBe("function");

    // Verify TypeScript errors for non-existent schemas
    // @ts-expect-error - Property 'error' does not exist on schemas with only dto and payload
    schemas.error;
    // @ts-expect-error - Property 'pathParams' does not exist on schemas with only dto and payload
    schemas.pathParams;
    // @ts-expect-error - Property 'searchParams' does not exist on schemas with only dto and payload
    schemas.searchParams;
    // @ts-expect-error - Property 'extra' does not exist on schemas with only dto and payload
    schemas.extra;
  });

  it("should return unknown for contract with no schemas", () => {
    const api = init()<TestContracts>()({
      noSchemas: {
        resolver: vi.fn().mockResolvedValue({ result: "test" }),
        // No schemas property at all
      },
      onlyDto: { resolver: vi.fn() },
      onlyPayload: { resolver: vi.fn() },
      allSchemas: { resolver: vi.fn() },
    });

    const schemas = api.getSchema("noSchemas");

    // Should return undefined (unknown)
    expect(schemas).toBeUndefined();
  });

  it("should have correct type inference - contract with all schemas", () => {
    const api = init()<TestContracts>()({
      allSchemas: {
        resolver: vi.fn().mockResolvedValue({ id: 123, name: "test" }),
        schemas: {
          dto: check(
            (data: unknown): { id: number; name: string } => data as any,
          ),
          error: check(
            (data: unknown): ErrorVariant<"not_found", 404> => data as any,
          ),
          pathParams: check((data: unknown): { id: string } => data as any),
          searchParams: check(
            (data: unknown): { filter: string } => data as any,
          ),
          payload: check((data: unknown): { data: string } => data as any),
          extra: check(
            (data: unknown): { metadata: Record<string, unknown> } =>
              data as any,
          ),
        },
      },
      onlyDto: { resolver: vi.fn() },
      onlyPayload: { resolver: vi.fn() },
      noSchemas: { resolver: vi.fn() },
    });

    const schemas = api.getSchema("allSchemas");

    // Should have all schema properties
    expect(schemas).toHaveProperty("dto");
    expect(schemas).toHaveProperty("error");
    expect(schemas).toHaveProperty("pathParams");
    expect(schemas).toHaveProperty("searchParams");
    expect(schemas).toHaveProperty("payload");
    expect(schemas).toHaveProperty("extra");

    // TypeScript should allow access to all schemas
    expect(typeof schemas.dto).toBe("function");
    expect(typeof schemas.error).toBe("function");
    expect(typeof schemas.pathParams).toBe("function");
    expect(typeof schemas.searchParams).toBe("function");
    expect(typeof schemas.payload).toBe("function");
    expect(typeof schemas.extra).toBe("function");
  });

  it("should work correctly with Zod schemas and preserve type inference", () => {
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const api = init()<{
      userEndpoint: {
        dto: { user: z.infer<typeof userSchema> };
        error: { message: string };
        payload: z.infer<typeof userSchema>;
      };
    }>()({
      userEndpoint: {
        resolver: vi.fn().mockResolvedValue({
          user: { name: "John", email: "john@example.com" },
        }),
        schemas: {
          payload: zodCheck(userSchema),
          dto: zodCheck(
            z.object({
              user: userSchema,
            }),
          ),
          // Note: error schema is intentionally omitted
        },
      },
    });

    const schemas = api.getSchema("userEndpoint");

    // Should only have payload and dto (error is not provided)
    expect(schemas).toHaveProperty("payload");
    expect(schemas).toHaveProperty("dto");
    expect(schemas).not.toHaveProperty("error");

    // Test functionality
    const validUser = { name: "Jane", email: "jane@example.com" };
    const validDto = { user: { name: "Bob", email: "bob@example.com" } };

    expect(() => schemas.payload(validUser)).not.toThrow();
    expect(() => schemas.dto(validDto)).not.toThrow();

    // Verify TypeScript error for non-existent schema
    // @ts-expect-error - Property 'error' does not exist on schemas with only payload and dto
    schemas.error;
  });

  it("should demonstrate correct destructuring based on provided schemas", () => {
    const api = init()<TestContracts>()({
      onlyPayload: {
        resolver: vi.fn(),
        schemas: {
          payload: check((data: unknown) => data as any),
          // Only payload is provided
        },
      },
      allSchemas: {
        resolver: vi.fn(),
        schemas: {
          dto: check((data: unknown) => data as any),
          pathParams: check((data: unknown) => data as any),
          payload: check((data: unknown) => data as any),
          // dto, pathParams, and payload are provided
        },
      },
      onlyDto: { resolver: vi.fn() },
      noSchemas: { resolver: vi.fn() },
    });

    // Can only destructure payload from onlyPayload
    const { payload: payloadValidator } = api.getSchema("onlyPayload");
    expect(typeof payloadValidator).toBe("function");

    // Can destructure multiple schemas from allSchemas
    const { dto, pathParams, payload } = api.getSchema("allSchemas");
    expect(typeof dto).toBe("function");
    expect(typeof pathParams).toBe("function");
    expect(typeof payload).toBe("function");

    // Verify TypeScript errors for destructuring non-existent schemas
    // @ts-expect-error - Property 'error' does not exist on schemas with only payload
    const { error } = api.getSchema("onlyPayload");
    // @ts-expect-error - Property 'searchParams' does not exist on schemas with only dto, pathParams, and payload
    const { searchParams } = api.getSchema("allSchemas");
    // @ts-expect-error - Property 'extra' does not exist on schemas with only dto, pathParams, and payload
    const { extra } = api.getSchema("allSchemas");
  });

  it("should maintain type safety across different contract configurations", () => {
    type PartialSchemaContracts = {
      endpoint1: {
        dto: { result: string };
        error: { code: number };
        payload?: { input: string }; // Optional in contract
      };
      endpoint2: {
        dto: { data: number[] };
        error: { message: string };
        searchParams?: { query: string }; // Optional in contract
      };
    };

    const api = init()<PartialSchemaContracts>()({
      endpoint1: {
        resolver: vi.fn(),
        schemas: {
          dto: check((data: unknown) => data as any),
          // Only dto provided, even though payload is in contract
        },
      },
      endpoint2: {
        resolver: vi.fn(),
        schemas: {
          dto: check((data: unknown) => data as any),
          searchParams: check((data: unknown) => data as any),
          // Both dto and searchParams provided
        },
      },
    });

    // endpoint1 should only have dto
    const schemas1 = api.getSchema("endpoint1");
    expect(schemas1).toHaveProperty("dto");
    expect(schemas1).not.toHaveProperty("error");
    expect(schemas1).not.toHaveProperty("payload");

    // endpoint2 should have dto and searchParams
    const schemas2 = api.getSchema("endpoint2");
    expect(schemas2).toHaveProperty("dto");
    expect(schemas2).toHaveProperty("searchParams");
    expect(schemas2).not.toHaveProperty("error");

    // Verify functionality
    expect(typeof schemas1.dto).toBe("function");
    expect(typeof schemas2.dto).toBe("function");
    expect(typeof schemas2.searchParams).toBe("function");

    // Verify TypeScript errors for non-existent schemas
    // @ts-expect-error - Property 'error' does not exist on endpoint1 schemas (only dto provided)
    schemas1.error;
    // @ts-expect-error - Property 'payload' does not exist on endpoint1 schemas (only dto provided)
    schemas1.payload;
    // @ts-expect-error - Property 'error' does not exist on endpoint2 schemas (only dto and searchParams provided)
    schemas2.error;
  });
});
