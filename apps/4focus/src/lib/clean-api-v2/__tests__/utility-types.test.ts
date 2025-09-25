/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { describe, it, expect, expectTypeOf } from "vitest";
import {
  init,
  type InferDto,
  type InferAllDto,
  type InferError,
  type InferPayload,
  type InferPathParams,
  type InferSearchParams,
  type InferExtra,
  type InferAllErrors,
  type InferAllPayloads,
  type InferAllPathParams,
  type InferAllSearchParams,
  type InferAllExtras,
} from "../index";
import * as z from "zod";
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

  describe("Individual Property Inference Types", () => {
    describe("InferError utility type", () => {
      it("should infer correct error type for specific endpoints", () => {
        type GetUsersError = InferError<typeof testAPI, "getUsers">;
        type GetTasksError = InferError<typeof testAPI, "getTasks">;
        type CreateUserError = InferError<typeof testAPI, "createUser">;
        type UploadFileError = InferError<typeof testAPI, "uploadFile">;

        // All endpoints have the same error schema in our test
        expectTypeOf<GetUsersError>().toEqualTypeOf<{
          type: "not_found" | "validation_error" | "server_error";
          status: number;
          message: string;
        }>();

        expectTypeOf<GetTasksError>().toEqualTypeOf<GetUsersError>();
        expectTypeOf<CreateUserError>().toEqualTypeOf<GetUsersError>();
        expectTypeOf<UploadFileError>().toEqualTypeOf<GetUsersError>();
      });
    });

    describe("InferPayload utility type", () => {
      it("should infer correct payload type for endpoints that have payloads", () => {
        type CreateUserPayload = InferPayload<typeof testAPI, "createUser">;
        type UploadFilePayload = InferPayload<typeof testAPI, "uploadFile">;

        expectTypeOf<CreateUserPayload>().toEqualTypeOf<{
          name: string;
          email: string;
        }>();

        expectTypeOf<UploadFilePayload>().toEqualTypeOf<{
          file: File;
        }>();
      });

      it("should return never for endpoints without payloads", () => {
        type GetUsersPayload = InferPayload<typeof testAPI, "getUsers">;
        type GetTasksPayload = InferPayload<typeof testAPI, "getTasks">;

        expectTypeOf<GetUsersPayload>().toEqualTypeOf<never>();
        expectTypeOf<GetTasksPayload>().toEqualTypeOf<never>();
      });
    });

    describe("InferPathParams utility type", () => {
      it("should infer correct pathParams type for endpoints that have them", () => {
        type GetTasksPathParams = InferPathParams<typeof testAPI, "getTasks">;

        expectTypeOf<GetTasksPathParams>().toEqualTypeOf<{
          userId: string;
        }>();
      });

      it("should return never for endpoints without pathParams", () => {
        type GetUsersPathParams = InferPathParams<typeof testAPI, "getUsers">;
        type CreateUserPathParams = InferPathParams<
          typeof testAPI,
          "createUser"
        >;
        type UploadFilePathParams = InferPathParams<
          typeof testAPI,
          "uploadFile"
        >;

        expectTypeOf<GetUsersPathParams>().toEqualTypeOf<never>();
        expectTypeOf<CreateUserPathParams>().toEqualTypeOf<never>();
        expectTypeOf<UploadFilePathParams>().toEqualTypeOf<never>();
      });
    });

    describe("InferSearchParams utility type", () => {
      it("should infer correct searchParams type for endpoints that have them", () => {
        type GetUsersSearchParams = InferSearchParams<
          typeof testAPI,
          "getUsers"
        >;

        expectTypeOf<GetUsersSearchParams>().toEqualTypeOf<{
          page: number;
          limit: number;
        }>();
      });

      it("should return never for endpoints without searchParams", () => {
        type GetTasksSearchParams = InferSearchParams<
          typeof testAPI,
          "getTasks"
        >;
        type CreateUserSearchParams = InferSearchParams<
          typeof testAPI,
          "createUser"
        >;
        type UploadFileSearchParams = InferSearchParams<
          typeof testAPI,
          "uploadFile"
        >;

        expectTypeOf<GetTasksSearchParams>().toEqualTypeOf<never>();
        expectTypeOf<CreateUserSearchParams>().toEqualTypeOf<never>();
        expectTypeOf<UploadFileSearchParams>().toEqualTypeOf<never>();
      });
    });

    describe("InferExtra utility type", () => {
      it("should infer correct extra type for endpoints that have them", () => {
        type UploadFileExtra = InferExtra<typeof testAPI, "uploadFile">;

        expectTypeOf<UploadFileExtra>().toEqualTypeOf<{
          uploadProgress: (progress: number) => void;
          signal: AbortSignal;
        }>();
      });

      it("should return never for endpoints without extra", () => {
        type GetUsersExtra = InferExtra<typeof testAPI, "getUsers">;
        type GetTasksExtra = InferExtra<typeof testAPI, "getTasks">;
        type CreateUserExtra = InferExtra<typeof testAPI, "createUser">;

        expectTypeOf<GetUsersExtra>().toEqualTypeOf<never>();
        expectTypeOf<GetTasksExtra>().toEqualTypeOf<never>();
        expectTypeOf<CreateUserExtra>().toEqualTypeOf<never>();
      });
    });
  });

  describe("All Property Inference Types", () => {
    describe("InferAllErrors utility type", () => {
      it("should infer all error types from the API as a single object type", () => {
        type AllErrors = InferAllErrors<typeof testAPI>;

        expectTypeOf<AllErrors>().toEqualTypeOf<{
          getUsers: {
            type: "not_found" | "validation_error" | "server_error";
            status: number;
            message: string;
          };
          getTasks: {
            type: "not_found" | "validation_error" | "server_error";
            status: number;
            message: string;
          };
          createUser: {
            type: "not_found" | "validation_error" | "server_error";
            status: number;
            message: string;
          };
          uploadFile: {
            type: "not_found" | "validation_error" | "server_error";
            status: number;
            message: string;
          };
        }>();
      });

      it("should provide type-safe access to individual endpoint errors", () => {
        type AllErrors = InferAllErrors<typeof testAPI>;

        expectTypeOf<AllErrors["getUsers"]>().toEqualTypeOf<
          InferError<typeof testAPI, "getUsers">
        >();
        expectTypeOf<AllErrors["getTasks"]>().toEqualTypeOf<
          InferError<typeof testAPI, "getTasks">
        >();
      });
    });

    describe("InferAllPayloads utility type", () => {
      it("should infer all payload types, with never for endpoints without payloads", () => {
        type AllPayloads = InferAllPayloads<typeof testAPI>;

        expectTypeOf<AllPayloads>().toEqualTypeOf<{
          getUsers: never;
          getTasks: never;
          createUser: { name: string; email: string };
          uploadFile: { file: File };
        }>();
      });

      it("should provide type-safe access to individual endpoint payloads", () => {
        type AllPayloads = InferAllPayloads<typeof testAPI>;

        expectTypeOf<AllPayloads["createUser"]>().toEqualTypeOf<
          InferPayload<typeof testAPI, "createUser">
        >();
        expectTypeOf<AllPayloads["uploadFile"]>().toEqualTypeOf<
          InferPayload<typeof testAPI, "uploadFile">
        >();
      });
    });

    describe("InferAllPathParams utility type", () => {
      it("should infer all pathParams types, with never for endpoints without pathParams", () => {
        type AllPathParams = InferAllPathParams<typeof testAPI>;

        expectTypeOf<AllPathParams>().toEqualTypeOf<{
          getUsers: never;
          getTasks: { userId: string };
          createUser: never;
          uploadFile: never;
        }>();
      });

      it("should provide type-safe access to individual endpoint pathParams", () => {
        type AllPathParams = InferAllPathParams<typeof testAPI>;

        expectTypeOf<AllPathParams["getTasks"]>().toEqualTypeOf<
          InferPathParams<typeof testAPI, "getTasks">
        >();
      });
    });

    describe("InferAllSearchParams utility type", () => {
      it("should infer all searchParams types, with never for endpoints without searchParams", () => {
        type AllSearchParams = InferAllSearchParams<typeof testAPI>;

        expectTypeOf<AllSearchParams>().toEqualTypeOf<{
          getUsers: { page: number; limit: number };
          getTasks: never;
          createUser: never;
          uploadFile: never;
        }>();
      });

      it("should provide type-safe access to individual endpoint searchParams", () => {
        type AllSearchParams = InferAllSearchParams<typeof testAPI>;

        expectTypeOf<AllSearchParams["getUsers"]>().toEqualTypeOf<
          InferSearchParams<typeof testAPI, "getUsers">
        >();
      });
    });

    describe("InferAllExtras utility type", () => {
      it("should infer all extra types, with never for endpoints without extra", () => {
        type AllExtras = InferAllExtras<typeof testAPI>;

        expectTypeOf<AllExtras>().toEqualTypeOf<{
          getUsers: never;
          getTasks: never;
          createUser: never;
          uploadFile: {
            uploadProgress: (progress: number) => void;
            signal: AbortSignal;
          };
        }>();
      });

      it("should provide type-safe access to individual endpoint extras", () => {
        type AllExtras = InferAllExtras<typeof testAPI>;

        expectTypeOf<AllExtras["uploadFile"]>().toEqualTypeOf<
          InferExtra<typeof testAPI, "uploadFile">
        >();
      });
    });
  });

  describe("Real-world usage examples for new types", () => {
    describe("Error handling with InferError", () => {
      it("should enable type-safe error handling", () => {
        type GetUsersError = InferError<typeof testAPI, "getUsers">;

        const handleError = (error: GetUsersError) => {
          switch (error.type) {
            case "not_found":
              return "Resource not found";
            case "validation_error":
              return "Invalid input";
            case "server_error":
              return "Server error occurred";
            default:
              // TypeScript ensures exhaustive checking
              // eslint-disable-next-line no-case-declarations
              const _exhaustive: never = error.type;
              return "Unknown error";
          }
        };

        const mockError: GetUsersError = {
          type: "not_found",
          status: 404,
          message: "User not found",
        };

        const result = handleError(mockError);
        expect(result).toBe("Resource not found");
      });
    });

    describe("Request building with InferPayload and InferPathParams", () => {
      it("should enable type-safe request building", () => {
        type CreateUserPayload = InferPayload<typeof testAPI, "createUser">;
        type GetTasksPathParams = InferPathParams<typeof testAPI, "getTasks">;

        const buildCreateUserRequest = (data: CreateUserPayload) => {
          return {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          };
        };

        const buildGetTasksRequest = (params: GetTasksPathParams) => {
          return {
            method: "GET",
            url: `/users/${params.userId}/tasks`,
          };
        };

        const createUserReq = buildCreateUserRequest({
          name: "John Doe",
          email: "john@example.com",
        });

        const getTasksReq = buildGetTasksRequest({
          userId: "123",
        });

        expect(createUserReq.method).toBe("POST");
        expect(getTasksReq.url).toBe("/users/123/tasks");
      });
    });

    describe("Combined usage with multiple inference types", () => {
      it("should work together for comprehensive API client building", () => {
        type AllErrors = InferAllErrors<typeof testAPI>;
        type AllPayloads = InferAllPayloads<typeof testAPI>;

        // Generic API response builder with error handling
        const buildApiResponse = <T>(
          data?: T,
          error?: AllErrors[keyof AllErrors],
        ) => {
          if (error) {
            return {
              success: false,
              error,
              data: null,
            } as const;
          }

          return {
            success: true,
            error: null,
            data,
          } as const;
        };

        // Generic request builder for payloads
        const buildRequestWithPayload = <K extends keyof AllPayloads>(
          endpoint: K,
          payload: AllPayloads[K],
        ) => {
          return {
            endpoint,
            payload,
            timestamp: new Date().toISOString(),
          };
        };

        // Test success response
        const successResponse = buildApiResponse({ id: 1, name: "Test" });
        expect(successResponse.success).toBe(true);
        expect(successResponse.data).toEqual({ id: 1, name: "Test" });

        // Test error response
        const errorResponse = buildApiResponse(undefined, {
          type: "validation_error",
          status: 400,
          message: "Invalid input",
        });
        expect(errorResponse.success).toBe(false);
        expect(errorResponse.error?.type).toBe("validation_error");

        // Test request building (only works for endpoints that have payloads)
        const createUserRequest = buildRequestWithPayload("createUser", {
          name: "Jane",
          email: "jane@example.com",
        });
        expect(createUserRequest.endpoint).toBe("createUser");
        expect(createUserRequest.payload.name).toBe("Jane");
      });
    });
  });

  describe("Edge cases and type safety", () => {
    it("should handle endpoints without optional properties correctly", () => {
      // Test that types correctly handle missing optional properties
      type GetUsersPayload = InferPayload<typeof testAPI, "getUsers">;
      type GetUsersPathParams = InferPathParams<typeof testAPI, "getUsers">;
      type GetUsersExtra = InferExtra<typeof testAPI, "getUsers">;

      // These should all be never since getUsers doesn't have these properties
      expectTypeOf<GetUsersPayload>().toEqualTypeOf<never>();
      expectTypeOf<GetUsersPathParams>().toEqualTypeOf<never>();
      expectTypeOf<GetUsersExtra>().toEqualTypeOf<never>();
    });

    it("should maintain type safety across all inference types", () => {
      // Test that all types are correctly inferred and maintain consistency
      type CreateUserDto = InferDto<typeof testAPI, "createUser">;
      type CreateUserError = InferError<typeof testAPI, "createUser">;
      type CreateUserPayload = InferPayload<typeof testAPI, "createUser">;

      // Runtime test to ensure types work correctly
      const mockCreateUser = (
        payload: CreateUserPayload,
      ): CreateUserDto | CreateUserError => {
        if (payload.email.includes("@")) {
          return {
            id: 1,
            name: payload.name,
            email: payload.email,
          };
        } else {
          return {
            type: "validation_error",
            status: 400,
            message: "Invalid email",
          };
        }
      };

      const validPayload: CreateUserPayload = {
        name: "Alice",
        email: "alice@example.com",
      };

      const invalidPayload: CreateUserPayload = {
        name: "Bob",
        email: "invalid-email",
      };

      const validResult = mockCreateUser(validPayload);
      const invalidResult = mockCreateUser(invalidPayload);

      // TypeScript should allow both return types
      expect("id" in validResult ? validResult.id : null).toBe(1);
      expect("type" in invalidResult ? invalidResult.type : null).toBe(
        "validation_error",
      );
    });
  });
});
