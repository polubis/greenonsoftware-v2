import { describe, it, expect, beforeEach } from "vitest";
import \* as z from "zod";
import axios from "axios";
import { init, check } from "../core";
import { errorParser } from "../adapters/axios";
import { server } from "./msw/server";
import { http, HttpResponse, delay } from "msw";

// File operation schemas
const FileSchema = z.object({
id: z.string(),
name: z.string(),
size: z.number(),
mimeType: z.string(),
url: z.string().url(),
uploadedAt: z.string(),
});

const FileUploadProgressSchema = z.object({
loaded: z.number(),
total: z.number(),
percentage: z.number(),
});

const FileListSchema = z.object({
files: z.array(FileSchema),
pagination: z.object({
page: z.number(),
limit: z.number(),
total: z.number(),
totalPages: z.number(),
}),
});

// File operation contracts
type FileContracts = {
uploadFile: {
dto: { file: z.infer<typeof FileSchema> };
error:
| { type: "validation_error"; status: 400; message: string }
| { type: "file_too_large"; status: 413; message: string; meta: { maxSize: number } }
| { type: "unsupported_file_type"; status: 415; message: string; meta: { supportedTypes: string[] } };
payload: FormData;
};
uploadMultipleFiles: {
dto: { files: z.infer<typeof FileSchema>[] };
error:
| { type: "validation_error"; status: 400; message: string }
| { type: "partial_upload_failure"; status: 207; message: string; meta: { failed: string[]; succeeded: string[] } };
payload: FormData;
};
downloadFile: {
dto: ArrayBuffer;
error:
| { type: "not_found"; status: 404; message: string }
| { type: "unauthorized"; status: 401; message: string };
pathParams: {
fileId: string;
};
extra: {
authorization?: string;
responseType: "arraybuffer";
};
};
getFileInfo: {
dto: { file: z.infer<typeof FileSchema> };
error: { type: "not_found"; status: 404; message: string };
pathParams: {
fileId: string;
};
};
listFiles: {
dto: z.infer<typeof FileListSchema>;
error: { type: "unauthorized"; status: 401; message: string };
searchParams: {
page?: number;
limit?: number;
mimeType?: string;
search?: string;
};
extra: {
authorization?: string;
};
};
deleteFile: {
dto: { success: boolean };
error:
| { type: "not_found"; status: 404; message: string }
| { type: "unauthorized"; status: 401; message: string };
pathParams: {
fileId: string;
};
extra: {
authorization?: string;
};
};
getUploadUrl: {
dto: { uploadUrl: string; fileId: string; expiresIn: number };
error: { type: "validation_error"; status: 400; message: string };
payload: {
fileName: string;
fileSize: number;
mimeType: string;
};
};
uploadToPresignedUrl: {
dto: { success: boolean };
error:
| { type: "upload_failed"; status: 400; message: string }
| { type: "url_expired"; status: 410; message: string };
payload: File;
extra: {
uploadUrl: string;
};
};
};

type ApiConfig = {
baseURL: string;
timeout: number;
maxFileSize: number;
};

const config: ApiConfig = {
baseURL: "https://api.example.com",
timeout: 30000, // Longer timeout for file operations
maxFileSize: 10 _ 1024 _ 1024, // 10MB
};

// Mock files for testing
const createMockFile = (name: string, size: number, type: string): File => {
const content = new Array(size).fill("a").join("");
const blob = new Blob([content], { type });
return new File([blob], name, { type });
};

const createMockFormData = (files: File[]): FormData => {
const formData = new FormData();
files.forEach((file, index) => {
formData.append(files.length === 1 ? "file" : `files[${index}]`, file);
});
return formData;
};

