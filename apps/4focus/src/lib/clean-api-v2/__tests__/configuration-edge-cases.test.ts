import { describe, expect, expectTypeOf, it, vi, beforeEach } from "vitest";
import { init } from "../core";
import type { ErrorVariant } from "../models";

describe("Configuration Edge Cases", () => {
  type APIContracts = {
    get: {
      dto: { id: number };
      error: ErrorVariant<"not_found", 404>;
      pathParams: { id: string };
    };
    post: {
      dto: { success: boolean };
      error: ErrorVariant<"bad_request", 400>;
      payload: { data: string };
    };
  };

  const mockGetResolver = vi.fn();
  const mockPostResolver = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Invalid Configuration Types", () => {
    it("handles null configuration gracefully", async () => {
      // @ts-expect-error - null is not a valid configuration
      const api = init(null)<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      // Config should not be passed to resolver when null
      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
      });
    });

    it("handles undefined configuration explicitly", async () => {
      const api = init(undefined)<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
      });
    });

    it("handles configuration with missing required properties", async () => {
      // @ts-expect-error - missing url property
      const api = init({})<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: {},
      });
    });

    it("handles configuration with extra properties", async () => {
      const api = init({
        url: "https://api.example.com",
        extraProp: "should be ignored",
        timeout: 5000,
      } as { url: string; extraProp: string; timeout: number })<APIContracts>()(
        {
          get: { resolver: mockGetResolver },
          post: { resolver: mockPostResolver },
        },
      );

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: {
          url: "https://api.example.com",
          extraProp: "should be ignored",
          timeout: 5000,
        },
      });
    });
  });

  describe("Configuration Value Edge Cases", () => {
    it("handles empty string URL", async () => {
      const api = init({ url: "" })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: { url: "" },
      });
    });

    it("handles very long URL", async () => {
      const longUrl = "https://api.example.com/" + "a".repeat(1000);
      const api = init({ url: longUrl })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: { url: longUrl },
      });
    });

    it("handles URL with special characters", async () => {
      const specialUrl =
        "https://api.example.com/üñíçödé/ᵞḘἙ?param=value&other=test";
      const api = init({ url: specialUrl })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: { url: specialUrl },
      });
    });

    it("handles malformed URL that's still a string", async () => {
      const malformedUrl = "not-a-valid-url";
      const api = init({ url: malformedUrl })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: { url: malformedUrl },
      });
    });
  });

  describe("Configuration Isolation", () => {
    it("multiple API instances have isolated configurations", async () => {
      const api1 = init({ url: "https://api1.example.com" })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      const api2 = init({ url: "https://api2.example.com" })<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });

      await api1.call("get", { pathParams: { id: "123" } });
      expect(mockGetResolver).toHaveBeenLastCalledWith({
        pathParams: { id: "123" },
        config: { url: "https://api1.example.com" },
      });

      await api2.call("get", { pathParams: { id: "456" } });
      expect(mockGetResolver).toHaveBeenLastCalledWith({
        pathParams: { id: "456" },
        config: { url: "https://api2.example.com" },
      });
    });

    it("configuration is passed by reference (not immutable)", async () => {
      const config = { url: "https://api.example.com" };
      const api = init(config)<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      // Mutate the original config object
      config.url = "https://hacked.example.com";

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      // API uses the mutated config since it's passed by reference
      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: { url: "https://hacked.example.com" },
      });
    });
  });

  describe("Configuration with Complex Types", () => {
    it("handles configuration with nested objects", async () => {
      type ComplexConfig = {
        url: string;
        auth: {
          token: string;
          type: "bearer" | "basic";
        };
        timeout: number;
      };

      const complexConfig: ComplexConfig = {
        url: "https://api.example.com",
        auth: {
          token: "secret-token",
          type: "bearer",
        },
        timeout: 5000,
      };

      const api = init(complexConfig)<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: complexConfig,
      });
    });

    it("handles configuration with arrays", async () => {
      type ConfigWithArrays = {
        url: string;
        headers: string[];
        retryStatuses: number[];
      };

      const configWithArrays: ConfigWithArrays = {
        url: "https://api.example.com",
        headers: [
          "Content-Type: application/json",
          "Authorization: Bearer token",
        ],
        retryStatuses: [500, 502, 503],
      };

      const api = init(configWithArrays)<APIContracts>()({
        get: { resolver: mockGetResolver },
        post: { resolver: mockPostResolver },
      });

      mockGetResolver.mockResolvedValue({ id: 1 });
      await api.call("get", { pathParams: { id: "123" } });

      expect(mockGetResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        config: configWithArrays,
      });
    });
  });

  describe("Configuration Type Safety", () => {
    it("preserves exact configuration type in resolver", async () => {
      type CustomConfig = {
        url: string;
        apiKey: string;
        version: number;
      };

      const customConfig: CustomConfig = {
        url: "https://api.example.com",
        apiKey: "my-api-key",
        version: 2,
      };

      const api = init(customConfig)<APIContracts>()({
        get: {
          resolver: (input) => {
            // Type check that config has the exact type
            expectTypeOf(input.config).toEqualTypeOf<CustomConfig>();
            return Promise.resolve({ id: 1 });
          },
        },
        post: { resolver: mockPostResolver },
      });

      await api.call("get", { pathParams: { id: "123" } });
    });

    it("handles no configuration with correct types", async () => {
      const api = init()<APIContracts>()({
        get: {
          resolver: (input) => {
            // When no config is provided, input should not have config property
            expectTypeOf(input).not.toHaveProperty("config");
            return Promise.resolve({ id: 1 });
          },
        },
        post: { resolver: mockPostResolver },
      });

      await api.call("get", { pathParams: { id: "123" } });
    });
  });
});
