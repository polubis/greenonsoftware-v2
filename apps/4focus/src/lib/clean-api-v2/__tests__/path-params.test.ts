import { describe, expect, expectTypeOf, it } from "vitest";
import { init } from "../core";

describe("path params construction works when", () => {
  it("creation is based on contract", () => {
    type APIContracts = {
      get: {
        dto: null;
        error: null;
        pathParams: { id: string };
      };
      post: {
        dto: null;
        error: null;
        pathParams: { id: string; commentId: number };
      };
      put: {
        dto: null;
        error: null;
      };
    };

    const contract = init({ url: "https://api.example.com" });
    const create = contract<APIContracts>();
    const api = create({
      get: { resolver: () => Promise.resolve(null) },
      post: { resolver: () => Promise.resolve(null) },
      put: { resolver: () => Promise.resolve(null) },
    });

    const getPathParams = api.pathParams("get", { id: "1" });
    const postPathParams = api.pathParams("post", {
      id: "1",
      commentId: 123,
    });

    expect(getPathParams).toEqual({ id: "1" });
    expect(postPathParams).toEqual({ id: "1", commentId: 123 });

    // @ts-expect-error - missing property
    api.pathParams("post", { id: "1" });
    // @ts-expect-error - wrong property type
    api.pathParams("post", { id: 1, commentId: 123 });
    // @ts-expect-error - endpoint does not have pathParams
    api.pathParams("put", {});

    expectTypeOf(getPathParams).toEqualTypeOf<{ id: string }>();
    expectTypeOf(postPathParams).toEqualTypeOf<{
      id: string;
      commentId: number;
    }>();
  });
});
