import { describe, it } from "vitest";
import type { ErrorVariant } from "..";
import { cleanAPI, contract } from "..";

describe("initialization", () => {
  it("creates a client with a valid base config", () => {
    type Contracts = {
      get: {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
      };
    };

    const apiContract = contract<Contracts>()({
      get: {
        method: "get",
        path: "/get",
      },
    });

    cleanAPI<Contracts>()(apiContract, {
      headers: { "X-Base-Header": "base" },
    });
  });

  it("does not create a client with an invalid base config", () => {
    type Contracts = {
      get: {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
      };
    };

    const apiContract = contract<Contracts>()({
      get: {
        method: "get",
        path: "/get",
      },
    });

    cleanAPI<Contracts>()(apiContract, {
      // @ts-expect-error - `params` is a forbidden property in the base config
      params: { q: "test" },
    });

    cleanAPI<Contracts>()(apiContract, {
      // @ts-expect-error - `data` is a forbidden property in the base config
      data: { forbidden: true },
    });
  });
});
