import { describe, it, expectTypeOf, vi, expect, beforeEach } from "vitest";
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

describe("dto", () => {
  type Contracts = {
    get: {
      dto: { id: number; name: string };
      error: ErrorVariant<"error", 500>;
    };
    getList: {
      dto: { id: number; name: string }[];
      error: ErrorVariant<"error", 500>;
    };
    noInput: {
      dto: { success: boolean };
      error: ErrorVariant<"error", 500>;
    };
  };

  const testContract = contract<Contracts>()({
    get: { method: "get", path: "/get" },
    getList: { method: "get", path: "/get-list" },
    noInput: { method: "get", path: "/no-input" },
  });

  const api = cleanAPI<Contracts>()(testContract);

  describe("helper", () => {
    it("returns and infers the correct type", () => {
      const dto = { id: 1, name: "Test" };
      const result = api.dto("get", dto);
      expectTypeOf(result).toEqualTypeOf<{ id: number; name: string }>();
    });

    it("fails type-checking for incorrect usage", () => {
      // @ts-expect-error - Incorrect DTO shape for `get`
      api.dto("get", { id: "1", name: "test" });

      // @ts-expect-error - Incorrect DTO shape for `getList`
      api.dto("getList", { id: 1, name: "test" });

      const usersDto = [{ id: 1, name: "Test" }];
      const usersResult = api.dto("getList", usersDto);
      expectTypeOf(usersResult).toEqualTypeOf<{ id: number; name: string }[]>();
    });

    it("handles noInput endpoint correctly", () => {
      const noInputDto = { success: true };
      const result = api.dto("noInput", noInputDto);
      expectTypeOf(result).toEqualTypeOf<{ success: boolean }>();
    });
  });

  describe("runtime", () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it("returns the correct DTO from 'call'", async () => {
      const user = { id: 1, name: "Test" };
      mockedAxios.get.mockResolvedValue({ data: user });
      const result = await api.call("get");
      expect(result).toEqual(user);
    });

    it("returns the correct DTO from 'safeCall'", async () => {
      const users = [{ id: 1, name: "Test" }];
      mockedAxios.get.mockResolvedValue({ data: users });
      const [isSuccess, data] = await api.safeCall("getList");
      expect(isSuccess).toBe(true);
      expect(data).toEqual(users);
    });
  });
});
