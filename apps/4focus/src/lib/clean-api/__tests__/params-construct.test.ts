import { describe, expectTypeOf, it, vi, expect, beforeEach } from "vitest";
import type { ErrorVariant } from "..";
import { cleanAPI, contract } from "..";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const { isAxiosError, isCancel } = await vi.importActual("axios");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isAxiosError.mockImplementation(isAxiosError as any);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
mockedAxios.isCancel.mockImplementation(isCancel as any);

describe("params construction", () => {
  it("validates path params", () => {
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
      "without-path-params-object-but-with-path-params": {
        dto: boolean;
        error: ErrorVariant<"my_error", 500>;
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
      "without-path-params-object-but-with-path-params": {
        // @ts-expect-error - Dynamic path params are not allowed without a path params object.
        method: "get",
        // @ts-expect-error - Dynamic path params are not allowed without a path params object.
        path: "/something/:id",
      },
    });

    cleanAPI<Contracts>()({
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
      "without-path-params-object-but-with-path-params": {
        // @ts-expect-error - Dynamic path params are not allowed without a path params object.
        method: "get",
        // @ts-expect-error - Dynamic path params are not allowed without a path params object.
        path: "/something/:id",
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

describe("Runtime path construction", () => {
  type Contracts = {
    singleParam: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      pathParams: { id: number };
    };
    twoParams: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      pathParams: { userId: string; postId: string };
    };
    noParams: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
    };
    paramAtStart: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      pathParams: { version: string };
    };
    paramWithQuery: {
      dto: boolean;
      error: ErrorVariant<"error", 500>;
      pathParams: { id: number };
      searchParams: { q: string };
    };
  };

  const testContract = contract<Contracts>()({
    singleParam: { method: "get", path: "/users/:id" },
    twoParams: { method: "get", path: "/users/:userId/posts/:postId" },
    noParams: { method: "get", path: "/health" },
    paramAtStart: { method: "get", path: "/:version/users" },
    paramWithQuery: { method: "get", path: "/users/:id" },
  });

  const api = cleanAPI<Contracts>()(testContract);

  beforeEach(() => {
    mockedAxios.get.mockClear();
    mockedAxios.get.mockResolvedValue({ data: true });
  });

  it("constructs path with a single parameter", async () => {
    await api.call("singleParam", { pathParams: { id: 123 } });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/users/123",
      expect.anything(),
    );
  });

  it("constructs path with two parameters", async () => {
    await api.call("twoParams", {
      pathParams: { userId: "abc", postId: "def" },
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/users/abc/posts/def",
      expect.anything(),
    );
  });

  it("handles paths with no parameters", async () => {
    await api.call("noParams");
    expect(mockedAxios.get).toHaveBeenCalledWith("/health", expect.anything());
  });

  it("constructs path with a parameter at the start", async () => {
    await api.call("paramAtStart", { pathParams: { version: "v1" } });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/v1/users",
      expect.anything(),
    );
  });

  it("constructs path correctly when search parameters are also present", async () => {
    await api.call("paramWithQuery", {
      pathParams: { id: 456 },
      searchParams: { q: "test" },
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      "/users/456",
      expect.objectContaining({ params: { q: "test" } }),
    );
  });
});
