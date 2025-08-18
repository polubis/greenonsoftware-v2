import { describe, it, expect } from "vitest";

// A placeholder function to demonstrate testing.
// Replace this with an actual import from your library, e.g.,
// import { yourFunction } from "@/lib/clean-api";
function add(a: number, b: number): number {
  return a + b;
}

// 'describe' creates a test suite, a container for related tests
describe("add function", () => {
  // 'it' defines an individual test case
  it("should return the sum of two numbers", () => {
    // 'expect' is used to make an assertion
    // We expect the result of add(2, 3) to be 5.
    expect(add(2, 3)).toBe(5);
  });
});
