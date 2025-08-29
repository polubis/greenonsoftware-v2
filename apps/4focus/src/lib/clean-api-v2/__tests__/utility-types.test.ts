/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, expectTypeOf } from "vitest";
import { init, type InferDto, type InferAllDto } from "../index";
import { z } from "zod";
import { zodCheck } from "../adapters/zod";

describe("Utility Types for API Inference", () => {
  // Example API setup
  const userSchema = z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
  });

  const taskSchema = z.object({
    id: z.number(),
    title: z.string(),
    completed: z.boolean(),
    userId: z.number(),
  });

  const errorSchema = z.object({
    type: z.enum(["not_found", "validation_error", "server_error"]),
    status: z.number(),
    message: z.string(),
  });

  type TestContracts = {
    getUsers: {
      dto: z.infer<typeof userSchema>;
      error: z.infer<typeof errorSchema>;
      searchParams: { page: number; limit: number };
    };
    getTasks: {
      dto: z.infer<typeof taskSchema>;
      error: z.infer<typeof errorSchema>;
      pathParams: { userId: string };
    };
    createUser: {
      dto: z.infer<typeof userSchema>;
      error: z.infer<typeof errorSchema>;
      payload: { name: string; email: string };
    };
    uploadFile: {
      dto: { fileId: string; url: string };
      error: z.infer<typeof errorSchema>;
      payload: { file: File };
      extra: {
        uploadProgress: (progress: number) => void;
        signal: AbortSignal;
      };
    };
  };

  const testAPI = init()<TestContracts>()({
    getUsers: {
      resolver: async () => ({
        id: 1,
        name: "Test",
        email: "test@example.com",
      }),
      schemas: {
        dto: zodCheck(userSchema),
        error: zodCheck(errorSchema),
      },
    },
    getTasks: {
      resolver: async () => ({
        id: 1,
        title: "Test Task",
        completed: false,
        userId: 1,
      }),
      schemas: {
        dto: zodCheck(taskSchema),
        error: zodCheck(errorSchema),
      },
    },
    createUser: {
      resolver: async () => ({
        id: 1,
        name: "Test",
        email: "test@example.com",
      }),
      schemas: {
        dto: zodCheck(userSchema),
        error: zodCheck(errorSchema),
      },
    },
    uploadFile: {
      resolver: async () => ({
        fileId: "file123",
        url: "https://example.com/file123",
      }),
      schemas: {
        dto: zodCheck(
          z.object({
            fileId: z.string(),
            url: z.string().url(),
          }),
        ),
        error: zodCheck(errorSchema),
      },
    },
  });

  describe("InferDto utility type", () => {
    it("should infer correct DTO type for specific endpoints", () => {
      type GetUsersDto = InferDto<typeof testAPI, "getUsers">;
      type GetTasksDto = InferDto<typeof testAPI, "getTasks">;
      type CreateUserDto = InferDto<typeof testAPI, "createUser">;
      type UploadFileDto = InferDto<typeof testAPI, "uploadFile">;

      // Type assertions to verify correct inference
      expectTypeOf<GetUsersDto>().toEqualTypeOf<{
        id: number;
        name: string;
        email: string;
      }>();

      expectTypeOf<GetTasksDto>().toEqualTypeOf<{
        id: number;
        title: string;
        completed: boolean;
        userId: number;
      }>();

      expectTypeOf<CreateUserDto>().toEqualTypeOf<{
        id: number;
        name: string;
        email: string;
      }>();

      expectTypeOf<UploadFileDto>().toEqualTypeOf<{
        fileId: string;
        url: string;
      }>();
    });

    it("should work at runtime with proper type safety", async () => {
      // These types are automatically inferred from the API
      type UserDto = InferDto<typeof testAPI, "getUsers">;
      type TaskDto = InferDto<typeof testAPI, "getTasks">;

      // Example of how to use in real code
      const createTypedUser = (rawData: any): UserDto => {
        return {
          id: rawData.id,
          name: rawData.name,
          email: rawData.email,
        };
      };

      const createTypedTask = (rawData: any): TaskDto => {
        return {
          id: rawData.id,
          title: rawData.title,
          completed: rawData.completed,
          userId: rawData.userId,
        };
      };

      const user = createTypedUser({
        id: 1,
        name: "Alice",
        email: "alice@example.com",
      });
      const task = createTypedTask({
        id: 1,
        title: "Test",
        completed: true,
        userId: 1,
      });

      expect(user.id).toBe(1);
      expect(user.name).toBe("Alice");
      expect(task.title).toBe("Test");
      expect(task.completed).toBe(true);
    });
  });

  describe("InferAllDto utility type", () => {
    it("should infer all DTO types from the API as a single object type", () => {
      type AllDtos = InferAllDto<typeof testAPI>;

      // Type assertions to verify the structure matches our contracts
      expectTypeOf<AllDtos>().toEqualTypeOf<{
        getUsers: {
          id: number;
          name: string;
          email: string;
        };
        getTasks: {
          id: number;
          title: string;
          completed: boolean;
          userId: number;
        };
        createUser: {
          id: number;
          name: string;
          email: string;
        };
        uploadFile: {
          fileId: string;
          url: string;
        };
      }>();
    });

    it("should provide type-safe access to individual endpoint DTOs", () => {
      type AllDtos = InferAllDto<typeof testAPI>;

      // Verify individual endpoints match the InferDto results
      expectTypeOf<AllDtos["getUsers"]>().toEqualTypeOf<
        InferDto<typeof testAPI, "getUsers">
      >();
      expectTypeOf<AllDtos["getTasks"]>().toEqualTypeOf<
        InferDto<typeof testAPI, "getTasks">
      >();
      expectTypeOf<AllDtos["createUser"]>().toEqualTypeOf<
        InferDto<typeof testAPI, "createUser">
      >();
      expectTypeOf<AllDtos["uploadFile"]>().toEqualTypeOf<
        InferDto<typeof testAPI, "uploadFile">
      >();
    });

    it("should enable creation of typed DTO mapping functions", () => {
      type AllDtos = InferAllDto<typeof testAPI>;

      // Example: Generic DTO mapper that works with all endpoints
      const createDtoMapper = <K extends keyof AllDtos>(
        endpoint: K,
        mapper: (raw: any) => AllDtos[K],
      ) => {
        return {
          endpoint,
          map: mapper,
        };
      };

      // Create type-safe mappers for each endpoint
      const userMapper = createDtoMapper("getUsers", (raw: any) => ({
        id: raw.id,
        name: raw.name,
        email: raw.email,
      }));

      const taskMapper = createDtoMapper("getTasks", (raw: any) => ({
        id: raw.id,
        title: raw.title,
        completed: raw.completed,
        userId: raw.user_id, // Note: field mapping
      }));

      // Test the mappers work correctly
      const rawUser = { id: 1, name: "John", email: "john@example.com" };
      const rawTask = {
        id: 1,
        title: "Test Task",
        completed: true,
        user_id: 123,
      };

      const mappedUser = userMapper.map(rawUser);
      const mappedTask = taskMapper.map(rawTask);

      expect(mappedUser).toEqual({
        id: 1,
        name: "John",
        email: "john@example.com",
      });
      expect(mappedTask).toEqual({
        id: 1,
        title: "Test Task",
        completed: true,
        userId: 123,
      });

      // TypeScript should ensure these are properly typed
      expectTypeOf(mappedUser).toEqualTypeOf<AllDtos["getUsers"]>();
      expectTypeOf(mappedTask).toEqualTypeOf<AllDtos["getTasks"]>();
    });

    it("should support bulk operations across all endpoint DTOs", () => {
      type AllDtos = InferAllDto<typeof testAPI>;

      // Example: Validation service that works with all DTOs
      const validateAllDtos = (data: {
        [K in keyof AllDtos]?: AllDtos[K][];
      }) => {
        const results: { [K in keyof AllDtos]?: boolean } = {};

        for (const [endpoint, dtos] of Object.entries(data)) {
          results[endpoint as keyof AllDtos] =
            Array.isArray(dtos) && dtos.length > 0;
        }

        return results;
      };

      const testData: {
        getUsers: AllDtos["getUsers"][];
        getTasks: AllDtos["getTasks"][];
      } = {
        getUsers: [
          { id: 1, name: "Alice", email: "alice@example.com" },
          { id: 2, name: "Bob", email: "bob@example.com" },
        ],
        getTasks: [
          { id: 1, title: "Task 1", completed: false, userId: 1 },
          { id: 2, title: "Task 2", completed: true, userId: 2 },
        ],
      };

      const validationResults = validateAllDtos(testData);

      expect(validationResults.getUsers).toBe(true);
      expect(validationResults.getTasks).toBe(true);
    });

    it("should work with utility functions for DTO transformation", () => {
      type AllDtos = InferAllDto<typeof testAPI>;

      // Helper to extract all DTOs that have an 'id' field
      type DtosWithId = {
        [K in keyof AllDtos]: AllDtos[K] extends { id: any }
          ? AllDtos[K]
          : never;
      }[keyof AllDtos];

      // This should include only user and task DTOs that have an 'id' field
      expectTypeOf<DtosWithId>().toEqualTypeOf<
        | { id: number; name: string; email: string }
        | { id: number; title: string; completed: boolean; userId: number }
      >();

      // Helper function that works with any DTO that has an id
      const extractIds = (dtos: DtosWithId[]): number[] => {
        return dtos.map((dto) => dto.id);
      };

      const dtosWithIds: DtosWithId[] = [
        { id: 1, name: "Alice", email: "alice@example.com" },
        { id: 2, title: "Task", completed: true, userId: 1 },
      ];

      const ids = extractIds(dtosWithIds);
      expect(ids).toEqual([1, 2]);

      // Demonstrate type safety - this would cause TypeScript error:
      // const fileDto: DtosWithId = { fileId: "file123", url: "https://example.com" }; // Error!
    });

    it("should enable type-safe response builders for all endpoints", () => {
      type AllDtos = InferAllDto<typeof testAPI>;

      // Generic response builder that works with any endpoint
      const buildApiResponse = <K extends keyof AllDtos>(
        endpoint: K,
        data: AllDtos[K] | AllDtos[K][],
        success: boolean = true,
      ) => {
        return {
          endpoint,
          success,
          data,
          timestamp: new Date().toISOString(),
        };
      };

      // Test with different endpoint types
      const userResponse = buildApiResponse("getUsers", {
        id: 1,
        name: "Alice",
        email: "alice@example.com",
      });

      const tasksResponse = buildApiResponse("getTasks", [
        { id: 1, title: "Task 1", completed: false, userId: 1 },
        { id: 2, title: "Task 2", completed: true, userId: 1 },
      ]);

      expect(userResponse.endpoint).toBe("getUsers");
      expect(userResponse.success).toBe(true);
      expect(userResponse.data).toEqual({
        id: 1,
        name: "Alice",
        email: "alice@example.com",
      });

      expect(tasksResponse.endpoint).toBe("getTasks");
      expect(Array.isArray(tasksResponse.data)).toBe(true);
      expect((tasksResponse.data as any[]).length).toBe(2);
    });
  });

  describe("Real-world usage example", () => {
    it("demonstrates how to eliminate boilerplate in data mapping", () => {
      // Before: Manual type casting with lots of boilerplate
      const mapTaskDataOldWay = (rawTask: any) => {
        return {
          id: rawTask.id as number,
          title: rawTask.title as string,
          completed: rawTask.completed as boolean,
          userId: rawTask.user_id as number, // Note: different field name
        };
      };

      // After: Using inferred types with single source of truth
      type TaskDto = InferDto<typeof testAPI, "getTasks">;

      const mapTaskDataNewWay = (rawTask: any): TaskDto => {
        return {
          id: rawTask.id,
          title: rawTask.title,
          completed: rawTask.completed,
          userId: rawTask.user_id, // TypeScript will catch type mismatches
        };
      };

      // Both approaches work the same at runtime
      const rawTask = {
        id: 1,
        title: "Test Task",
        completed: false,
        user_id: 123,
      };

      const oldResult = mapTaskDataOldWay(rawTask);
      const newResult = mapTaskDataNewWay(rawTask);

      expect(oldResult).toEqual(newResult);
      expect(newResult.id).toBe(1);
      expect(newResult.title).toBe("Test Task");
      expect(newResult.userId).toBe(123);

      // But with the new way, TypeScript enforces type safety automatically
      expectTypeOf(newResult).toEqualTypeOf<TaskDto>();
    });

    it("shows how to use types for response building", () => {
      type GetTasksDto = InferDto<typeof testAPI, "getTasks">;

      // Helper function with proper typing
      const buildSuccessResponse = (
        tasks: GetTasksDto[],
      ): { success: true; data: GetTasksDto[] } => {
        return { success: true, data: tasks };
      };

      const tasks: GetTasksDto[] = [
        { id: 1, title: "Task 1", completed: false, userId: 1 },
        { id: 2, title: "Task 2", completed: true, userId: 1 },
      ];

      const successResponse = buildSuccessResponse(tasks);
      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toHaveLength(2);
    });
  });
});
