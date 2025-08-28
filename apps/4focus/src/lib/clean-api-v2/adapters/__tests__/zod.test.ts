import { describe, it, expect } from "vitest";
import { z } from "zod";
import { check } from "../zod";
import { ValidationException } from "../../models";

describe("Zod adapter works when", () => {
  const schema = z.object({
    name: z.string().min(1),
    age: z.number().positive(),
  });

  it("validation passes for valid data", () => {
    const data = { name: "John", age: 30 };
    const result = check(schema)(data);
    expect(result).toEqual(data);
  });

  it("validation throws ValidationException for invalid data", () => {
    const invalidData = { name: "", age: -5 };
    try {
      check(schema)(invalidData);
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationException);
      if (error instanceof ValidationException) {
        expect(error.issues).toEqual([
          {
            path: ["name"],
            message: "Too small: expected string to have >=1 characters",
          },
          { path: ["age"], message: "Too small: expected number to be >0" },
        ]);
      }
    }
  });

  it("validation returns the parsed data on success", () => {
    const data = { name: "Jane", age: 25, extra: "field" };
    const result = check(schema)(data);
    expect(result).toEqual({ name: "Jane", age: 25 });
  });
});