const fileApi = init<ApiConfig>(config)<FileContracts>()({
uploadFile: {
resolver: async ({ payload, config }) => {
const response = await axios.post(`${config.baseURL}/files/upload`, payload, {
timeout: config.timeout,
headers: {
"Content-Type": "multipart/form-data",
},
});
return response.data;
},
schemas: {
dto: check((data: unknown) => {
const schema = z.object({ file: FileSchema });
return schema.parse(data);
}),
},
},
uploadMultipleFiles: {
resolver: async ({ payload, config }) => {
const response = await axios.post(`${config.baseURL}/files/upload-multiple`, payload, {
timeout: config.timeout,
headers: {
"Content-Type": "multipart/form-data",
},
});
return response.data;
},
schemas: {
dto: check((data: unknown) => {
const schema = z.object({ files: z.array(FileSchema) });
return schema.parse(data);
}),
},
},
downloadFile: {
resolver: async ({ pathParams, extra, config }) => {
const headers: Record<string, string> = {};
if (extra?.authorization) {
headers.Authorization = extra.authorization;
}

      const response = await axios.get(`${config.baseURL}/files/${pathParams.fileId}/download`, {
        timeout: config.timeout,
        responseType: extra?.responseType || "arraybuffer",
        headers,
      });
      return response.data;
    },
    schemas: {
      pathParams: check((data: unknown) => {
        const schema = z.object({ fileId: z.string().min(1) });
        return schema.parse(data);
      }),
      extra: check((data: unknown) => {
        const schema = z.object({
          authorization: z.string().optional(),
          responseType: z.literal("arraybuffer"),
        });
        return schema.parse(data);
      }),
    },

},
getFileInfo: {
resolver: async ({ pathParams, config }) => {
const response = await axios.get(`${config.baseURL}/files/${pathParams.fileId}`, {
timeout: config.timeout,
});
return response.data;
},
schemas: {
pathParams: check((data: unknown) => {
const schema = z.object({ fileId: z.string().min(1) });
return schema.parse(data);
}),
},
},
listFiles: {
resolver: async ({ searchParams, extra, config }) => {
const params = new URLSearchParams();
if (searchParams?.page) params.append("page", searchParams.page.toString());
if (searchParams?.limit) params.append("limit", searchParams.limit.toString());
if (searchParams?.mimeType) params.append("mimeType", searchParams.mimeType);
if (searchParams?.search) params.append("search", searchParams.search);

      const headers: Record<string, string> = {};
      if (extra?.authorization) {
        headers.Authorization = extra.authorization;
      }

      const response = await axios.get(`${config.baseURL}/files?${params}`, {
        timeout: config.timeout,
        headers,
      });
      return response.data;
    },
    schemas: {
      searchParams: check((data: unknown) => {
        const schema = z.object({
          page: z.number().optional(),
          limit: z.number().optional(),
          mimeType: z.string().optional(),
          search: z.string().optional(),
        });
        return schema.parse(data);
      }),
    },

},
deleteFile: {
resolver: async ({ pathParams, extra, config }) => {
const headers: Record<string, string> = {};
if (extra?.authorization) {
headers.Authorization = extra.authorization;
}

      const response = await axios.delete(`${config.baseURL}/files/${pathParams.fileId}`, {
        timeout: config.timeout,
        headers,
      });
      return response.data;
    },
    schemas: {
      pathParams: check((data: unknown) => {
        const schema = z.object({ fileId: z.string().min(1) });
        return schema.parse(data);
      }),
    },

},
getUploadUrl: {
resolver: async ({ payload, config }) => {
const response = await axios.post(`${config.baseURL}/files/upload-url`, payload, {
timeout: config.timeout,
});
return response.data;
},
schemas: {
payload: check((data: unknown) => {
const schema = z.object({
fileName: z.string().min(1),
fileSize: z.number().positive(),
mimeType: z.string().min(1),
});
return schema.parse(data);
}),
},
},
uploadToPresignedUrl: {
resolver: async ({ payload, extra, config }) => {
const response = await axios.put(extra.uploadUrl, payload, {
timeout: config.timeout,
headers: {
"Content-Type": payload.type,
},
});
return response.data;
},
schemas: {
extra: check((data: unknown) => {
const schema = z.object({
uploadUrl: z.string().url(),
});
return schema.parse(data);
}),
},
},
});

const parseError = errorParser(fileApi);

