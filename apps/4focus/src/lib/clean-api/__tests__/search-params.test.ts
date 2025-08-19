import { describe, it, vi, expect, beforeEach } from "vitest";
import type { ErrorVariant } from "..";
import { cleanAPI, contract } from "..";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("searchParams", () => {
  type Contracts = {
    get: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      searchParams: { q: string };
    };
    post: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      payload: { name: string };
      searchParams: { source: string };
    };
    put: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      payload: { name: string };
      searchParams: { notify: boolean };
    };
    patch: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      payload: { name?: string };
      searchParams: { urgent: boolean };
    };
    delete: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      searchParams: { force: boolean };
    };
  };

  const testContract = contract<Contracts>()({
    get: { method: "get", path: "/get" },
    post: { method: "post", path: "/post" },
    put: { method: "put", path: "/put" },
    patch: { method: "patch", path: "/patch" },
    delete: { method: "delete", path: "/delete" },
  });

  const api = cleanAPI<Contracts>()(testContract);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("call", () => {
    it("sends searchParams for GET requests", async () => {
      mockedAxios.get.mockResolvedValue({ data: true });
      await api.call("get", { searchParams: { q: "test" } });
      expect(mockedAxios.get).toHaveBeenCalledWith("/get", {
        params: { q: "test" },
      });
    });

    it("sends searchParams for POST requests", async () => {
      mockedAxios.post.mockResolvedValue({ data: true });
      await api.call("post", {
        payload: { name: "test" },
        searchParams: { source: "web" },
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/post",
        { name: "test" },
        { params: { source: "web" } },
      );
    });

    it("sends searchParams for PUT requests", async () => {
      mockedAxios.put.mockResolvedValue({ data: true });
      await api.call("put", {
        payload: { name: "test" },
        searchParams: { notify: true },
      });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/put",
        { name: "test" },
        { params: { notify: true } },
      );
    });

    it("sends searchParams for PATCH requests", async () => {
      mockedAxios.patch.mockResolvedValue({ data: true });
      await api.call("patch", {
        payload: { name: "test" },
        searchParams: { urgent: false },
      });
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/patch",
        { name: "test" },
        { params: { urgent: false } },
      );
    });

    it("sends searchParams for DELETE requests", async () => {
      mockedAxios.delete.mockResolvedValue({ data: true });
      await api.call("delete", { searchParams: { force: true } });
      expect(mockedAxios.delete).toHaveBeenCalledWith("/delete", {
        params: { force: true },
      });
    });
  });

  describe("safeCall", () => {
    it("sends searchParams for GET requests", async () => {
      mockedAxios.get.mockResolvedValue({ data: true });
      await api.safeCall("get", { searchParams: { q: "test" } });
      expect(mockedAxios.get).toHaveBeenCalledWith("/get", {
        params: { q: "test" },
      });
    });

    it("sends searchParams for POST requests", async () => {
      mockedAxios.post.mockResolvedValue({ data: true });
      await api.safeCall("post", {
        payload: { name: "test" },
        searchParams: { source: "web" },
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        "/post",
        { name: "test" },
        { params: { source: "web" } },
      );
    });

    it("sends searchParams for PUT requests", async () => {
      mockedAxios.put.mockResolvedValue({ data: true });
      await api.safeCall("put", {
        payload: { name: "test" },
        searchParams: { notify: true },
      });
      expect(mockedAxios.put).toHaveBeenCalledWith(
        "/put",
        { name: "test" },
        { params: { notify: true } },
      );
    });

    it("sends searchParams for PATCH requests", async () => {
      mockedAxios.patch.mockResolvedValue({ data: true });
      await api.safeCall("patch", {
        payload: { name: "test" },
        searchParams: { urgent: false },
      });
      expect(mockedAxios.patch).toHaveBeenCalledWith(
        "/patch",
        { name: "test" },
        { params: { urgent: false } },
      );
    });

    it("sends searchParams for DELETE requests", async () => {
      mockedAxios.delete.mockResolvedValue({ data: true });
      await api.safeCall("delete", { searchParams: { force: true } });
      expect(mockedAxios.delete).toHaveBeenCalledWith("/delete", {
        params: { force: true },
      });
    });
  });
});
