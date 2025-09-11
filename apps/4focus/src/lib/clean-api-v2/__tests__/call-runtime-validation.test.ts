/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { init } from "../core";
import { ValidationException } from "../models";
import type { ErrorVariant } from "../models";

describe("Call Runtime Validation", () => {
  type APIContracts = {
    getUserById: {
      dto: { id: number; name: string; email: string };
      error: ErrorVariant<"not_found", 404>;
      pathParams: { id: string };
      searchParams: { include: string };
    };
    createUser: {
      dto: { id: number; success: boolean };
      error: ErrorVariant<"bad_request", 400>;
      payload: { name: string; email: string; age?: number };
      extra: { requestId: string };
    };
    updateSettings: {
      dto: { success: boolean };
      error: ErrorVariant<"forbidden", 403>;
      payload: { theme: "light" | "dark"; notifications: boolean };
      pathParams: { userId: string };
      searchParams: { force: boolean };
      extra: { auditLog: boolean };
    };
    noSchemaEndpoint: {
      dto: { message: string };
      error: ErrorVariant<"error", 500>;
      payload: { data: unknown };
    };
  };

  const mockGetUserResolver = vi.fn();
  const mockCreateUserResolver = vi.fn();
  const mockUpdateSettingsResolver = vi.fn();
  const mockNoSchemaResolver = vi.fn();

  const pathParamsValidator = vi.fn((data: unknown) => {
    const params = data as { id?: string; userId?: string };

    // Check for id field (getUserById endpoint)
    if (params.id !== undefined) {
      if (!params.id || typeof params.id !== "string") {
        throw new ValidationException([
          { path: ["id"], message: "ID must be a non-empty string" },
        ]);
      }
    }

    // Check for userId field (updateSettings endpoint)
    if (params.userId !== undefined) {
      if (!params.userId || typeof params.userId !== "string") {
        throw new ValidationException([
          { path: ["userId"], message: "User ID must be a non-empty string" },
        ]);
      }
    }

    // Ensure at least one ID field is present
    if (!params.id && !params.userId) {
      throw new ValidationException([
        { path: ["id"], message: "ID must be a non-empty string" },
      ]);
    }

    return data;
  });

  const searchParamsValidator = vi.fn((data: unknown) => {
    const params = data as { include?: string; force?: boolean };
    if (params.include && typeof params.include !== "string") {
      throw new ValidationException([
        { path: ["include"], message: "Include must be a string" },
      ]);
    }
    if (params.force !== undefined && typeof params.force !== "boolean") {
      throw new ValidationException([
        { path: ["force"], message: "Force must be a boolean" },
      ]);
    }
    return data;
  });

  const payloadValidator = vi.fn((data: unknown) => {
    const payload = data as {
      name?: string;
      email?: string;
      age?: number;
      theme?: string;
      notifications?: boolean;
    };
    if (
      payload.name !== undefined &&
      (typeof payload.name !== "string" || payload.name.length === 0)
    ) {
      throw new ValidationException([
        { path: ["name"], message: "Name must be a non-empty string" },
      ]);
    }
    if (
      payload.email !== undefined &&
      (typeof payload.email !== "string" || !payload.email.includes("@"))
    ) {
      throw new ValidationException([
        { path: ["email"], message: "Email must be a valid email address" },
      ]);
    }
    if (
      payload.age !== undefined &&
      (typeof payload.age !== "number" || payload.age < 0)
    ) {
      throw new ValidationException([
        { path: ["age"], message: "Age must be a positive number" },
      ]);
    }
    if (
      payload.theme !== undefined &&
      !["light", "dark"].includes(payload.theme)
    ) {
      throw new ValidationException([
        { path: ["theme"], message: "Theme must be 'light' or 'dark'" },
      ]);
    }
    if (
      payload.notifications !== undefined &&
      typeof payload.notifications !== "boolean"
    ) {
      throw new ValidationException([
        { path: ["notifications"], message: "Notifications must be a boolean" },
      ]);
    }
    return data;
  });

  const extraValidator = vi.fn((data: unknown) => {
    const extra = data as { requestId?: string; auditLog?: boolean };
    if (extra.requestId !== undefined && typeof extra.requestId !== "string") {
      throw new ValidationException([
        { path: ["requestId"], message: "RequestId must be a string" },
      ]);
    }
    if (extra.auditLog !== undefined && typeof extra.auditLog !== "boolean") {
      throw new ValidationException([
        { path: ["auditLog"], message: "AuditLog must be a boolean" },
      ]);
    }
    return data;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserResolver.mockResolvedValue({
      id: 1,
      name: "John",
      email: "john@example.com",
    });
    mockCreateUserResolver.mockResolvedValue({ id: 1, success: true });
    mockUpdateSettingsResolver.mockResolvedValue({ success: true });
    mockNoSchemaResolver.mockResolvedValue({ message: "success" });
  });

  describe("Valid Parameters", () => {
    it("should pass validation and call resolver when all parameters are valid", async () => {
      const api = init()<APIContracts>()({
        getUserById: {
          resolver: mockGetUserResolver,
          schemas: {
            pathParams: pathParamsValidator as any,
            searchParams: searchParamsValidator as any,
          },
        },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      const result = await api.call("getUserById", {
        pathParams: { id: "123" },
        searchParams: { include: "profile" },
      });

      expect(pathParamsValidator).toHaveBeenCalledWith({ id: "123" });
      expect(searchParamsValidator).toHaveBeenCalledWith({
        include: "profile",
      });
      expect(mockGetUserResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        searchParams: { include: "profile" },
      });
      expect(result).toEqual({
        id: 1,
        name: "John",
        email: "john@example.com",
      });
    });

    it("should pass validation for complex endpoint with all parameter types", async () => {
      const api = init()<APIContracts>()({
        getUserById: { resolver: mockGetUserResolver },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: {
          resolver: mockUpdateSettingsResolver,
          schemas: {
            pathParams: pathParamsValidator as any,
            searchParams: searchParamsValidator as any,
            payload: payloadValidator as any,
            extra: extraValidator as any,
          },
        },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      const result = await api.call("updateSettings", {
        pathParams: { userId: "456" },
        searchParams: { force: true },
        payload: { theme: "dark", notifications: false },
        extra: { auditLog: true },
      });

      expect(pathParamsValidator).toHaveBeenCalledWith({ userId: "456" });
      expect(searchParamsValidator).toHaveBeenCalledWith({ force: true });
      expect(payloadValidator).toHaveBeenCalledWith({
        theme: "dark",
        notifications: false,
      });
      expect(extraValidator).toHaveBeenCalledWith({ auditLog: true });
      expect(mockUpdateSettingsResolver).toHaveBeenCalled();
      expect(result).toEqual({ success: true });
    });

    it("should pass validation when only some parameters have schemas", async () => {
      const api = init()<APIContracts>()({
        getUserById: { resolver: mockGetUserResolver },
        createUser: {
          resolver: mockCreateUserResolver,
          schemas: {
            payload: payloadValidator as any, // Only payload has schema
          },
        },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      const result = await api.call("createUser", {
        payload: { name: "Alice", email: "alice@example.com", age: 25 },
        extra: { requestId: "req-123" }, // No schema for extra, should be passed through
      });

      expect(payloadValidator).toHaveBeenCalledWith({
        name: "Alice",
        email: "alice@example.com",
        age: 25,
      });
      expect(extraValidator).not.toHaveBeenCalled();
      expect(mockCreateUserResolver).toHaveBeenCalledWith({
        payload: { name: "Alice", email: "alice@example.com", age: 25 },
        extra: { requestId: "req-123" },
      });
      expect(result).toEqual({ id: 1, success: true });
    });
  });

  describe("Invalid Parameters", () => {
    it("should throw ValidationException when pathParams validation fails", async () => {
      const api = init()<APIContracts>()({
        getUserById: {
          resolver: mockGetUserResolver,
          schemas: {
            pathParams: pathParamsValidator as any,
          },
        },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      await expect(
        api.call("getUserById", {
          pathParams: { id: "" }, // Invalid: empty string
          searchParams: { include: "profile" },
        }),
      ).rejects.toThrow(ValidationException);

      expect(pathParamsValidator).toHaveBeenCalledWith({ id: "" });
      expect(mockGetUserResolver).not.toHaveBeenCalled();
    });

    it("should throw ValidationException when searchParams validation fails", async () => {
      const api = init()<APIContracts>()({
        getUserById: {
          resolver: mockGetUserResolver,
          schemas: {
            pathParams: pathParamsValidator as any,
            searchParams: searchParamsValidator as any,
          },
        },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      await expect(
        api.call("getUserById", {
          pathParams: { id: "123" },
          searchParams: { include: 123 as any }, // Invalid: number instead of string
        }),
      ).rejects.toThrow(ValidationException);

      expect(pathParamsValidator).toHaveBeenCalledWith({ id: "123" });
      expect(searchParamsValidator).toHaveBeenCalledWith({ include: 123 });
      expect(mockGetUserResolver).not.toHaveBeenCalled();
    });

    it("should throw ValidationException when payload validation fails", async () => {
      const api = init()<APIContracts>()({
        getUserById: { resolver: mockGetUserResolver },
        createUser: {
          resolver: mockCreateUserResolver,
          schemas: {
            payload: payloadValidator as any,
          },
        },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      await expect(
        api.call("createUser", {
          payload: { name: "", email: "invalid-email" }, // Invalid: empty name, invalid email
          extra: { requestId: "req-123" },
        }),
      ).rejects.toThrow(ValidationException);

      expect(payloadValidator).toHaveBeenCalledWith({
        name: "",
        email: "invalid-email",
      });
      expect(mockCreateUserResolver).not.toHaveBeenCalled();
    });

    it("should throw ValidationException when extra validation fails", async () => {
      const api = init()<APIContracts>()({
        getUserById: { resolver: mockGetUserResolver },
        createUser: {
          resolver: mockCreateUserResolver,
          schemas: {
            extra: extraValidator as any,
          },
        },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      await expect(
        api.call("createUser", {
          payload: { name: "Alice", email: "alice@example.com" },
          extra: { requestId: 123 as any }, // Invalid: number instead of string
        }),
      ).rejects.toThrow(ValidationException);

      expect(extraValidator).toHaveBeenCalledWith({ requestId: 123 });
      expect(mockCreateUserResolver).not.toHaveBeenCalled();
    });

    it("should validate parameters in correct order and fail on first invalid parameter", async () => {
      const api = init()<APIContracts>()({
        getUserById: { resolver: mockGetUserResolver },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: {
          resolver: mockUpdateSettingsResolver,
          schemas: {
            pathParams: pathParamsValidator as any,
            searchParams: searchParamsValidator as any,
            payload: payloadValidator as any,
            extra: extraValidator as any,
          },
        },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      // pathParams is invalid, so the rest shouldn't be validated
      await expect(
        api.call("updateSettings", {
          pathParams: { userId: "" }, // Invalid
          searchParams: { force: "invalid" as any }, // Also invalid, but shouldn't be reached
          payload: { theme: "dark", notifications: false },
          extra: { auditLog: true },
        }),
      ).rejects.toThrow(ValidationException);

      expect(pathParamsValidator).toHaveBeenCalledWith({ userId: "" });
      // These should not be called because pathParams failed first
      expect(searchParamsValidator).not.toHaveBeenCalled();
      expect(payloadValidator).not.toHaveBeenCalled();
      expect(extraValidator).not.toHaveBeenCalled();
      expect(mockUpdateSettingsResolver).not.toHaveBeenCalled();
    });
  });

  describe("No Schema Scenarios", () => {
    it("should not validate when no schemas are defined for the endpoint", async () => {
      const api = init()<APIContracts>()({
        getUserById: { resolver: mockGetUserResolver },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: {
          resolver: mockNoSchemaResolver,
        },
      });

      const result = await api.call("noSchemaEndpoint", {
        payload: { data: "anything" }, // Should pass through without validation
      });

      expect(mockNoSchemaResolver).toHaveBeenCalledWith({
        payload: { data: "anything" },
      });
      expect(result).toEqual({ message: "success" });
    });

    it("should not validate parameters that don't have schemas", async () => {
      const api = init()<APIContracts>()({
        getUserById: {
          resolver: mockGetUserResolver,
          schemas: {
            pathParams: pathParamsValidator as any,
            // searchParams has no schema, should be passed through
          },
        },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      const result = await api.call("getUserById", {
        pathParams: { id: "123" }, // Will be validated
        searchParams: { include: "anything" }, // Won't be validated
      });

      expect(pathParamsValidator).toHaveBeenCalledWith({ id: "123" });
      expect(searchParamsValidator).not.toHaveBeenCalled();
      expect(mockGetUserResolver).toHaveBeenCalledWith({
        pathParams: { id: "123" },
        searchParams: { include: "anything" },
      });
      expect(result).toEqual({
        id: 1,
        name: "John",
        email: "john@example.com",
      });
    });
  });

  describe("Schema Validator Edge Cases", () => {
    it("should handle schema validators that throw non-ValidationException errors", async () => {
      const throwingValidator = vi.fn(() => {
        throw new Error("Custom error from validator");
      });

      const api = init()<APIContracts>()({
        getUserById: {
          resolver: mockGetUserResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            pathParams: throwingValidator,
          },
        },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      await expect(
        api.call("getUserById", {
          pathParams: { id: "123" },
          searchParams: { include: "profile" },
        }),
      ).rejects.toThrow("Custom error from validator");

      expect(throwingValidator).toHaveBeenCalledWith({ id: "123" });
      expect(mockGetUserResolver).not.toHaveBeenCalled();
    });

    it("should handle schema validators that return different data", async () => {
      const transformingValidator = vi.fn((data: unknown) => {
        // Validator can transform the data
        const params = data as { id: string };
        return { id: params.id.toUpperCase() };
      });

      const api = init()<APIContracts>()({
        getUserById: {
          resolver: mockGetUserResolver,
          schemas: {
            // @ts-expect-error - no raw schema attached with metadata property
            pathParams: transformingValidator,
          },
        },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      await api.call("getUserById", {
        pathParams: { id: "abc" },
        searchParams: { include: "profile" },
      });

      expect(transformingValidator).toHaveBeenCalledWith({ id: "abc" });
      // Note: Current implementation returns original data, but this test documents behavior
      expect(mockGetUserResolver).toHaveBeenCalledWith({
        pathParams: { id: "abc" }, // Original data is passed, not transformed
        searchParams: { include: "profile" },
      });
    });
  });

  describe("safeCall Runtime Validation", () => {
    it("should return validation errors in safeCall result", async () => {
      const api = init()<APIContracts>()({
        getUserById: {
          resolver: mockGetUserResolver,
          schemas: {
            pathParams: pathParamsValidator as any,
          },
        },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      const result = await api.safeCall("getUserById", {
        pathParams: { id: "" }, // Invalid
        searchParams: { include: "profile" },
      });

      expect(result[0]).toBe(false);
      expect(result[1]).toBeInstanceOf(ValidationException);
      expect(pathParamsValidator).toHaveBeenCalledWith({ id: "" });
      expect(mockGetUserResolver).not.toHaveBeenCalled();
    });

    it("should return successful result when validation passes in safeCall", async () => {
      const api = init()<APIContracts>()({
        getUserById: {
          resolver: mockGetUserResolver,
          schemas: {
            pathParams: pathParamsValidator as any,
          },
        },
        createUser: { resolver: mockCreateUserResolver },
        updateSettings: { resolver: mockUpdateSettingsResolver },
        noSchemaEndpoint: { resolver: mockNoSchemaResolver },
      });

      const result = await api.safeCall("getUserById", {
        pathParams: { id: "123" },
        searchParams: { include: "profile" },
      });

      expect(result[0]).toBe(true);
      expect(result[1]).toEqual({
        id: 1,
        name: "John",
        email: "john@example.com",
      });
      expect(pathParamsValidator).toHaveBeenCalledWith({ id: "123" });
      expect(mockGetUserResolver).toHaveBeenCalled();
    });
  });
});
