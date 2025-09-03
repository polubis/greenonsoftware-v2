/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi } from "vitest";
import { init, check, checkAsync } from "../core";
import { ValidationException } from "../models";

describe("Custom Validation Adapters", () => {
  describe("check function with custom validators", () => {
    it("should work with simple validation functions without raw schema", () => {
      const stringValidator = check((data: unknown): string => {
        if (typeof data !== "string") {
          throw new ValidationException([
            { path: [], message: "Expected string" },
          ]);
        }
        return data;
      });

      const numberValidator = check((data: unknown): number => {
        if (typeof data !== "number") {
          throw new ValidationException([
            { path: [], message: "Expected number" },
          ]);
        }
        return data;
      });

      const api = init()<{
        test: {
          payload: string;
          dto: number;
          error: { message: string };
        };
      }>()({
        test: {
          resolver: vi.fn().mockResolvedValue(42),
          schemas: {
            payload: stringValidator,
            dto: numberValidator,
          },
        },
      });

      // Should get validators but no raw schemas
      const schemas = api.getSchema("test");
      expect(typeof schemas.payload).toBe("function");
      expect(typeof schemas.dto).toBe("function");

      const rawSchemas = api.getRawSchema("test");
      expect(rawSchemas).toBeUndefined();

      // Test validation works
      expect(() => schemas.payload("hello")).not.toThrow();
      expect(() => schemas.payload(123)).toThrow();
      expect(() => schemas.dto(42)).not.toThrow();
      expect(() => schemas.dto("invalid")).toThrow();
    });

    it("should work with validation functions that have raw schemas attached", () => {
      // Custom schema objects (could be from any validation library)
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailSchema = {
        type: "string",
        format: "email",
        pattern: emailRegex.source,
        validate: (value: string) => emailRegex.test(value),
      };

      const ageSchema = {
        type: "number",
        minimum: 0,
        maximum: 150,
        validate: (value: number) => value >= 0 && value <= 150,
      };

      const emailValidator = check((data: unknown): string => {
        if (typeof data !== "string") {
          throw new ValidationException([
            { path: [], message: "Expected string" },
          ]);
        }
        if (!emailSchema.validate(data)) {
          throw new ValidationException([
            { path: [], message: "Invalid email format" },
          ]);
        }
        return data;
      }, emailSchema); // Attach raw schema

      const ageValidator = check((data: unknown): number => {
        if (typeof data !== "number") {
          throw new ValidationException([
            { path: [], message: "Expected number" },
          ]);
        }
        if (!ageSchema.validate(data)) {
          throw new ValidationException([
            { path: [], message: "Age must be between 0 and 150" },
          ]);
        }
        return data;
      }, ageSchema); // Attach raw schema

      const api = init()<{
        user: {
          payload: { email: string; age: number };
          dto: { id: string; email: string; age: number };
          error: { message: string };
        };
      }>()({
        user: {
          resolver: vi.fn().mockResolvedValue({
            id: "user-123",
            email: "test@example.com",
            age: 25,
          }),
          schemas: {
            payload: check(
              (data: unknown) => {
                const obj = data as any;
                return {
                  email: emailValidator(obj.email),
                  age: ageValidator(obj.age),
                };
              },
              {
                type: "object",
                properties: {
                  email: emailSchema,
                  age: ageSchema,
                },
              },
            ),
          },
        },
      });

      // Should get both validators and raw schemas
      const schemas = api.getSchema("user");
      expect(typeof schemas.payload).toBe("function");

      const rawSchemas = api.getRawSchema("user");
      expect(rawSchemas).toBeDefined();
      expect(rawSchemas.payload).toEqual({
        type: "object",
        properties: {
          email: emailSchema,
          age: ageSchema,
        },
      });

      // Test validation works
      const validData = { email: "test@example.com", age: 25 };
      const invalidData = { email: "invalid-email", age: 200 };

      expect(() => schemas.payload(validData)).not.toThrow();
      expect(() => schemas.payload(invalidData)).toThrow();
    });
  });

  describe("checkAsync function demonstration", () => {
    it("should demonstrate checkAsync creates async validators (not used in init)", async () => {
      // Note: The current system expects synchronous validators in init()
      // checkAsync is for cases where you need async validation outside of the main API flow

      const asyncEmailValidator = checkAsync(
        async (data: unknown): Promise<string> => {
          // Simulate async validation (e.g., checking with external service)
          await new Promise((resolve) => setTimeout(resolve, 1));

          if (typeof data !== "string") {
            throw new ValidationException([
              { path: [], message: "Expected string" },
            ]);
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(data)) {
            throw new ValidationException([
              { path: [], message: "Invalid email format" },
            ]);
          }
          return data;
        },
      );

      // Test the async validator directly
      expect(typeof asyncEmailValidator).toBe("function");
      await expect(asyncEmailValidator("test@example.com")).resolves.toBe(
        "test@example.com",
      );
      await expect(asyncEmailValidator("invalid-email")).rejects.toThrow();
    });

    it("should demonstrate checkAsync with raw schema attached", async () => {
      const asyncEmailSchema = {
        type: "string",
        format: "email",
        async: true,
        validateAsync: async (value: string) => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(value) && !value.includes("banned");
        },
      };

      const asyncEmailValidator = checkAsync(
        async (data: unknown): Promise<string> => {
          if (typeof data !== "string") {
            throw new ValidationException([
              { path: [], message: "Expected string" },
            ]);
          }

          const isValid = await asyncEmailSchema.validateAsync(data);
          if (!isValid) {
            throw new ValidationException([
              { path: [], message: "Invalid or banned email" },
            ]);
          }
          return data;
        },
        asyncEmailSchema,
      ); // Attach raw schema

      // Test that raw schema is attached
      expect((asyncEmailValidator as any).__rawSchema).toBe(asyncEmailSchema);

      // Test the validator works
      await expect(asyncEmailValidator("test@example.com")).resolves.toBe(
        "test@example.com",
      );
      await expect(asyncEmailValidator("banned@example.com")).rejects.toThrow();
    });
  });

  describe("Custom validation adapter patterns", () => {
    it("should demonstrate creating a Joi-like adapter", () => {
      // Mock Joi-like validation library
      class MockJoi {
        private _type: string;
        private _required: boolean = false;
        private _min?: number;
        private _email: boolean = false;

        constructor(type: string) {
          this._type = type;
        }

        static string() {
          return new MockJoi("string");
        }

        static number() {
          return new MockJoi("number");
        }

        static object(schema: Record<string, MockJoi>) {
          const obj = new MockJoi("object");
          (obj as any)._schema = schema;
          return obj;
        }

        required() {
          this._required = true;
          return this;
        }

        min(value: number) {
          this._min = value;
          return this;
        }

        email() {
          this._email = true;
          return this;
        }

        validate(data: unknown): { error?: Error; value?: any } {
          try {
            if (this._type === "string") {
              if (typeof data !== "string") {
                throw new Error("Expected string");
              }
              if (this._min && data.length < this._min) {
                throw new Error(`String too short, minimum ${this._min}`);
              }
              if (this._email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
                throw new Error("Invalid email");
              }
              return { value: data };
            }
            if (this._type === "number") {
              if (typeof data !== "number") {
                throw new Error("Expected number");
              }
              if (this._min && data < this._min) {
                throw new Error(`Number too small, minimum ${this._min}`);
              }
              return { value: data };
            }
            if (this._type === "object") {
              const schema = (this as any)._schema;
              const obj = data as any;
              const result: any = {};
              for (const [key, validator] of Object.entries(schema)) {
                const validation = (validator as MockJoi).validate(obj[key]);
                if (validation.error) {
                  throw new Error(`${key}: ${validation.error.message}`);
                }
                result[key] = validation.value;
              }
              return { value: result };
            }
            return { value: data };
          } catch (error) {
            return { error: error as Error };
          }
        }
      }

      // Create Joi-like adapter
      const joiCheck = <T>(schema: MockJoi) => {
        return check((data: unknown): T => {
          const result = schema.validate(data);
          if (result.error) {
            throw new ValidationException([
              { path: [], message: result.error.message },
            ]);
          }
          return result.value;
        }, schema); // Attach the Joi schema as raw schema
      };

      // Define schemas
      const userSchema = MockJoi.object({
        name: MockJoi.string().required().min(2),
        email: MockJoi.string().required().email(),
        age: MockJoi.number().required().min(0),
      });

      const api = init()<{
        joiUser: {
          payload: { name: string; email: string; age: number };
          dto: { id: string; name: string; email: string; age: number };
          error: { message: string };
        };
      }>()({
        joiUser: {
          resolver: vi.fn().mockResolvedValue({
            id: "user-123",
            name: "John Doe",
            email: "john@example.com",
            age: 30,
          }),
          schemas: {
            payload: joiCheck(userSchema),
          },
        },
      });

      // Test validation
      const schemas = api.getSchema("joiUser");
      const rawSchemas = api.getRawSchema("joiUser");

      expect(typeof schemas.payload).toBe("function");
      expect(rawSchemas).toBeDefined();
      expect(rawSchemas.payload).toBe(userSchema);

      // Test with valid data
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };
      expect(() => schemas.payload(validData)).not.toThrow();

      // Test with invalid data
      const invalidData = {
        name: "J", // too short
        email: "invalid-email",
        age: -5, // negative
      };
      expect(() => schemas.payload(invalidData)).toThrow();

      // Raw schema should be usable for client-side validation
      const clientValidation = rawSchemas.payload.validate(validData);
      expect(clientValidation.error).toBeUndefined();
      expect(clientValidation.value).toEqual(validData);

      const clientInvalidValidation = rawSchemas.payload.validate(invalidData);
      expect(clientInvalidValidation.error).toBeDefined();
    });

    it("should demonstrate creating a Yup-like adapter", () => {
      // Mock Yup-like validation library
      class MockYup {
        private _type: string;
        private _required: boolean = false;
        private _min?: number;
        private _email: boolean = false;
        private _schema?: Record<string, MockYup>;

        constructor(type: string) {
          this._type = type;
        }

        static string() {
          return new MockYup("string");
        }

        static number() {
          return new MockYup("number");
        }

        static object(schema: Record<string, MockYup>) {
          const obj = new MockYup("object");
          obj._schema = schema;
          return obj;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        required(message?: string) {
          this._required = true;
          return this;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        min(value: number, message?: string) {
          this._min = value;
          return this;
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        email(message?: string) {
          this._email = true;
          return this;
        }

        validateSync(data: unknown): any {
          if (this._type === "string") {
            if (typeof data !== "string") {
              throw new Error("Expected string");
            }
            if (this._min && data.length < this._min) {
              throw new Error(`String too short, minimum ${this._min}`);
            }
            if (this._email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data)) {
              throw new Error("Invalid email");
            }
            return data;
          }
          if (this._type === "number") {
            if (typeof data !== "number") {
              throw new Error("Expected number");
            }
            if (this._min && data < this._min) {
              throw new Error(`Number too small, minimum ${this._min}`);
            }
            return data;
          }
          if (this._type === "object" && this._schema) {
            const obj = data as any;
            const result: any = {};
            for (const [key, validator] of Object.entries(this._schema)) {
              result[key] = validator.validateSync(obj[key]);
            }
            return result;
          }
          return data;
        }

        isValidSync(data: unknown): boolean {
          try {
            this.validateSync(data);
            return true;
          } catch {
            return false;
          }
        }
      }

      // Create Yup-like adapter
      const yupCheck = <T>(schema: MockYup) => {
        return check((data: unknown): T => {
          try {
            return schema.validateSync(data) as T;
          } catch (error) {
            throw new ValidationException([
              { path: [], message: (error as Error).message },
            ]);
          }
        }, schema); // Attach the Yup schema as raw schema
      };

      // Define schemas
      const profileSchema = MockYup.object({
        username: MockYup.string().required().min(3),
        email: MockYup.string().required().email(),
        age: MockYup.number().required().min(18),
      });

      const api = init()<{
        yupProfile: {
          payload: { username: string; email: string; age: number };
          dto: { id: string; username: string; email: string; age: number };
          error: { message: string };
        };
      }>()({
        yupProfile: {
          resolver: vi.fn().mockResolvedValue({
            id: "profile-123",
            username: "johndoe",
            email: "john@example.com",
            age: 25,
          }),
          schemas: {
            payload: yupCheck(profileSchema),
          },
        },
      });

      // Test validation
      const schemas = api.getSchema("yupProfile");
      const rawSchemas = api.getRawSchema("yupProfile");

      expect(typeof schemas.payload).toBe("function");
      expect(rawSchemas).toBeDefined();
      expect(rawSchemas.payload).toBe(profileSchema);

      // Test with valid data
      const validData = {
        username: "johndoe",
        email: "john@example.com",
        age: 25,
      };
      expect(() => schemas.payload(validData)).not.toThrow();

      // Test with invalid data
      const invalidData = {
        username: "jo", // too short
        email: "invalid-email",
        age: 16, // too young
      };
      expect(() => schemas.payload(invalidData)).toThrow();

      // Raw schema should be usable for client-side validation
      expect(rawSchemas.payload.isValidSync(validData)).toBe(true);
      expect(rawSchemas.payload.isValidSync(invalidData)).toBe(false);
    });
  });

  describe("Type inference with custom adapters", () => {
    it("should properly infer types when using custom validation with raw schemas", () => {
      // Custom schema definition
      interface CustomSchema {
        type: string;
        validate: (data: unknown) => boolean;
        transform?: (data: any) => any;
      }

      const stringSchema: CustomSchema = {
        type: "string",
        validate: (data) => typeof data === "string",
      };

      const emailSchema: CustomSchema = {
        type: "email",
        validate: (data) =>
          typeof data === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data),
        transform: (data) => data.toLowerCase(),
      };

      // Custom adapter
      const customCheck = <T>(schema: CustomSchema) => {
        return check((data: unknown): T => {
          if (!schema.validate(data)) {
            throw new ValidationException([
              {
                path: [],
                message: `Validation failed for type: ${schema.type}`,
              },
            ]);
          }
          return schema.transform ? schema.transform(data) : (data as T);
        }, schema);
      };

      const api = init()<{
        custom: {
          payload: { name: string; email: string };
          dto: { id: string; name: string; email: string };
          error: { message: string };
        };
      }>()({
        custom: {
          resolver: vi.fn().mockResolvedValue({
            id: "custom-123",
            name: "Test User",
            email: "test@example.com",
          }),
          schemas: {
            payload: customCheck<{ name: string; email: string }>({
              type: "object",
              validate: (data: any) => {
                return (
                  stringSchema.validate(data.name) &&
                  emailSchema.validate(data.email)
                );
              },
              transform: (data: any) => ({
                name: data.name,
                email: emailSchema.transform!(data.email),
              }),
            }),
          },
        },
      });

      const rawSchemas = api.getRawSchema("custom");
      expect(rawSchemas).toBeDefined();
      expect(rawSchemas.payload.type).toBe("object");

      // TypeScript should infer the correct type
      const schema = rawSchemas.payload;
      expect(schema.validate({ name: "Test", email: "TEST@EXAMPLE.COM" })).toBe(
        true,
      );
      expect(schema.validate({ name: 123, email: "test@example.com" })).toBe(
        false,
      );

      // Test transform functionality
      const transformedData = schema.transform!({
        name: "Test",
        email: "TEST@EXAMPLE.COM",
      });
      expect(transformedData.email).toBe("test@example.com"); // Should be lowercase
    });
  });
});