// Add file operation endpoints to MSW
server.use(
// Multiple file upload
http.post("https://api.example.com/files/upload-multiple", async ({ request }) => {
await delay(500);

    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("multipart/form-data")) {
      return HttpResponse.json(
        {
          type: "validation_error",
          status: 400,
          message: "Content-Type must be multipart/form-data",
        },
        { status: 400 }
      );
    }

    // Simulate processing multiple files
    const files = [
      {
        id: "file-1",
        name: "document1.pdf",
        size: 1024,
        mimeType: "application/pdf",
        url: "https://cdn.example.com/files/file-1.pdf",
        uploadedAt: new Date().toISOString(),
      },
      {
        id: "file-2",
        name: "image1.jpg",
        size: 2048,
        mimeType: "image/jpeg",
        url: "https://cdn.example.com/files/file-2.jpg",
        uploadedAt: new Date().toISOString(),
      },
    ];

    return HttpResponse.json({ files });

}),

// File download
http.get("https://api.example.com/files/:fileId/download", async ({ params, request }) => {
await delay(200);

    const authHeader = request.headers.get("Authorization");
    if (params.fileId === "private-file" && !authHeader) {
      return HttpResponse.json(
        {
          type: "unauthorized",
          status: 401,
          message: "Authentication required for this file",
        },
        { status: 401 }
      );
    }

    if (params.fileId === "nonexistent") {
      return HttpResponse.json(
        {
          type: "not_found",
          status: 404,
          message: "File not found",
        },
        { status: 404 }
      );
    }

    // Return mock file content as ArrayBuffer
    const content = "Mock file content for testing";
    const buffer = new TextEncoder().encode(content);
    return new HttpResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="test-file.pdf"`,
        "Content-Length": buffer.length.toString(),
      },
    });

}),

// File info
http.get("https://api.example.com/files/:fileId", async ({ params }) => {
await delay(100);

    if (params.fileId === "nonexistent") {
      return HttpResponse.json(
        {
          type: "not_found",
          status: 404,
          message: "File not found",
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      file: {
        id: params.fileId,
        name: "test-file.pdf",
        size: 1024576,
        mimeType: "application/pdf",
        url: `https://cdn.example.com/files/${params.fileId}.pdf`,
        uploadedAt: "2024-01-01T00:00:00Z",
      },
    });

}),

// List files
http.get("https://api.example.com/files", async ({ request }) => {
await delay(150);

    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const mimeType = url.searchParams.get("mimeType");
    const search = url.searchParams.get("search");

    let mockFiles = [
      {
        id: "file-1",
        name: "document.pdf",
        size: 1024576,
        mimeType: "application/pdf",
        url: "https://cdn.example.com/files/file-1.pdf",
        uploadedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "file-2",
        name: "image.jpg",
        size: 512000,
        mimeType: "image/jpeg",
        url: "https://cdn.example.com/files/file-2.jpg",
        uploadedAt: "2024-01-02T00:00:00Z",
      },
      {
        id: "file-3",
        name: "spreadsheet.xlsx",
        size: 256000,
        mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        url: "https://cdn.example.com/files/file-3.xlsx",
        uploadedAt: "2024-01-03T00:00:00Z",
      },
    ];

    // Filter by mime type
    if (mimeType) {
      mockFiles = mockFiles.filter(file => file.mimeType === mimeType);
    }

    // Filter by search
    if (search) {
      mockFiles = mockFiles.filter(file =>
        file.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedFiles = mockFiles.slice(startIndex, startIndex + limit);

    return HttpResponse.json({
      files: paginatedFiles,
      pagination: {
        page,
        limit,
        total: mockFiles.length,
        totalPages: Math.ceil(mockFiles.length / limit),
      },
    });

}),

// Delete file
http.delete("https://api.example.com/files/:fileId", async ({ params, request }) => {
await delay(100);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        {
          type: "unauthorized",
          status: 401,
          message: "Authentication required",
        },
        { status: 401 }
      );
    }

    if (params.fileId === "nonexistent") {
      return HttpResponse.json(
        {
          type: "not_found",
          status: 404,
          message: "File not found",
        },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true });

}),

// Presigned upload URL
http.post("https://api.example.com/files/upload-url", async ({ request }) => {
await delay(100);

    const body = await request.json() as { fileName: string; fileSize: number; mimeType: string };

    if (!body.fileName || !body.fileSize || !body.mimeType) {
      return HttpResponse.json(
        {
          type: "validation_error",
          status: 400,
          message: "fileName, fileSize, and mimeType are required",
        },
        { status: 400 }
      );
    }

    if (body.fileSize > 10 * 1024 * 1024) { // 10MB limit
      return HttpResponse.json(
        {
          type: "file_too_large",
          status: 413,
          message: "File size exceeds maximum allowed size",
          meta: { maxSize: 10 * 1024 * 1024 },
        },
        { status: 413 }
      );
    }

    const fileId = `file-${Date.now()}`;
    return HttpResponse.json({
      uploadUrl: `https://storage.example.com/upload/${fileId}`,
      fileId,
      expiresIn: 3600, // 1 hour
    });

}),

