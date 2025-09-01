/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { init } from "../core";
import { ValidationException } from "../models";
import { zodCheck } from "../adapters/zod";
import z from "zod";

describe("React Hook Form + Zod Integration with getSchema", () => {
  // Define Zod schemas for different form types
  const userRegistrationSchema = z
    .object({
      username: z.string().min(3, "Username must be at least 3 characters"),
      email: z.string().email("Invalid email address"),
      password: z.string().min(8, "Password must be at least 8 characters"),
      confirmPassword: z.string(),
      age: z.number().min(18, "Must be at least 18 years old"),
      terms: z.boolean().refine((val) => val === true, {
        message: "You must accept the terms and conditions",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });

  const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().optional(),
  });

  const profileUpdateSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    bio: z.string().max(500, "Bio must be less than 500 characters").optional(),
    website: z.string().url("Invalid URL").optional().or(z.literal("")),
    notifications: z.object({
      email: z.boolean(),
      push: z.boolean(),
      sms: z.boolean(),
    }),
  });

  // Define API response schemas
  const userResponseSchema = z.object({
    id: z.string(),
    username: z.string(),
    email: z.string(),
    createdAt: z.string(),
  });

  const errorResponseSchema = z.object({
    message: z.string(),
    field: z.string().optional(),
    code: z.number(),
  });

  // Define contracts for different API endpoints
  type UserApiContracts = {
    register: {
      payload: z.infer<typeof userRegistrationSchema>;
      dto: z.infer<typeof userResponseSchema>;
      error: z.infer<typeof errorResponseSchema>;
    };
    login: {
      payload: z.infer<typeof loginSchema>;
      dto: { token: string; user: z.infer<typeof userResponseSchema> };
      error: z.infer<typeof errorResponseSchema>;
    };
    updateProfile: {
      payload: z.infer<typeof profileUpdateSchema>;
      dto: z.infer<typeof userResponseSchema>;
      error: z.infer<typeof errorResponseSchema>;
      pathParams: { userId: string };
    };
    getUserProfile: {
      dto: z.infer<typeof userResponseSchema>;
      error: z.infer<typeof errorResponseSchema>;
      pathParams: { userId: string };
    };
  };

  describe("Form Validation Examples", () => {
    it("should demonstrate user registration form validation", () => {
      const api = init()<UserApiContracts>()({
        register: {
          resolver: vi.fn().mockResolvedValue({
            id: "user-123",
            username: "john_doe",
            email: "john@example.com",
            createdAt: "2024-01-01T00:00:00Z",
          }),
          schemas: {
            payload: zodCheck(userRegistrationSchema),
            dto: zodCheck(userResponseSchema),
            error: zodCheck(errorResponseSchema),
          },
        },
        login: { resolver: vi.fn() },
        updateProfile: { resolver: vi.fn() },
        getUserProfile: { resolver: vi.fn() },
      });

      // Get validation functions for the registration form
      const schemas = api.getSchema("register");
      const { payload: validateRegistrationForm } = schemas;

      // Simulate react-hook-form validation scenarios
      describe("Valid form data", () => {
        const validFormData = {
          username: "john_doe",
          email: "john@example.com",
          password: "securePassword123",
          confirmPassword: "securePassword123",
          age: 25,
          terms: true,
        };

        // This would be used in react-hook-form's resolver
        expect(() => validateRegistrationForm(validFormData)).not.toThrow();
        const validatedData = validateRegistrationForm(validFormData);
        expect(validatedData).toEqual(validFormData);
      });

      describe("Invalid form data scenarios", () => {
        // Short username
        const shortUsernameData = {
          username: "jo", // Too short
          email: "john@example.com",
          password: "securePassword123",
          confirmPassword: "securePassword123",
          age: 25,
          terms: true,
        };

        expect(() => validateRegistrationForm(shortUsernameData)).toThrow(
          ValidationException,
        );

        // Invalid email
        const invalidEmailData = {
          username: "john_doe",
          email: "not-an-email", // Invalid email
          password: "securePassword123",
          confirmPassword: "securePassword123",
          age: 25,
          terms: true,
        };

        expect(() => validateRegistrationForm(invalidEmailData)).toThrow(
          ValidationException,
        );

        // Password mismatch
        const passwordMismatchData = {
          username: "john_doe",
          email: "john@example.com",
          password: "securePassword123",
          confirmPassword: "differentPassword", // Passwords don't match
          age: 25,
          terms: true,
        };

        expect(() => validateRegistrationForm(passwordMismatchData)).toThrow(
          ValidationException,
        );

        // Terms not accepted
        const termsNotAcceptedData = {
          username: "john_doe",
          email: "john@example.com",
          password: "securePassword123",
          confirmPassword: "securePassword123",
          age: 25,
          terms: false, // Terms not accepted
        };

        expect(() => validateRegistrationForm(termsNotAcceptedData)).toThrow(
          ValidationException,
        );
      });
    });

    it("should demonstrate login form validation", () => {
      const api = init()<UserApiContracts>()({
        login: {
          resolver: vi.fn().mockResolvedValue({
            token: "jwt-token-123",
            user: {
              id: "user-123",
              username: "john_doe",
              email: "john@example.com",
              createdAt: "2024-01-01T00:00:00Z",
            },
          }),
          schemas: {
            payload: zodCheck(loginSchema),
            dto: zodCheck(
              z.object({
                token: z.string(),
                user: userResponseSchema,
              }),
            ),
            error: zodCheck(errorResponseSchema),
          },
        },
        register: { resolver: vi.fn() },
        updateProfile: { resolver: vi.fn() },
        getUserProfile: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("login");
      const { payload: validateLoginForm } = schemas;

      // Valid login data
      const validLoginData = {
        email: "john@example.com",
        password: "password123",
        rememberMe: true,
      };

      expect(() => validateLoginForm(validLoginData)).not.toThrow();

      // Optional field test
      const validLoginWithoutRememberMe = {
        email: "john@example.com",
        password: "password123",
        // rememberMe is optional
      };

      expect(() =>
        validateLoginForm(validLoginWithoutRememberMe),
      ).not.toThrow();

      // Invalid login data
      const invalidLoginData = {
        email: "not-an-email",
        password: "", // Empty password
        rememberMe: true,
      };

      expect(() => validateLoginForm(invalidLoginData)).toThrow(
        ValidationException,
      );
    });

    it("should demonstrate profile update form with complex nested validation", () => {
      const api = init()<UserApiContracts>()({
        updateProfile: {
          resolver: vi.fn().mockResolvedValue({
            id: "user-123",
            username: "john_doe",
            email: "john@example.com",
            createdAt: "2024-01-01T00:00:00Z",
          }),
          schemas: {
            payload: zodCheck(profileUpdateSchema),
            dto: zodCheck(userResponseSchema),
            error: zodCheck(errorResponseSchema),
            pathParams: zodCheck(z.object({ userId: z.string() })),
          },
        },
        register: { resolver: vi.fn() },
        login: { resolver: vi.fn() },
        getUserProfile: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("updateProfile");

      // Type inference ensures we can access all provided schemas
      expect(schemas).toHaveProperty("payload");
      expect(schemas).toHaveProperty("dto");
      expect(schemas).toHaveProperty("error");
      expect(schemas).toHaveProperty("pathParams");

      const { payload: validateProfileForm, pathParams: validatePathParams } =
        schemas;

      // Valid profile data with nested object
      const validProfileData = {
        firstName: "John",
        lastName: "Doe",
        bio: "Software developer passionate about clean code",
        website: "https://johndoe.dev",
        notifications: {
          email: true,
          push: false,
          sms: true,
        },
      };

      expect(() => validateProfileForm(validProfileData)).not.toThrow();

      // Valid profile data with optional fields empty
      const validProfileDataMinimal = {
        firstName: "John",
        lastName: "Doe",
        website: "", // Empty string is allowed
        notifications: {
          email: true,
          push: false,
          sms: false,
        },
      };

      expect(() => validateProfileForm(validProfileDataMinimal)).not.toThrow();

      // Valid path params
      const validPathParams = { userId: "user-123" };
      expect(() => validatePathParams(validPathParams)).not.toThrow();

      // Invalid profile data scenarios
      const invalidProfileData = {
        firstName: "", // Required field empty
        lastName: "Doe",
        bio: "a".repeat(501), // Bio too long
        website: "not-a-url", // Invalid URL
        notifications: {
          email: true,
          push: false,
          // sms missing - should fail
        },
      };

      expect(() => validateProfileForm(invalidProfileData)).toThrow(
        ValidationException,
      );
    });
  });

  describe("React Hook Form Integration Patterns", () => {
    it("should demonstrate how to use with react-hook-form resolver pattern", () => {
      const api = init()<UserApiContracts>()({
        register: {
          resolver: vi.fn(),
          schemas: {
            payload: zodCheck(userRegistrationSchema),
          },
        },
        login: { resolver: vi.fn() },
        updateProfile: { resolver: vi.fn() },
        getUserProfile: { resolver: vi.fn() },
      });

      // Get the validation function
      const schemas = api.getSchema("register");
      const { payload: validateForm } = schemas;

      // Simulate react-hook-form resolver function
      const createFormResolver = (validator: typeof validateForm) => {
        return (values: any) => {
          try {
            const validatedData = validator(values);
            return {
              values: validatedData,
              errors: {},
            };
          } catch (error) {
            if (ValidationException.is(error)) {
              // Convert ValidationException to react-hook-form errors format
              const formErrors: Record<string, { message: string }> = {};

              error.issues.forEach((issue) => {
                const fieldPath = issue.path.join(".");
                if (fieldPath) {
                  formErrors[fieldPath] = { message: issue.message };
                } else {
                  formErrors.root = { message: issue.message };
                }
              });

              return {
                values: {},
                errors: formErrors,
              };
            }

            return {
              values: {},
              errors: { root: { message: "Validation failed" } },
            };
          }
        };
      };

      const formResolver = createFormResolver(validateForm);

      // Test valid data
      const validResult = formResolver({
        username: "john_doe",
        email: "john@example.com",
        password: "securePassword123",
        confirmPassword: "securePassword123",
        age: 25,
        terms: true,
      });

      expect(validResult.errors).toEqual({});
      expect(validResult.values).toBeDefined();

      // Test invalid data
      const invalidResult = formResolver({
        username: "jo", // Too short
        email: "not-an-email",
        password: "short",
        confirmPassword: "different",
        age: 16,
        terms: false,
      });

      expect(Object.keys(invalidResult.errors).length).toBeGreaterThan(0);
      expect(invalidResult.values).toEqual({});
    });

    it("should demonstrate type-safe form field validation", () => {
      const api = init()<UserApiContracts>()({
        updateProfile: {
          resolver: vi.fn(),
          schemas: {
            payload: zodCheck(profileUpdateSchema),
          },
        },
        register: { resolver: vi.fn() },
        login: { resolver: vi.fn() },
        getUserProfile: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("updateProfile");
      const { payload: validateProfile } = schemas;

      // Simulate field-level validation for real-time feedback
      const validateField = (fieldName: string, value: any, allValues: any) => {
        try {
          // Create a complete object with the field value
          const testData = { ...allValues, [fieldName]: value };
          validateProfile(testData);
          return null; // No error
        } catch (error) {
          if (ValidationException.is(error)) {
            const fieldError = error.issues.find((issue) =>
              issue.path.includes(fieldName),
            );
            return fieldError ? fieldError.message : null;
          }
          return "Validation error";
        }
      };

      // Test field validation scenarios
      const baseFormData = {
        firstName: "John",
        lastName: "Doe",
        notifications: { email: true, push: false, sms: false },
      };

      // Valid field values
      expect(validateField("firstName", "John", baseFormData)).toBeNull();
      expect(
        validateField("website", "https://example.com", baseFormData),
      ).toBeNull();
      expect(validateField("website", "", baseFormData)).toBeNull(); // Empty is valid

      // Invalid field values would return error messages
      // Note: This is a simplified example - real implementation would need more sophisticated field isolation
    });
  });

  describe("Error Handling and User Feedback", () => {
    it("should demonstrate comprehensive error handling for forms", () => {
      const api = init()<UserApiContracts>()({
        register: {
          resolver: vi.fn(),
          schemas: {
            payload: zodCheck(userRegistrationSchema),
            error: zodCheck(errorResponseSchema),
          },
        },
        login: { resolver: vi.fn() },
        updateProfile: { resolver: vi.fn() },
        getUserProfile: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("register");
      const { payload: validateForm, error: validateError } = schemas;

      // Test comprehensive form validation with detailed error extraction
      const extractFormErrors = (formData: any) => {
        try {
          validateForm(formData);
          return { isValid: true, errors: [] };
        } catch (error) {
          if (ValidationException.is(error)) {
            const formattedErrors = error.issues.map((issue) => ({
              field: issue.path.join(".") || "form",
              message: issue.message,
            }));

            return {
              isValid: false,
              errors: formattedErrors,
              summary: `Form has ${formattedErrors.length} validation errors`,
            };
          }
          return {
            isValid: false,
            errors: [{ field: "form", message: "Unknown validation error" }],
          };
        }
      };

      // Test with multiple validation errors
      const invalidFormData = {
        username: "jo", // Too short
        email: "invalid-email", // Invalid format
        password: "123", // Too short
        confirmPassword: "456", // Doesn't match
        age: 16, // Too young
        terms: false, // Not accepted
      };

      const result = extractFormErrors(invalidFormData);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.field.includes("username"))).toBe(
        true,
      );
      expect(result.errors.some((e) => e.field.includes("email"))).toBe(true);
      expect(result.errors.some((e) => e.field.includes("password"))).toBe(
        true,
      );

      // Test API error response validation
      const validApiError = {
        message: "Email already exists",
        field: "email",
        code: 409,
      };

      expect(() => validateError(validApiError)).not.toThrow();

      const invalidApiError = {
        message: "Error",
        code: "not-a-number", // Should be number
      };

      expect(() => validateError(invalidApiError)).toThrow(ValidationException);
    });
  });

  describe("Performance and Caching Considerations", () => {
    it("should demonstrate schema reuse and caching patterns", () => {
      const api = init()<UserApiContracts>()({
        register: {
          resolver: vi.fn(),
          schemas: {
            payload: zodCheck(userRegistrationSchema),
          },
        },
        login: {
          resolver: vi.fn(),
          schemas: {
            payload: zodCheck(loginSchema),
          },
        },
        updateProfile: { resolver: vi.fn() },
        getUserProfile: { resolver: vi.fn() },
      });

      // Multiple calls to getSchema return consistent schemas
      const schemas1 = api.getSchema("register");
      const schemas2 = api.getSchema("register");

      // While object references may differ, the validators themselves are the same
      expect(schemas1.payload).toBe(schemas2.payload); // Same validator reference
      expect(typeof schemas1.payload).toBe("function");
      expect(typeof schemas2.payload).toBe("function");

      // Different endpoints should have different schemas
      const loginSchemas = api.getSchema("login");
      expect(loginSchemas.payload).not.toBe(schemas1.payload);

      // This demonstrates that schema validators are consistently returned
      // and different endpoints have different validation functions
    });
  });

  describe("TypeScript Integration and Type Safety", () => {
    it("should demonstrate compile-time type safety", () => {
      const api = init()<UserApiContracts>()({
        updateProfile: {
          resolver: vi.fn(),
          schemas: {
            payload: zodCheck(profileUpdateSchema),
            pathParams: zodCheck(z.object({ userId: z.string() })),
            // Note: dto and error schemas intentionally omitted
          },
        },
        register: { resolver: vi.fn() },
        login: { resolver: vi.fn() },
        getUserProfile: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("updateProfile");

      // TypeScript knows which schemas are available
      expect(typeof schemas.payload).toBe("function");
      expect(typeof schemas.pathParams).toBe("function");

      // TypeScript prevents access to non-existent schemas
      // @ts-expect-error - Property 'dto' does not exist (not provided in schemas)
      schemas.dto;
      // @ts-expect-error - Property 'error' does not exist (not provided in schemas)
      schemas.error;
      // @ts-expect-error - Property 'searchParams' does not exist (not provided in schemas)
      schemas.searchParams;
      // @ts-expect-error - Property 'extra' does not exist (not provided in schemas)
      schemas.extra;

      // This ensures that developers can only use schemas that were actually
      // configured for the endpoint, preventing runtime errors
    });

    it("should demonstrate contract without any schemas", () => {
      const api = init()<UserApiContracts>()({
        getUserProfile: {
          resolver: vi.fn(),
          // No schemas provided at all
        },
        register: { resolver: vi.fn() },
        login: { resolver: vi.fn() },
        updateProfile: { resolver: vi.fn() },
      });

      const schemas = api.getSchema("getUserProfile");

      // Should return undefined when no schemas are provided
      expect(schemas).toBeUndefined();

      // This is useful for endpoints that don't need validation
      // or use server-side validation only
    });
  });
});
