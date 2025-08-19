import { describe, expect, expectTypeOf, it, vi, beforeEach } from "vitest";
import type { ErrorVariant } from "..";
import { cleanAPI, contract } from "..";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("path params", () => {
  type Contracts = {
    "no-params": {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
    };
    "one-param": {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      pathParams: { id: string };
    };
    "two-params": {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      pathParams: { id: string; second: string };
    };
  };

  const testContract = contract<Contracts>()({
    "no-params": { method: "get", path: "/no-params" },
    "one-param": { method: "get", path: "/one-param/:id" },
    "two-params": { method: "get", path: "/two-params/:id/:second" },
  });

  const api = cleanAPI<Contracts>()(testContract);

  describe("helper", () => {
    it("returns and infers the correct type", () => {
      const pathParams = { id: "1" };
      const result = api.pathParams("one-param", pathParams);

      expect(result).toBe(pathParams);
      expectTypeOf(result).toEqualTypeOf<{ id: string }>();
    });

    it("returns and infers the correct type for two params", () => {
      const pathParams = { id: "1", second: "2" };
      const result = api.pathParams("two-params", pathParams);

      expect(result).toBe(pathParams);
      expectTypeOf(result).toEqualTypeOf<{ id: string; second: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - 'no-params' does not have 'pathParams'.
      api.pathParams("no-params", {});

      // @ts-expect-error - pathParams for 'one-param' has the wrong shape (id should be string).
      api.pathParams("one-param", { id: 123 });

      // @ts-expect-error - pathParams for 'two-params' has the wrong shape (id should be string).
      api.pathParams("two-params", { id: 123, second: "2" });

      // @ts-expect-error - pathParams for 'two-params' is missing 'second' property.
      api.pathParams("two-params", { id: "1" });
    });
  });

  describe("runtime", () => {
    beforeEach(() => {
      mockedAxios.get.mockClear();
      mockedAxios.get.mockResolvedValue({ data: true });
    });

    it("constructs path with one parameter", async () => {
      await api.call("one-param", { pathParams: { id: "123" } });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/one-param/123",
        expect.anything(),
      );
    });

    it("constructs path with two parameters", async () => {
      await api.call("two-params", {
        pathParams: { id: "abc", second: "def" },
      });
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/two-params/abc/def",
        expect.anything(),
      );
    });

    it("constructs path with no parameters", async () => {
      await api.call("no-params");
      expect(mockedAxios.get).toHaveBeenCalledWith(
        "/no-params",
        expect.anything(),
      );
    });
  });
});
