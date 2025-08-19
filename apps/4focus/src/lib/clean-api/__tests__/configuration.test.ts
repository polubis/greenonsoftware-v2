import { describe, it, vi, expect, beforeEach } from "vitest";
import type { CleanAPIContractsConfig, ErrorVariant } from "..";
import { cleanAPI, contract } from "..";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const { isAxiosError, isCancel } = await vi.importActual("axios");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isAxiosError.mockImplementation(isAxiosError as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isCancel.mockImplementation(isCancel as any);

describe("configuration", () => {
  type Contracts = {
    get: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      pathParams: { id: number };
      searchParams: { q: string };
    };
    post: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      payload: { name: string };
    };
  };

  const testContract = contract<Contracts>()({
    get: { method: "get", path: "/get/:id" },
    post: { method: "post", path: "/post" },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: true });
    mockedAxios.post.mockResolvedValue({ data: true });
  });

  it("applies base configuration to 'call'", async () => {
    const abortController = new AbortController();
    const baseConfig: CleanAPIContractsConfig = {
      headers: { "X-Base-Header": "base" },
      timeout: 5000,
      signal: abortController.signal,
      baseURL: "https://api.example.com",
    };
    const api = cleanAPI<Contracts>()(testContract, baseConfig);

    await api.call("get", {
      pathParams: { id: 1 },
      searchParams: { q: "test" },
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://api.example.com/get/1",
      expect.objectContaining({
        headers: { "X-Base-Header": "base" },
        timeout: 5000,
        signal: abortController.signal,
        params: { q: "test" },
      }),
    );
  });

  it("applies base configuration to 'safeCall'", async () => {
    const abortController = new AbortController();
    const baseConfig: CleanAPIContractsConfig = {
      headers: { "X-Base-Header": "base-safe" },
      timeout: 1000,
      signal: abortController.signal,
      baseURL: "https://api.example.com",
    };
    const api = cleanAPI<Contracts>()(testContract, baseConfig);

    await api.safeCall("post", { payload: { name: "test" } });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://api.example.com/post",
      { name: "test" },
      expect.objectContaining({
        headers: { "X-Base-Header": "base-safe" },
        timeout: 1000,
        signal: abortController.signal,
      }),
    );
  });

  it("handles no base config gracefully", async () => {
    const api = cleanAPI<Contracts>()(testContract);
    await api.call("get", {
      pathParams: { id: 1 },
      searchParams: { q: "test" },
    });

    const callConfig = mockedAxios.get.mock.calls[0][1];
    expect(callConfig).not.toHaveProperty("headers");
    expect(callConfig).not.toHaveProperty("timeout");
    expect(callConfig).not.toHaveProperty("baseURL");
    expect(callConfig).toHaveProperty("params", { q: "test" });
  });

  it("correctly merges path and search parameters with base config", async () => {
    const baseConfig: CleanAPIContractsConfig = {
      baseURL: "https://api.example.com",
      headers: { Authorization: "Bearer my-token" },
    };
    const api = cleanAPI<Contracts>()(testContract, baseConfig);

    await api.call("get", {
      pathParams: { id: 123 },
      searchParams: { q: "search" },
    });

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://api.example.com/get/123",
      expect.objectContaining({
        headers: { Authorization: "Bearer my-token" },
        params: { q: "search" },
      }),
    );
  });
});
