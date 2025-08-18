import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { ErrorVariant } from "..";
import { cleanAPI, contract } from "..";

vi.mock("axios");

type TestContracts = {
  getUser: {
    dto: { id: number; name: string };
    error: ErrorVariant<"error", 500>;
    pathParams: { id: string };
  };
  getUsers: {
    dto: { id: number; name: string }[];
    error: ErrorVariant<"error", 500>;
    searchParams: { limit: number };
  };
  createUser: {
    dto: { id: number; name: string };
    error: ErrorVariant<"validation_error", 400, { fields: string[] }>;
    payload: { name: string };
  };
  noInput: {
    dto: { success: boolean };
    error: ErrorVariant<"error", 500>;
  };
};

const testConfig = contract<TestContracts>()({
  getUser: { method: "get", path: "/users/:id" },
  getUsers: { method: "get", path: "/users" },
  createUser: { method: "post", path: "/users" },
  noInput: { method: "get", path: "/health" },
});

const api = cleanAPI<TestContracts>()(testConfig);

describe("utils works when", () => {
  describe("pathParams", () => {
    it("returns and infers the correct type", () => {
      const pathParams = { id: "1" };
      const result = api.pathParams("getUser", pathParams);

      expect(result).toBe(pathParams);
      expectTypeOf(result).toEqualTypeOf<{ id: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - 'createUser' does not have 'pathParams'.
      api.pathParams("createUser", {});

      // @ts-expect-error - pathParams for 'getUser' has the wrong shape (id should be string).
      api.pathParams("getUser", { id: 123 });
    });
  });

  describe("payload", () => {
    it("returns and infers the correct type", () => {
      const payload = { name: "Test" };
      const result = api.payload("createUser", payload);

      expect(result).toBe(payload);
      expectTypeOf(result).toEqualTypeOf<{ name: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - 'getUsers' does not have 'payload'.
      api.payload("getUsers", {});

      // @ts-expect-error - Payload for 'createUser' has the wrong shape.
      api.payload("createUser", { name: 123 });
    });
  });

  describe("searchParams", () => {
    it("returns and infers the correct type", () => {
      const searchParams = { limit: 10 };
      const result = api.searchParams("getUsers", searchParams);

      expect(result).toBe(searchParams);
      expectTypeOf(result).toEqualTypeOf<{ limit: number }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - 'createUser' does not have 'searchParams'.
      api.searchParams("createUser", {});

      // @ts-expect-error - searchParams for 'getUsers' has the wrong shape.
      api.searchParams("getUsers", { limit: "10" });
    });
  });

  describe("dto", () => {
    it("returns and infers the correct type", () => {
      const dto = { id: 1, name: "Test" };
      const result = api.dto("createUser", dto);

      expect(result).toBe(dto);
      expectTypeOf(result).toEqualTypeOf<{ id: number; name: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - Incorrect DTO shape for `createUser`
      api.dto("createUser", { id: "1", name: "test" });

      const usersDto = [{ id: 1, name: "Test" }];
      const usersResult = api.dto("getUsers", usersDto);
      expect(usersResult).toBe(usersDto);
      expectTypeOf(usersResult).toEqualTypeOf<{ id: number; name: string }[]>();
    });
  });

  describe("error", () => {
    it("returns and infers the correct type", () => {
      const error: TestContracts["createUser"]["error"] = {
        type: "validation_error",
        status: 400,
        message: "Invalid input",
        meta: { fields: ["name"] },
      };
      const result = api.error("createUser", error);

      expect(result).toBe(error);
      expectTypeOf(result).toEqualTypeOf<
        ErrorVariant<"validation_error", 400, { fields: string[] }>
      >();
    });

    it("fails type-checking for incorrect usage", () => {
      api.error("createUser", {
        // @ts-expect-error - 'error' is not a valid error type for `createUser`
        type: "error",
        // @ts-expect-error - 'error' is not a valid error type for `createUser`
        status: 500,
        message: "Server error",
      });

      const invalidMetaError = {
        type: "validation_error",
        status: 400,
        message: "Invalid input",
        meta: { fields: [123] },
      };
      // @ts-expect-error - `meta` property has the wrong shape
      api.error("createUser", invalidMetaError);
    });
  });
});