// Presigned URL upload
http.put("https://storage.example.com/upload/:fileId", async ({ params }) => {
await delay(800); // Simulate upload time

    if (params.fileId === "expired-url") {
      return HttpResponse.json(
        {
          type: "url_expired",
          status: 410,
          message: "Upload URL has expired",
        },
        { status: 410 }
      );
    }

    return HttpResponse.json({ success: true });

}),

// File type validation endpoint
http.post("https://api.example.com/files/validate-type", async ({ request }) => {
const contentType = request.headers.get("content-type");
if (!contentType?.includes("multipart/form-data")) {
return HttpResponse.json(
{
type: "validation_error",
status: 400,
message: "Content-Type must be multipart/form-data",
},
{ status: 400 }
);
}

    // Simulate unsupported file type
    return HttpResponse.json(
      {
        type: "unsupported_file_type",
        status: 415,
        message: "File type not supported",
        meta: {
          supportedTypes: ["image/jpeg", "image/png", "application/pdf", "text/plain"],
        },
      },
      { status: 415 }
    );

})
);

describe("File Operations with MSW", () => {
beforeEach(() => {
// Reset any test-specific state
});

describe("File Upload", () => {
it("should upload a single file successfully", async () => {
const mockFile = createMockFile("test.pdf", 1024, "application/pdf");
const formData = createMockFormData([mockFile]);

      const result = await fileApi.call("uploadFile", { payload: formData });

      expect(result.file).toMatchObject({
        id: expect.any(String),
        name: expect.any(String),
        size: expect.any(Number),
        mimeType: expect.any(String),
        url: expect.stringMatching(/^https?:\/\/.+/),
        uploadedAt: expect.any(String),
      });
    });

    it("should handle upload validation errors", async () => {
      const [success, error] = await fileApi.safeCall("uploadFile", {
        payload: new FormData(), // Empty form data
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("uploadFile", error);
        expect(parsedError.type).toBe("validation_error");
        expect(parsedError.status).toBe(400);
      }
    });

    it("should upload multiple files successfully", async () => {
      const mockFiles = [
        createMockFile("doc1.pdf", 1024, "application/pdf"),
        createMockFile("image1.jpg", 2048, "image/jpeg"),
      ];
      const formData = createMockFormData(mockFiles);

      const result = await fileApi.call("uploadMultipleFiles", { payload: formData });

      expect(result.files).toHaveLength(2);
      expect(result.files[0]).toMatchObject({
        id: "file-1",
        name: "document1.pdf",
        mimeType: "application/pdf",
      });
      expect(result.files[1]).toMatchObject({
        id: "file-2",
        name: "image1.jpg",
        mimeType: "image/jpeg",
      });
    });

});

describe("File Download", () => {
it("should download a file successfully", async () => {
const pathParams = fileApi.pathParams("downloadFile", { fileId: "file-123" });
const extra = fileApi.extra("downloadFile", { responseType: "arraybuffer" });

      const result = await fileApi.call("downloadFile", { pathParams, extra });

      expect(result).toBeInstanceOf(ArrayBuffer);

      // Convert ArrayBuffer to string to verify content
      const decoder = new TextDecoder();
      const content = decoder.decode(result);
      expect(content).toBe("Mock file content for testing");
    });

    it("should handle file not found", async () => {
      const pathParams = fileApi.pathParams("downloadFile", { fileId: "nonexistent" });
      const extra = fileApi.extra("downloadFile", { responseType: "arraybuffer" });

      const [success, error] = await fileApi.safeCall("downloadFile", { pathParams, extra });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("downloadFile", error);
        expect(parsedError.type).toBe("not_found");
        expect(parsedError.status).toBe(404);
      }
    });

    it("should handle unauthorized download", async () => {
      const pathParams = fileApi.pathParams("downloadFile", { fileId: "private-file" });
      const extra = fileApi.extra("downloadFile", { responseType: "arraybuffer" });

      const [success, error] = await fileApi.safeCall("downloadFile", { pathParams, extra });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("downloadFile", error);
        expect(parsedError.type).toBe("unauthorized");
        expect(parsedError.status).toBe(401);
      }
    });

    it("should download with authorization", async () => {
      const pathParams = fileApi.pathParams("downloadFile", { fileId: "private-file" });
      const extra = fileApi.extra("downloadFile", {
        responseType: "arraybuffer",
        authorization: "Bearer valid-token",
      });

      const result = await fileApi.call("downloadFile", { pathParams, extra });

      expect(result).toBeInstanceOf(ArrayBuffer);
    });

});

describe("File Information", () => {
it("should get file info successfully", async () => {
const pathParams = fileApi.pathParams("getFileInfo", { fileId: "file-123" });
const result = await fileApi.call("getFileInfo", { pathParams });

      expect(result.file).toMatchObject({
        id: "file-123",
        name: "test-file.pdf",
        size: 1024576,
        mimeType: "application/pdf",
        url: "https://cdn.example.com/files/file-123.pdf",
      });
    });

    it("should handle file info not found", async () => {
      const pathParams = fileApi.pathParams("getFileInfo", { fileId: "nonexistent" });
      const [success, error] = await fileApi.safeCall("getFileInfo", { pathParams });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("getFileInfo", error);
        expect(parsedError.type).toBe("not_found");
        expect(parsedError.status).toBe(404);
      }
    });

});

