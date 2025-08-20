import { describe, expect, expectTypeOf, it } from "vitest";
import { init } from "../core";

describe("payload construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      post: {
        dto: null;
        error: null;
        payload: { name: string; age: number };
      };
      put: {
        dto: null;
        error: null;
        payload: { data: { value: boolean }; optional?: string };
      };
      patch: {
        dto: null;
        error: null;
      };
    };

    const contract = init({ url: "https://api.example.com" });
    const create = contract<APIContracts>();
    const api = create({
      post: { resolver: () => Promise.resolve(null) },
      put: { resolver: () => Promise.resolve(null) },
      patch: { resolver: () => Promise.resolve(null) },
    });

    const postPayload = api.payload("post", { name: "John", age: 30 });
    const putPayload = api.payload("put", { data: { value: true } });

    expect(postPayload).toEqual({ name: "John", age: 30 });
    expect(putPayload).toEqual({ data: { value: true } });

    // @ts-expect-error - missing property
    api.payload("post", { name: "John" });
    // @ts-expect-error - wrong property type
    api.payload("post", { name: "John", age: "30" });
    // @ts-expect-error - endpoint does not have payload
    api.payload("patch", {});

    const putPayloadWithOptional = api.payload("put", {
      data: { value: false },
      optional: "test",
    });
    expect(putPayloadWithOptional.optional).toBe("test");

    expectTypeOf(postPayload).toEqualTypeOf<{ name: string; age: number }>();
    expectTypeOf(putPayload).toEqualTypeOf<{
      data: { value: boolean };
      optional?: string;
    }>();
  });
});
