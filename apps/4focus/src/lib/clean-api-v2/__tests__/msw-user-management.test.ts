import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import * as z from "zod";
import axios from "axios";
import { init, check } from "../core";
import { errorParser } from "../adapters/axios";
import { serverFixture } from "./msw/msw-fixture";

// User schemas for validation
const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().url(),
  role: z.enum(["admin", "user"]),
  createdAt: z.string(),
});

const CreateUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email format"),
  role: z.enum(["admin", "user"]).optional(),
});

const UsersListSchema = z.object({
  users: z.array(UserSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

// API Contract definition
type UserApiContracts = {
  getUsers: {
    dto: z.infer<typeof UsersListSchema>;
    error:
      | { type: "unauthorized"; status: 401; message: string }
      | { type: "server_error"; status: 500; message: string };
    searchParams: {
      page?: number;
      limit?: number;
      search?: string;
    };
  };
  getUser: {
    dto: { user: z.infer<typeof UserSchema> };
    error:
      | { type: "not_found"; status: 404; message: string }
      | { type: "unauthorized"; status: 401; message: string };
    pathParams: {
      id: string;
    };
  };
  createUser: {
    dto: { user: z.infer<typeof UserSchema> };
    error:
      | {
          type: "validation_error";
          status: 400;
          message: string;
          meta: {
            issues: Array<{ path: (string | number)[]; message: string }>;
          };
        }
      | { type: "conflict"; status: 409; message: string };
    payload: z.infer<typeof CreateUserSchema>;
  };
  updateUser: {
    dto: { user: z.infer<typeof UserSchema> };
    error:
      | { type: "not_found"; status: 404; message: string }
      | { type: "validation_error"; status: 400; message: string };
    pathParams: {
      id: string;
    };
    payload: Partial<z.infer<typeof UserSchema>>;
  };
  deleteUser: {
    dto: { success: boolean };
    error: { type: "not_found"; status: 404; message: string };
    pathParams: {
      id: string;
    };
  };
};

// API Configuration
type ApiConfig = {
  baseURL: string;
  timeout: number;
};

const baseConfig: ApiConfig = {
  baseURL: "https://api.example.com",
  timeout: 5000,
};

// API implementation using clean-api-v2
const userApi = init<ApiConfig>(baseConfig)<UserApiContracts>()({
  getUsers: {
    resolver: async ({ searchParams, config }) => {
      const params = new URLSearchParams();
      if (searchParams?.page)
        params.append("page", searchParams.page.toString());
      if (searchParams?.limit)
        params.append("limit", searchParams.limit.toString());
      if (searchParams?.search) params.append("search", searchParams.search);

      const response = await axios.get(`${config.baseURL}/users?${params}`, {
        timeout: config.timeout,
      });
      return response.data;
    },
    schemas: {
      dto: check(
        (data: unknown) => UsersListSchema.parse(data),
        UsersListSchema,
      ),
      searchParams: check((data: unknown) => {
        const schema = z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          search: z.string().optional(),
        });
        return schema.parse(data);
      }),
    },
  },
  getUser: {
    resolver: async ({ pathParams, config }) => {
      const response = await axios.get(
        `${config.baseURL}/users/${pathParams.id}`,
        {
          timeout: config.timeout,
        },
      );
      return response.data;
    },
    schemas: {
      dto: check((data: unknown) => {
        const schema = z.object({ user: UserSchema });
        return schema.parse(data);
      }),
      pathParams: check((data: unknown) => {
        const schema = z.object({ id: z.string() });
        return schema.parse(data);
      }),
    },
  },
  createUser: {
    resolver: async ({ payload, config }) => {
      const response = await axios.post(`${config.baseURL}/users`, payload, {
        timeout: config.timeout,
      });
      return response.data;
    },
    schemas: {
      dto: check((data: unknown) => {
        const schema = z.object({ user: UserSchema });
        return schema.parse(data);
      }),
      payload: check(
        (data: unknown) => CreateUserSchema.parse(data),
        CreateUserSchema,
      ),
    },
  },
  updateUser: {
    resolver: async ({ pathParams, payload, config }) => {
      const response = await axios.put(
        `${config.baseURL}/users/${pathParams.id}`,
        payload,
        {
          timeout: config.timeout,
        },
      );
      return response.data;
    },
    schemas: {
      pathParams: check((data: unknown) => {
        const schema = z.object({ id: z.string() });
        return schema.parse(data);
      }),
      payload: check((data: unknown) => {
        const schema = UserSchema.partial();
        return schema.parse(data);
      }),
    },
  },
  deleteUser: {
    resolver: async ({ pathParams, config }) => {
      const response = await axios.delete(
        `${config.baseURL}/users/${pathParams.id}`,
        {
          timeout: config.timeout,
        },
      );
      return response.data;
    },
    schemas: {
      pathParams: check((data: unknown) => {
        const schema = z.object({ id: z.string() });
        return schema.parse(data);
      }),
    },
  },
});

const parseError = errorParser(userApi);

// Helper function to create mock users data for each test
const createMockUsers = () => [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    avatar: "https://example.com/avatar1.jpg",
    role: "admin" as const,
    createdAt: "2023-01-01T00:00:00Z",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    avatar: "https://example.com/avatar2.jpg",
    role: "user" as const,
    createdAt: "2023-01-02T00:00:00Z",
  },
  {
    id: "3",
    name: "Bob Wilson",
    email: "bob@example.com",
    avatar: "https://example.com/avatar3.jpg",
    role: "user" as const,
    createdAt: "2023-01-03T00:00:00Z",
  },
];

