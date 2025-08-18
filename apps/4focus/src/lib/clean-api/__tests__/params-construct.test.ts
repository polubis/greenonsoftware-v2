import { afterEach, beforeEach, describe, expectTypeOf, it, vi } from "vitest";
import type { ErrorVariant } from "../index";
import { contract } from "../index";

vi.mock("axios");

describe("params construction works when", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("path params are validated", () => {
    type Contracts = {
      "path-params": {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
        pathParams: {
          id: number;
        };
      };
      "bad-path-params-with-extra-prop": {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
        pathParams: {
          id: number;
        };
      };
      "bad-path-params-with-missing-prop": {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
        pathParams: {
          id: number;
        };
      };
      "bad-path-params-with-missing-slash": {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
        pathParams: {
          id: number;
        };
      };
      "bad-path-params-with-typo-in-param-name": {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
        pathParams: {
          id: number;
        };
      };
    };

    const specificContract = contract<Contracts>()({
      "path-params": {
        method: "get",
        path: "/something/:id",
      },
      "bad-path-params-with-extra-prop": {
        // @ts-expect-error - extra prop
        method: "get",
        // @ts-expect-error - extra prop
        path: "/something/:id/:extra",
      },
      "bad-path-params-with-missing-prop": {
        // @ts-expect-error - missing prop
        method: "get",
        // @ts-expect-error - missing prop
        path: "/something/:",
      },
      "bad-path-params-with-missing-slash": {
        // @ts-expect-error - missing slash
        method: "get",
        // @ts-expect-error - missing slash
        path: "something/:id",
      },
      "bad-path-params-with-typo-in-param-name": {
        // @ts-expect-error - typo in param name
        method: "get",
        // @ts-expect-error - typo in param name
        path: "/something/:id/:extra",
      },
    });

    expectTypeOf(
      specificContract["path-params"].path,
    ).toEqualTypeOf<"/something/:id">();
  });

  it("contract is enforced", () => {
    type Contracts = {
      simple: {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
      };
      "path-params": {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
        pathParams: {
          id: number;
        };
      };
    };

    const specificContract = contract<Contracts>()({
      simple: {
        method: "get",
        path: "/simple",
      },
      "path-params": {
        method: "get",
        path: "/:id",
      },
    });

    expectTypeOf(specificContract.simple.method).toEqualTypeOf<"get">();
    expectTypeOf(specificContract.simple.path).toEqualTypeOf<"/simple">();
    expectTypeOf(specificContract["path-params"].method).toEqualTypeOf<"get">();
    expectTypeOf(specificContract["path-params"].path).toEqualTypeOf<"/:id">();
  });
});