describe("File Listing", () => {
it("should list files with default pagination", async () => {
const result = await fileApi.call("listFiles");

      expect(result.files).toBeInstanceOf(Array);
      expect(result.files.length).toBeGreaterThan(0);
      expect(result.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
    });

    it("should list files with custom pagination", async () => {
      const searchParams = fileApi.searchParams("listFiles", { page: 2, limit: 5 });
      const result = await fileApi.call("listFiles", { searchParams });

      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(5);
    });

    it("should filter files by mime type", async () => {
      const searchParams = fileApi.searchParams("listFiles", { mimeType: "application/pdf" });
      const result = await fileApi.call("listFiles", { searchParams });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].mimeType).toBe("application/pdf");
    });

    it("should search files by name", async () => {
      const searchParams = fileApi.searchParams("listFiles", { search: "image" });
      const result = await fileApi.call("listFiles", { searchParams });

      expect(result.files).toHaveLength(1);
      expect(result.files[0].name).toContain("image");
    });

});

describe("File Deletion", () => {
it("should delete file successfully", async () => {
const pathParams = fileApi.pathParams("deleteFile", { fileId: "file-123" });
const extra = fileApi.extra("deleteFile", { authorization: "Bearer valid-token" });

      const result = await fileApi.call("deleteFile", { pathParams, extra });

      expect(result.success).toBe(true);
    });

    it("should handle unauthorized deletion", async () => {
      const pathParams = fileApi.pathParams("deleteFile", { fileId: "file-123" });
      const [success, error] = await fileApi.safeCall("deleteFile", { pathParams });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("deleteFile", error);
        expect(parsedError.type).toBe("unauthorized");
        expect(parsedError.status).toBe(401);
      }
    });

});