// Helper functions for creating mock responses
const createUserListResponse = (
  users: typeof createMockUsers extends () => infer T ? T : never,
  page = 1,
  limit = 10,
  search?: string,
) => {
  let filteredUsers = users;

  if (search) {
    filteredUsers = users.filter(
      (user) =>
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()),
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredUsers.length / limit);

  return {
    users: paginatedUsers,
    pagination: {
      page,
      limit,
      total: filteredUsers.length,
      totalPages,
    },
  };
};

const createErrorResponse = (
  type: string,
  status: number,
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any,
) => {
  return new Response(
    JSON.stringify({
      type,
      status,
      message,
      ...(meta ? { meta } : {}),
    }),
    {
      status,
      headers: { "Content-Type": "application/json" },
    },
  );
};

describe("User Management API with MSW", () => {
  const mock = serverFixture({ beforeAll, afterEach, afterAll });
  describe("getUsers", () => {
    it("should fetch users with default pagination", async () => {
      const mockUsers = createMockUsers();

      mock("get", "https://api.example.com/users", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search");

        return Response.json(
          createUserListResponse(mockUsers, page, limit, search || undefined),
        );
      });

      const result = await userApi.call("getUsers", { searchParams: {} });

      expect(result).toMatchObject({
        users: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            name: expect.any(String),
            email: expect.any(String),
            role: expect.stringMatching(/^(admin|user)$/),
          }),
        ]),
        pagination: expect.objectContaining({
          page: 1,
          limit: 10,
          total: 3, // We know we have 3 mock users
          totalPages: 1,
        }),
      });
    });

    it("should handle pagination parameters", async () => {
      const mockUsers = createMockUsers();

      mock("get", "https://api.example.com/users", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search");

        return Response.json(
          createUserListResponse(mockUsers, page, limit, search || undefined),
        );
      });

      const searchParams = userApi.searchParams("getUsers", {
        page: 2,
        limit: 5,
      });
      const result = await userApi.call("getUsers", { searchParams });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
    });

    it("should handle search parameter", async () => {
      // Create specific mock data with only one "John" for this test
      const mockUsers = [
        {
          id: "1",
          name: "John Doe",
          email: "john@example.com",
          avatar: "https://example.com/avatar1.jpg",
          role: "admin" as const,
          createdAt: "2023-01-01T00:00:00Z",
        },
        {
          id: "2",
          name: "Jane Smith",
          email: "jane@example.com",
          avatar: "https://example.com/avatar2.jpg",
          role: "user" as const,
          createdAt: "2023-01-02T00:00:00Z",
        },
      ];

      mock("get", "https://api.example.com/users", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search");

        return Response.json(
          createUserListResponse(mockUsers, page, limit, search || undefined),
        );
      });

      const searchParams = userApi.searchParams("getUsers", { search: "john" });
      const result = await userApi.call("getUsers", { searchParams });

      // MSW should return filtered results
      expect(result.users).toHaveLength(1);
      expect(result.users[0].name.toLowerCase()).toContain("john");
    });

    it("should validate search params schema", () => {
      expect(() => {
        // @ts-expect-error - invalid search params
        userApi.searchParams("getUsers", { page: "invalid" });
      }).toThrow();
    });

    it("should validate response dto schema", async () => {
      const mockUsers = createMockUsers();

      mock("get", "https://api.example.com/users", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search");

        return Response.json(
          createUserListResponse(mockUsers, page, limit, search || undefined),
        );
      });

      const result = await userApi.call("getUsers", { searchParams: {} });

      // The response should be validated by the dto schema
      expect(result.users).toBeInstanceOf(Array);
      result.users.forEach((user) => {
        expect(user).toMatchObject({
          id: expect.any(String),
          name: expect.any(String),
          email: expect.stringMatching(/^[^\s@]+@[^\s@]+\.[^\s@]+$/),
          avatar: expect.stringMatching(/^https?:\/\/.+/),
          role: expect.stringMatching(/^(admin|user)$/),
          createdAt: expect.any(String),
        });
      });
    });
  });

  describe("getUser", () => {
    it("should fetch a specific user", async () => {
      const mockUser = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        avatar: "https://example.com/avatar1.jpg",
        role: "admin" as const,
        createdAt: "2023-01-01T00:00:00Z",
      };

      mock("get", "https://api.example.com/users/:id", ({ params }) => {
        if (params.id === "1") {
          return Response.json({ user: mockUser });
        }
        return createErrorResponse("not_found", 404, "User not found");
      });

      const pathParams = userApi.pathParams("getUser", { id: "1" });
      const result = await userApi.call("getUser", { pathParams });

      expect(result.user).toMatchObject({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        role: "admin",
      });
    });

    it("should handle user not found error", async () => {
      mock("get", "https://api.example.com/users/:id", () => {
        return createErrorResponse("not_found", 404, "User not found");
      });

      const pathParams = userApi.pathParams("getUser", { id: "999" });
      const [success, error] = await userApi.safeCall("getUser", {
        pathParams,
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("getUser", error);
        expect(parsedError.type).toBe("not_found");
        expect(parsedError.status).toBe(404);
        expect(parsedError.message).toBe("User not found");
      }
    });

    it("should validate path params", () => {
      expect(() => {
        // @ts-expect-error - invalid path params
        userApi.pathParams("getUser", { id: 123 });
      }).toThrow();
    });
  });

  describe("createUser", () => {
    it("should create a new user successfully", async () => {
      mock("post", "https://api.example.com/users", async ({ request }) => {
        const body = (await request.json()) as {
          name?: string;
          email?: string;
          role?: "admin" | "user";
        };

        const newUser = {
          id: "123",
          name: body.name!,
          email: body.email!,
          avatar: "https://example.com/avatar123.jpg",
          role: body.role || ("user" as const),
          createdAt: new Date().toISOString(),
        };

        return Response.json({ user: newUser });
      });

      const payload = userApi.payload("createUser", {
        name: "Test User",
        email: "test@example.com",
        role: "user",
      });

      const result = await userApi.call("createUser", { payload });

      expect(result.user).toMatchObject({
        id: expect.any(String),
        name: "Test User",
        email: "test@example.com",
        role: "user",
        createdAt: expect.any(String),
      });
    });

    it("should handle validation errors", async () => {
      // Test client-side validation
      try {
        // @ts-expect-error - invalid payload
        userApi.payload("createUser", {});
        expect.fail("Should have thrown validation error");
      } catch (error) {
        // Client-side validation should catch this
        expect(error).toBeDefined();
      }

      // Test server-side validation with mock that returns validation error
      mock("post", "https://api.example.com/users", async ({ request }) => {
        const body = (await request.json()) as {
          name?: string;
          email?: string;
          role?: "admin" | "user";
        };

        // Server validation: check for required fields
        if (!body?.name || !body?.email) {
          return createErrorResponse(
            "validation_error",
            400,
            "Name and email are required",
            {
              issues: [
                ...(body?.name
                  ? []
                  : [{ path: ["name"], message: "Name is required" }]),
                ...(body?.email
                  ? []
                  : [{ path: ["email"], message: "Email is required" }]),
              ],
            },
          );
        }

        return Response.json({ user: { id: "1", ...body } });
      });

      // Test server-side validation by making direct axios call
      try {
        await axios.post(
          `${baseConfig.baseURL}/users`,
          {},
          {
            timeout: baseConfig.timeout,
          },
        );
        expect.fail("Should have thrown validation error");
      } catch (error) {
        const parsedError = parseError("createUser", error);
        expect(parsedError.type).toBe("validation_error");
        expect(parsedError.status).toBe(400);
        expect(parsedError.message).toContain("required");

        if (
          "meta" in parsedError &&
          parsedError.meta &&
          "issues" in parsedError.meta
        ) {
          expect(parsedError.meta.issues).toBeInstanceOf(Array);
          expect(parsedError.meta.issues.length).toBeGreaterThan(0);
        }
      }
    });

    it("should handle email conflict", async () => {
      mock("post", "https://api.example.com/users", async ({ request }) => {
        const body = (await request.json()) as {
          name?: string;
          email?: string;
          role?: "admin" | "user";
        };

        // Check for email conflict
        if (body.email === "john@example.com") {
          return createErrorResponse("conflict", 409, "Email already exists");
        }

        return Response.json({ user: { id: "1", ...body } });
      });

      const payload = userApi.payload("createUser", {
        name: "Duplicate User",
        email: "john@example.com", // Email already exists
      });

      const [success, error] = await userApi.safeCall("createUser", {
        payload,
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("createUser", error);
        expect(parsedError.type).toBe("conflict");
        expect(parsedError.status).toBe(409);
        expect(parsedError.message).toContain("already exists");
      }
    });

    it("should validate payload schema", () => {
      expect(() => {
        userApi.payload("createUser", {
          name: "", // Invalid: empty name
          email: "invalid-email", // Invalid: bad email format
        });
      }).toThrow();
    });
  });

  describe("updateUser", () => {
    it("should update user successfully", async () => {
      const existingUser = {
        id: "1",
        name: "Original Name",
        email: "original@example.com",
        avatar: "https://example.com/avatar1.jpg",
        role: "user" as const,
        createdAt: "2023-01-01T00:00:00Z",
      };

      mock(
        "put",
        "https://api.example.com/users/:id",
        async ({ params, request }) => {
          if (params.id === "1") {
            const body = (await request.json()) as Partial<typeof existingUser>;
            const updatedUser = { ...existingUser, ...body };
            return Response.json({ user: updatedUser });
          }
          return createErrorResponse("not_found", 404, "User not found");
        },
      );

      const pathParams = userApi.pathParams("updateUser", { id: "1" });
      const payload = userApi.payload("updateUser", { name: "Updated Name" });

      const result = await userApi.call("updateUser", { pathParams, payload });

      expect(result.user.name).toBe("Updated Name");
      expect(result.user.id).toBe("1");
    });

    it("should handle user not found", async () => {
      mock("put", "https://api.example.com/users/:id", async () => {
        return createErrorResponse("not_found", 404, "User not found");
      });

      const pathParams = userApi.pathParams("updateUser", { id: "999" });
      const payload = userApi.payload("updateUser", { name: "Updated Name" });

      const [success, error] = await userApi.safeCall("updateUser", {
        pathParams,
        payload,
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("updateUser", error);
        expect(parsedError.type).toBe("not_found");
        expect(parsedError.status).toBe(404);
      }
    });
  });

  describe("deleteUser", () => {
    it("should delete user successfully", async () => {
      mock("delete", "https://api.example.com/users/:id", ({ params }) => {
        if (params.id === "2") {
          return Response.json({ success: true });
        }
        return createErrorResponse("not_found", 404, "User not found");
      });

      const pathParams = userApi.pathParams("deleteUser", { id: "2" });
      const result = await userApi.call("deleteUser", { pathParams });

      expect(result.success).toBe(true);
    });

    it("should handle user not found", async () => {
      mock("delete", "https://api.example.com/users/:id", () => {
        return createErrorResponse("not_found", 404, "User not found");
      });

      const pathParams = userApi.pathParams("deleteUser", { id: "999" });
      const [success, error] = await userApi.safeCall("deleteUser", {
        pathParams,
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("deleteUser", error);
        expect(parsedError.type).toBe("not_found");
        expect(parsedError.status).toBe(404);
      }
    });
  });

  describe("Real-world workflow scenarios", () => {
    it("should handle complete CRUD workflow", async () => {
      // Create a mock "database" for this test
      const mockUsers = createMockUsers();
      let userIdCounter = 4;

      // Mock all endpoints for the workflow
      mock("get", "https://api.example.com/users", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search");

        return Response.json(
          createUserListResponse(mockUsers, page, limit, search || undefined),
        );
      });

      mock("post", "https://api.example.com/users", async ({ request }) => {
        const body = (await request.json()) as {
          name: string;
          email: string;
          role?: "admin" | "user";
        };

        const newUser = {
          id: userIdCounter.toString(),
          name: body.name,
          email: body.email,
          avatar: `https://example.com/avatar${userIdCounter}.jpg`,
          role: body.role || ("user" as const),
          createdAt: new Date().toISOString(),
        };

        mockUsers.push(newUser);
        userIdCounter++;

        return Response.json({ user: newUser });
      });

      mock("get", "https://api.example.com/users/:id", ({ params }) => {
        const user = mockUsers.find((u) => u.id === params.id);
        if (!user) {
          return createErrorResponse("not_found", 404, "User not found");
        }
        return Response.json({ user });
      });

      mock(
        "put",
        "https://api.example.com/users/:id",
        async ({ params, request }) => {
          const userIndex = mockUsers.findIndex((u) => u.id === params.id);
          if (userIndex === -1) {
            return createErrorResponse("not_found", 404, "User not found");
          }

          const body = (await request.json()) as Partial<{
            name: string;
            email: string;
            role: "admin" | "user";
          }>;

          const updatedUser = { ...mockUsers[userIndex], ...body };
          mockUsers[userIndex] = updatedUser;

          return Response.json({ user: updatedUser });
        },
      );

      mock("delete", "https://api.example.com/users/:id", ({ params }) => {
        const userIndex = mockUsers.findIndex((u) => u.id === params.id);
        if (userIndex === -1) {
          return createErrorResponse("not_found", 404, "User not found");
        }

        mockUsers.splice(userIndex, 1);
        return Response.json({ success: true });
      });

      // Get initial count
      const initialListResult = await userApi.call("getUsers", {
        searchParams: {},
      });
      const initialCount = initialListResult.users.length;

      // 1. Create a user
      const createPayload = userApi.payload("createUser", {
        name: "Workflow User",
        email: "workflow@example.com",
        role: "user",
      });

      const createResult = await userApi.call("createUser", {
        payload: createPayload,
      });
      const userId = createResult.user.id;
      expect(createResult.user.email).toBe("workflow@example.com");

      // 2. Fetch the created user
      const getPathParams = userApi.pathParams("getUser", { id: userId });
      const getResult = await userApi.call("getUser", {
        pathParams: getPathParams,
      });
      expect(getResult.user.email).toBe("workflow@example.com");

      // 3. Update the user
      const updatePathParams = userApi.pathParams("updateUser", { id: userId });
      const updatePayload = userApi.payload("updateUser", {
        name: "Updated Workflow User",
      });
      const updateResult = await userApi.call("updateUser", {
        pathParams: updatePathParams,
        payload: updatePayload,
      });
      expect(updateResult.user.name).toBe("Updated Workflow User");

      // 4. Verify user appears in list and count increased
      const listResult = await userApi.call("getUsers", { searchParams: {} });
      const foundUser = listResult.users.find((u) => u.id === userId);
      expect(foundUser).toBeTruthy();
      expect(foundUser?.name).toBe("Updated Workflow User");
      expect(listResult.users.length).toBe(initialCount + 1);

      // 5. Delete the user
      const deletePathParams = userApi.pathParams("deleteUser", { id: userId });
      const deleteResult = await userApi.call("deleteUser", {
        pathParams: deletePathParams,
      });
      expect(deleteResult.success).toBe(true);

      // 6. Verify user is deleted
      const [getUserSuccess] = await userApi.safeCall("getUser", {
        pathParams: getPathParams,
      });
      expect(getUserSuccess).toBe(false);
    });

    it("should handle concurrent operations", async () => {
      const mockUsers = createMockUsers();

      // Mock all endpoints needed for concurrent operations
      mock("get", "https://api.example.com/users", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search");

        return Response.json(
          createUserListResponse(mockUsers, page, limit, search || undefined),
        );
      });

      mock("get", "https://api.example.com/users/:id", ({ params }) => {
        const user = mockUsers.find((u) => u.id === params.id);
        if (!user) {
          return createErrorResponse("not_found", 404, "User not found");
        }
        return Response.json({ user });
      });

      // Test multiple API calls happening concurrently
      const promises = [
        userApi.call("getUsers", { searchParams: {} }),
        userApi.call("getUser", {
          pathParams: userApi.pathParams("getUser", { id: "1" }),
        }),
        userApi.call("getUser", {
          pathParams: userApi.pathParams("getUser", { id: "2" }),
        }),
      ] as const;

      const results = await Promise.all(promises);

      expect(results[0]).toHaveProperty("users");
      expect(results[1]).toHaveProperty("user");
      expect(results[2]).toHaveProperty("user");
      expect(results[1].user.id).toBe("1");
      expect(results[2].user.id).toBe("2");
    });
  });

  describe("API call tracking with onCall", () => {
    it("should track API calls using onCall", async () => {
      const mockUsers = createMockUsers();

      mock("get", "https://api.example.com/users", ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get("page") || "1");
        const limit = parseInt(url.searchParams.get("limit") || "10");
        const search = url.searchParams.get("search");

        return Response.json(
          createUserListResponse(mockUsers, page, limit, search || undefined),
        );
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const callTracker: Array<{ endpoint: string; params: any }> = [];

      // Set up call tracking
      const unsubscribe = userApi.onCall("getUsers", (params) => {
        callTracker.push({ endpoint: "getUsers", params });
      });

      // Make some API calls
      await userApi.call("getUsers", { searchParams: {} });
      await userApi.call("getUsers", {
        searchParams: userApi.searchParams("getUsers", { page: 2 }),
      });

      expect(callTracker).toHaveLength(2);
      expect(callTracker[0].endpoint).toBe("getUsers");
      expect(callTracker[1].params.searchParams).toMatchObject({ page: 2 });

      // Clean up
      unsubscribe();
    });
  });
});
