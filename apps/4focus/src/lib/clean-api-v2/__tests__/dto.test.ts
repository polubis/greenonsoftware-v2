import { describe, expect, expectTypeOf, it } from "vitest";
import { init } from "../core";

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
});
