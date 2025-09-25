/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { init, check } from "../core";
import { zodCheck } from "../adapters/zod";
import * as z from "zod";

describe("Type Inference Demo - getSchema returns only provided schemas", () => {
  it("demonstrates perfect type inference with different schema combinations", () => {
    type ExampleContracts = {
      onlyDto: {
        dto: { id: number };
        error: { message: string };
      };
      dtoAndPayload: {
        dto: { success: boolean };
        error: { code: number };
        payload: { input: string };
      };
      allSchemas: {
        dto: { data: string[] };
        error: { type: string };
        pathParams: { id: string };
        searchParams: { q: string };
        payload: { body: unknown };
        extra: { meta: Record<string, unknown> };
      };
      noSchemas: {
        dto: { result: string };
        error: { error: string };
      };
    };

    const userSchema = z.object({
      input: z.string().min(1),
    });

    const api = init()<ExampleContracts>()({
      // Contract 1: Only dto schema provided
      onlyDto: {
        resolver: vi.fn().mockResolvedValue({ id: 123 }),
        schemas: {
          dto: check((data: unknown): { id: number } => data as any),
          // NOTE: error schema is NOT provided, even though it's in the contract
        },
      },

      // Contract 2: dto and payload schemas provided
      dtoAndPayload: {
        resolver: vi.fn().mockResolvedValue({ success: true }),
        schemas: {
          dto: check((data: unknown): { success: boolean } => data as any),
          payload: zodCheck(userSchema),
          // NOTE: error schema is NOT provided
        },
      },

      // Contract 3: All possible schemas provided
      allSchemas: {
        resolver: vi.fn().mockResolvedValue({ data: ["item1", "item2"] }),
        schemas: {
          dto: check((data: unknown) => data as any),
          error: check((data: unknown) => data as any),
          pathParams: check((data: unknown) => data as any),
          searchParams: check((data: unknown) => data as any),
          payload: check((data: unknown) => data as any),
          extra: check((data: unknown) => data as any),
        },
      },

      // Contract 4: No schemas provided at all
      noSchemas: {
        resolver: vi.fn().mockResolvedValue({ result: "done" }),
        // No schemas property
      },
    });

    // 🎯 Contract 1: Only dto schema was provided
    const schemas1 = api.getSchema("onlyDto");

    // ✅ Can access dto (provided)
    expect(schemas1).toHaveProperty("dto");
    expect(typeof schemas1.dto).toBe("function");

    // ❌ TypeScript prevents access to non-provided schemas
    // @ts-expect-error - Property 'error' does not exist (not provided in schemas)
    schemas1.error;
    // @ts-expect-error - Property 'payload' does not exist (not provided in schemas)
    schemas1.payload;
    // @ts-expect-error - Property 'pathParams' does not exist (not provided in schemas)
    schemas1.pathParams;

    // 🎯 Contract 2: dto and payload schemas were provided
    const schemas2 = api.getSchema("dtoAndPayload");

    // ✅ Can access dto and payload (provided)
    expect(schemas2).toHaveProperty("dto");
    expect(schemas2).toHaveProperty("payload");
    expect(typeof schemas2.dto).toBe("function");
    expect(typeof schemas2.payload).toBe("function");

    // ❌ TypeScript prevents access to non-provided schemas
    // @ts-expect-error - Property 'error' does not exist (not provided in schemas)
    schemas2.error;
    // @ts-expect-error - Property 'pathParams' does not exist (not provided in schemas)
    schemas2.pathParams;
    // @ts-expect-error - Property 'searchParams' does not exist (not provided in schemas)
    schemas2.searchParams;
    // @ts-expect-error - Property 'extra' does not exist (not provided in schemas)
    schemas2.extra;

    // 🎯 Contract 3: All schemas were provided
    const schemas3 = api.getSchema("allSchemas");

    // ✅ Can access all schemas (all provided)
    expect(schemas3).toHaveProperty("dto");
    expect(schemas3).toHaveProperty("error");
    expect(schemas3).toHaveProperty("pathParams");
    expect(schemas3).toHaveProperty("searchParams");
    expect(schemas3).toHaveProperty("payload");
    expect(schemas3).toHaveProperty("extra");

    // 🎯 Contract 4: No schemas were provided
    const schemas4 = api.getSchema("noSchemas");

    // ✅ Returns undefined when no schemas provided
    expect(schemas4).toBeUndefined();

    // 🎯 Demonstrate destructuring works perfectly

    // ✅ Can destructure only provided schemas
    const { dto: onlyDtoValidator } = schemas1;
    const { dto: dtoValidator, payload: payloadValidator } = schemas2;
    const {
      dto: allDtoValidator,
      pathParams: pathParamsValidator,
      extra: extraValidator,
    } = schemas3;

    expect(typeof onlyDtoValidator).toBe("function");
    expect(typeof dtoValidator).toBe("function");
    expect(typeof payloadValidator).toBe("function");
    expect(typeof allDtoValidator).toBe("function");
    expect(typeof pathParamsValidator).toBe("function");
    expect(typeof extraValidator).toBe("function");

    // ❌ TypeScript prevents destructuring non-provided schemas
    // @ts-expect-error - Property 'error' does not exist on schemas1
    const { error: errorValidator1 } = schemas1;
    // @ts-expect-error - Property 'extra' does not exist on schemas2
    const { extra: extraValidator2 } = schemas2;

    // 🎯 Test actual validation functionality
    expect(() => onlyDtoValidator({ id: 42 })).not.toThrow();
    expect(() => payloadValidator({ input: "test" })).not.toThrow();
    expect(() => payloadValidator({ input: "" })).toThrow(); // Zod validation fails for empty string
  });

  it("demonstrates type inference with conditional schema provision", () => {
    type ConditionalContract = {
      endpoint: {
        dto: { value: string };
        error: { message: string };
        payload?: { data: string }; // Optional in contract
      };
    };

    // Scenario 1: Payload schema is provided
    const apiWithPayload = init()<ConditionalContract>()({
      endpoint: {
        resolver: vi.fn().mockResolvedValue({ value: "test" }),
        schemas: {
          dto: check((data: unknown) => data as any),
          payload: check((data: unknown) => data as any),
          // error schema intentionally omitted
        },
      },
    });

    const schemasWithPayload = apiWithPayload.getSchema("endpoint");

    // ✅ Has dto and payload (provided)
    expect(schemasWithPayload).toHaveProperty("dto");
    expect(schemasWithPayload).toHaveProperty("payload");

    // ❌ No error schema (not provided)
    expect(schemasWithPayload).not.toHaveProperty("error");
    // @ts-expect-error - Property 'error' does not exist (not provided)
    schemasWithPayload.error;

    // Scenario 2: Payload schema is NOT provided
    const apiWithoutPayload = init()<ConditionalContract>()({
      endpoint: {
        resolver: vi.fn().mockResolvedValue({ value: "test" }),
        schemas: {
          dto: check((data: unknown) => data as any),
          // payload schema intentionally omitted
          // error schema intentionally omitted
        },
      },
    });

    const schemasWithoutPayload = apiWithoutPayload.getSchema("endpoint");

    // ✅ Has only dto (provided)
    expect(schemasWithoutPayload).toHaveProperty("dto");

    // ❌ No payload or error schemas (not provided)
    expect(schemasWithoutPayload).not.toHaveProperty("payload");
    expect(schemasWithoutPayload).not.toHaveProperty("error");
    // @ts-expect-error - Property 'payload' does not exist (not provided)
    schemasWithoutPayload.payload;
    // @ts-expect-error - Property 'error' does not exist (not provided)
    schemasWithoutPayload.error;
  });
});
