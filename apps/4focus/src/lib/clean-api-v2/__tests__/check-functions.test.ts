/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it } from "vitest";
import { check, checkAsync } from "../core";
import { ValidationException } from "../models";

describe("Check Function Factories", () => {
  describe("check (synchronous)", () => {
    it("should create a sync validator that passes valid data through", () => {
      const validateString = check((data: unknown): string => {
        if (typeof data !== "string") {
          throw new ValidationException([
            { path: [], message: "Expected string" },
          ]);
        }
        return data;
      });

      const result = validateString("hello");
      expect(result).toBe("hello");
    });

    it("should create a sync validator that throws ValidationException for invalid data", () => {
      const validateNumber = check((data: unknown): number => {
        if (typeof data !== "number") {
          throw new ValidationException([
            { path: [], message: "Expected number" },
          ]);
        }
        return data;
      });

      expect(() => validateNumber("not a number")).toThrow(ValidationException);
    });

    it("should preserve original data structure in sync validator", () => {
      const validateUser = check(
        (data: unknown): { name: string; age: number } => {
          const user = data as any;
          if (!user.name || typeof user.name !== "string") {
            throw new ValidationException([
              { path: ["name"], message: "Name must be a string" },
            ]);
          }
          if (!user.age || typeof user.age !== "number") {
            throw new ValidationException([
              { path: ["age"], message: "Age must be a number" },
            ]);
          }
          return user;
        },
      );

      const userData = { name: "Alice", age: 30 };
      const result = validateUser(userData);
      expect(result).toEqual(userData);
      expect(result).toBe(userData); // Should be the same reference
    });
  });

  describe("checkAsync (asynchronous)", () => {
    it("should create an async validator that passes valid data through", async () => {
      const validateStringAsync = checkAsync(
        async (data: unknown): Promise<string> => {
          // Simulate async operation
          await new Promise((resolve) => setTimeout(resolve, 1));

          if (typeof data !== "string") {
            throw new ValidationException([
              { path: [], message: "Expected string" },
            ]);
          }
          return data;
        },
      );

      const result = await validateStringAsync("hello");
      expect(result).toBe("hello");
    });

    it("should create an async validator that throws ValidationException for invalid data", async () => {
      const validateNumberAsync = checkAsync(
        async (data: unknown): Promise<number> => {
          await new Promise((resolve) => setTimeout(resolve, 1));

          if (typeof data !== "number") {
            throw new ValidationException([
              { path: [], message: "Expected number" },
            ]);
          }
          return data;
        },
      );

      await expect(validateNumberAsync("not a number")).rejects.toThrow(
        ValidationException,
      );
    });

    it("should handle async database-like validation", async () => {
      // Simulate async database check
      const existingEmails = ["taken@example.com", "existing@test.com"];

      const validateUniqueEmail = checkAsync(
        async (data: unknown): Promise<string> => {
          const email = data as string;

          if (typeof email !== "string" || !email.includes("@")) {
            throw new ValidationException([
              { path: [], message: "Invalid email format" },
            ]);
          }

          // Simulate async database lookup
          await new Promise((resolve) => setTimeout(resolve, 5));

          if (existingEmails.includes(email)) {
            throw new ValidationException([
              { path: [], message: "Email already exists" },
            ]);
          }

          return email;
        },
      );

      // Should pass for new email
      const newEmail = await validateUniqueEmail("new@example.com");
      expect(newEmail).toBe("new@example.com");

      // Should fail for existing email
      await expect(validateUniqueEmail("taken@example.com")).rejects.toThrow(
        ValidationException,
      );
    });

    it("should preserve original data structure in async validator", async () => {
      const validateUserAsync = checkAsync(
        async (data: unknown): Promise<{ name: string; age: number }> => {
          await new Promise((resolve) => setTimeout(resolve, 1));

          const user = data as any;
          if (!user.name || typeof user.name !== "string") {
            throw new ValidationException([
              { path: ["name"], message: "Name must be a string" },
            ]);
          }
          if (!user.age || typeof user.age !== "number") {
            throw new ValidationException([
              { path: ["age"], message: "Age must be a number" },
            ]);
          }
          return user;
        },
      );

      const userData = { name: "Bob", age: 25 };
      const result = await validateUserAsync(userData);
      expect(result).toEqual(userData);
      expect(result).toBe(userData); // Should be the same reference
    });
  });

  describe("Mixed usage scenarios", () => {
    it("should work with both sync and async validators in sequence", async () => {
      const syncValidator = check((data: unknown): string => {
        if (typeof data !== "string") {
          throw new ValidationException([
            { path: [], message: "Expected string" },
          ]);
        }
        return data.trim();
      });

      const asyncValidator = checkAsync(
        async (data: unknown): Promise<string> => {
          await new Promise((resolve) => setTimeout(resolve, 1));

          const str = data as string;
          if (str.length < 3) {
            throw new ValidationException([
              { path: [], message: "String too short" },
            ]);
          }
          return str.toUpperCase();
        },
      );

      // First sync validation, then async
      const step1 = syncValidator("  hello  ");
      expect(step1).toBe("hello");

      const step2 = await asyncValidator(step1);
      expect(step2).toBe("HELLO");
    });

    it("should handle error propagation correctly", async () => {
      const failingSync = check((_data: unknown): never => {
        throw new ValidationException([
          { path: [], message: "Sync validation failed" },
        ]);
      });

      const failingAsync = checkAsync(
        async (_data: unknown): Promise<never> => {
          await new Promise((resolve) => setTimeout(resolve, 1));
          throw new ValidationException([
            { path: [], message: "Async validation failed" },
          ]);
        },
      );

      expect(() => failingSync("test")).toThrow(ValidationException);
      await expect(failingAsync("test")).rejects.toThrow(ValidationException);
    });
  });

  describe("Type safety", () => {
    it("should maintain proper TypeScript types for sync validators", () => {
      const validateTypedData = check(
        (data: unknown): { id: number; name: string } => {
          const obj = data as any;
          if (typeof obj.id !== "number" || typeof obj.name !== "string") {
            throw new ValidationException([
              { path: [], message: "Invalid structure" },
            ]);
          }
          return obj;
        },
      );

      const result = validateTypedData({ id: 1, name: "test" });

      // TypeScript should infer the correct type
      expect(typeof result.id).toBe("number");
      expect(typeof result.name).toBe("string");
    });

    it("should maintain proper TypeScript types for async validators", async () => {
      const validateTypedDataAsync = checkAsync(
        async (data: unknown): Promise<{ id: number; name: string }> => {
          await new Promise((resolve) => setTimeout(resolve, 1));

          const obj = data as any;
          if (typeof obj.id !== "number" || typeof obj.name !== "string") {
            throw new ValidationException([
              { path: [], message: "Invalid structure" },
            ]);
          }
          return obj;
        },
      );

      const result = await validateTypedDataAsync({
        id: 2,
        name: "async test",
      });

      // TypeScript should infer the correct type
      expect(typeof result.id).toBe("number");
      expect(typeof result.name).toBe("string");
    });
  });
});