describe("Presigned URL Upload", () => {
it("should get upload URL and upload file", async () => {
// 1. Get presigned upload URL
const urlPayload = fileApi.payload("getUploadUrl", {
fileName: "test.pdf",
fileSize: 1024,
mimeType: "application/pdf",
});

      const urlResult = await fileApi.call("getUploadUrl", { payload: urlPayload });

      expect(urlResult).toMatchObject({
        uploadUrl: expect.stringMatching(/^https?:\/\/.+/),
        fileId: expect.any(String),
        expiresIn: expect.any(Number),
      });

      // 2. Upload file to presigned URL
      const mockFile = createMockFile("test.pdf", 1024, "application/pdf");
      const uploadExtra = fileApi.extra("uploadToPresignedUrl", {
        uploadUrl: urlResult.uploadUrl,
      });

      const uploadResult = await fileApi.call("uploadToPresignedUrl", {
        payload: mockFile,
        extra: uploadExtra,
      });

      expect(uploadResult.success).toBe(true);
    });

    it("should handle file size validation", async () => {
      const payload = fileApi.payload("getUploadUrl", {
        fileName: "large-file.pdf",
        fileSize: 20 * 1024 * 1024, // 20MB (exceeds 10MB limit)
        mimeType: "application/pdf",
      });

      const [success, error] = await fileApi.safeCall("getUploadUrl", { payload });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("getUploadUrl", error);
        expect(parsedError.type).toBe("file_too_large");
        expect(parsedError.status).toBe(413);
        if ('meta' in parsedError) {
          expect(parsedError.meta).toMatchObject({
            maxSize: 10 * 1024 * 1024,
          });
        }
      }
    });

    it("should handle expired upload URL", async () => {
      const mockFile = createMockFile("test.pdf", 1024, "application/pdf");
      const extra = fileApi.extra("uploadToPresignedUrl", {
        uploadUrl: "https://storage.example.com/upload/expired-url",
      });

      const [success, error] = await fileApi.safeCall("uploadToPresignedUrl", {
        payload: mockFile,
        extra,
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("uploadToPresignedUrl", error);
        expect(parsedError.type).toBe("url_expired");
        expect(parsedError.status).toBe(410);
      }
    });

});

describe("File Upload Progress Simulation", () => {
it("should simulate upload progress tracking", async () => {
const progressEvents: z.infer<typeof FileUploadProgressSchema>[] = [];

      // Mock progress tracking
      const simulateUploadProgress = (
        onProgress: (progress: z.infer<typeof FileUploadProgressSchema>) => void
      ) => {
        const total = 1024;
        let loaded = 0;

        const interval = setInterval(() => {
          loaded += 128;
          const percentage = Math.min((loaded / total) * 100, 100);

          onProgress({ loaded, total, percentage });

          if (loaded >= total) {
            clearInterval(interval);
          }
        }, 50);
      };

      // Start progress simulation
      const progressPromise = new Promise<void>((resolve) => {
        simulateUploadProgress((progress) => {
          progressEvents.push(progress);
          if (progress.percentage === 100) {
            resolve();
          }
        });
      });

      // Wait for progress to complete
      await progressPromise;

      expect(progressEvents).toHaveLength(8); // 1024 / 128 = 8 updates
      expect(progressEvents[0]).toMatchObject({
        loaded: 128,
        total: 1024,
        percentage: 12.5,
      });
      expect(progressEvents[progressEvents.length - 1]).toMatchObject({
        loaded: 1024,
        total: 1024,
        percentage: 100,
      });
    });

});

describe("Complete File Workflow", () => {
it("should handle complete file management workflow", async () => {
const authToken = "Bearer test-token";

      // 1. Upload a file
      const mockFile = createMockFile("workflow-test.pdf", 1024, "application/pdf");
      const formData = createMockFormData([mockFile]);
      const uploadResult = await fileApi.call("uploadFile", { payload: formData });
      const fileId = uploadResult.file.id;

      // 2. Get file info
      const infoPathParams = fileApi.pathParams("getFileInfo", { fileId });
      const infoResult = await fileApi.call("getFileInfo", { pathParams: infoPathParams });
      expect(infoResult.file.id).toBe(fileId);

      // 3. List files and verify it appears
      const listResult = await fileApi.call("listFiles");
      const foundFile = listResult.files.find(f => f.id === fileId);
      expect(foundFile).toBeTruthy();

      // 4. Download the file
      const downloadPathParams = fileApi.pathParams("downloadFile", { fileId });
      const downloadExtra = fileApi.extra("downloadFile", { responseType: "arraybuffer" });
      const downloadResult = await fileApi.call("downloadFile", {
        pathParams: downloadPathParams,
        extra: downloadExtra,
      });
      expect(downloadResult).toBeInstanceOf(ArrayBuffer);

      // 5. Delete the file
      const deletePathParams = fileApi.pathParams("deleteFile", { fileId });
      const deleteExtra = fileApi.extra("deleteFile", { authorization: authToken });
      const deleteResult = await fileApi.call("deleteFile", {
        pathParams: deletePathParams,
        extra: deleteExtra,
      });
      expect(deleteResult.success).toBe(true);
    });

});
});
