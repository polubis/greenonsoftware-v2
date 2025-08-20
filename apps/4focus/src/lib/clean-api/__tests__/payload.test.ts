import { describe, it, vi, expect, beforeEach, expectTypeOf } from "vitest";
import type { ErrorVariant } from "..";
import { cleanAPI, contract } from "..";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const { isAxiosError, isCancel } = await vi.importActual("axios");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isAxiosError.mockImplementation(isAxiosError as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isCancel.mockImplementation(isCancel as any);

describe("payload", () => {
  type Contracts = {
    post: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      payload: { name: string };
    };
    put: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      payload: { name: string };
    };
    patch: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      payload: { name?: string };
    };
  };

  const testContract = contract<Contracts>()({
    post: { method: "post", path: "/post" },
    put: { method: "put", path: "/put" },
    patch: { method: "patch", path: "/patch" },
  });

  const api = cleanAPI<Contracts>()(testContract);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("call", () => {
    it("sends payload for POST requests", async () => {
      mockedAxios.post.mockResolvedValue({ data: true });
      await api.call("post", { payload: { name: "test" } });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/post",
        { name: "test" },
        expect.any(Object),
      );
    });

    it("sends payload for PUT requests", async () => {
      mockedAxios.put.mockResolvedValue({ data: true });
      await api.call("put", { payload: { name: "test" } });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/put",
        { name: "test" },
        expect.any(Object),
      );
    });

    it("sends payload for PATCH requests", async () => {
      mockedAxios.patch.mockResolvedValue({ data: true });
      await api.call("patch", { payload: { name: "test" } });
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/patch",
        { name: "test" },
        expect.any(Object),
      );
    });
  });

  describe("safeCall", () => {
    it("sends payload for POST requests", async () => {
      mockedAxios.post.mockResolvedValue({ data: true });
      await api.safeCall("post", { payload: { name: "test" } });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/post",
        { name: "test" },
        expect.any(Object),
      );
    });

    it("sends payload for PUT requests", async () => {
      mockedAxios.put.mockResolvedValue({ data: true });
      await api.safeCall("put", { payload: { name: "test" } });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/put",
        { name: "test" },
        expect.any(Object),
      );
    });

    it("sends payload for PATCH requests", async () => {
      mockedAxios.patch.mockResolvedValue({ data: true });
      await api.safeCall("patch", { payload: { name: "test" } });
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/patch",
        { name: "test" },
        expect.any(Object),
      );
    });
  });

  describe("helper", () => {
    it("returns and infers the correct type", () => {
      const p = { name: "test" };
      const result = api.payload("post", p);
      expect(result).toBe(p);
      expectTypeOf(result).toEqualTypeOf<{ name: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - Payload for 'post' has the wrong shape.
      api.payload("post", { name: 123 });

      // @ts-expect-error - Payload for 'post' is missing 'name' property.
      api.payload("post", {});
    });
  });
});
