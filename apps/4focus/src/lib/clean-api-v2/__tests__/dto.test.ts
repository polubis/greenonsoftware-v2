import { describe, expect, expectTypeOf, it, vi } from "vitest";
import { init } from "../core";
import { ValidationException } from "../models";

describe("dto construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      get: {
        dto: { id: number };
        error: null;
      };
      post: {
        dto: { success: boolean };
        error: null;
      };
    };

    const contract = init({ url: "https://api.example.com" });
    const create = contract<APIContracts>();
    const api = create({
      get: {
        resolver: () => Promise.resolve({ id: 1 }),
      },
      post: {
        resolver: () => Promise.resolve({ success: true }),
      },
    });

    const getDto = api.dto("get", { id: 123 });
    const postDto = api.dto("post", { success: false });

    expect(getDto).toEqual({ id: 123 });
    expect(postDto).toEqual({ success: false });

    // @ts-expect-error - wrong dto structure
    api.dto("get", { id: "123" });
    // @ts-expect-error - wrong key
    api.dto("nonexistent", {});

    expectTypeOf(getDto).toEqualTypeOf<{ id: number }>();
    expectTypeOf(postDto).toEqualTypeOf<{ success: boolean }>();
  });

  describe("schema validation", () => {
    type APIContracts = {
      get: {
        dto: { id: number };
        error: null;
      };
    };

    const contract = init({ url: "https://api.example.com" });
    const create = contract<APIContracts>();

    it("is correctly typed", () => {
      const api = create({
        get: {
          resolver: () => Promise.resolve({ id: 1 }),
          schemas: {
            dto: (data) => {
              expectTypeOf(data).toEqualTypeOf<{ id: number }>();
            },
            payload: () => {},
          },
        },
      });

      const getDto = api.dto("get", { id: 123 });
      expectTypeOf(getDto).toEqualTypeOf<{ id: number }>();
    });

    it("not throw when dto is valid", () => {
      const validator = vi.fn();
      const api = create({
        get: {
          resolver: () => Promise.resolve({ id: 1 }),
          schemas: {
            dto: validator,
          },
        },
      });
      const dto = { id: 1 };
      expect(() => api.dto("get", dto)).not.toThrow();
      expect(validator).toHaveBeenCalledWith(dto);
    });

    it("throw ValidationException when dto is invalid", () => {
      const validator = vi.fn().mockImplementation(() => {
        throw new ValidationException([{ path: ["id"], message: "is wrong" }]);
      });

      const api = create({
        get: {
          resolver: () => Promise.resolve({ id: 1 }),
          schemas: {
            dto: validator,
          },
        },
      });

      const dto = { id: 1 };
      expect(() => api.dto("get", dto)).toThrow(ValidationException);
      expect(validator).toHaveBeenCalledWith(dto);
    });

    it("not throw if schema is not provided", () => {
      const api = create({
        get: {
          resolver: () => Promise.resolve({ id: 1 }),
        },
      });

      const dto = { id: 1 };
      expect(() => api.dto("get", dto)).not.toThrow();
    });
  });
});
