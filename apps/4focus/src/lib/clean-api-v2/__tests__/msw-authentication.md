import { describe, it, expect, beforeEach } from "vitest";
import { z } from "zod";
import axios from "axios";
import { init, check } from "../core";
import { errorParser } from "../adapters/axios";

// Authentication schemas
const UserSchema = z.object({
id: z.string(),
name: z.string(),
email: z.string().email(),
avatar: z.string().url(),
role: z.enum(["admin", "user"]),
createdAt: z.string(),
});

const LoginResponseSchema = z.object({
user: UserSchema,
accessToken: z.string(),
refreshToken: z.string(),
expiresIn: z.number(),
});

const RefreshResponseSchema = z.object({
accessToken: z.string(),
expiresIn: z.number(),
});

// Authentication contracts
type AuthContracts = {
login: {
dto: z.infer<typeof LoginResponseSchema>;
error:
| { type: "invalid_credentials"; status: 401; message: string }
| { type: "validation_error"; status: 400; message: string; meta: { fields: string[] } };
payload: {
email: string;
password: string;
};
};
refresh: {
dto: z.infer<typeof RefreshResponseSchema>;
error:
| { type: "invalid_token"; status: 401; message: string }
| { type: "token_expired"; status: 401; message: string };
payload: {
refreshToken: string;
};
};
logout: {
dto: { success: boolean };
error: { type: "unauthorized"; status: 401; message: string };
extra: {
authorization: string;
};
};
getProfile: {
dto: { user: z.infer<typeof UserSchema> };
error:
| { type: "unauthorized"; status: 401; message: string }
| { type: "token_expired"; status: 401; message: string };
extra: {
authorization: string;
};
};
updateProfile: {
dto: { user: z.infer<typeof UserSchema> };
error:
| { type: "unauthorized"; status: 401; message: string }
| { type: "validation_error"; status: 400; message: string };
payload: Partial<Pick<z.infer<typeof UserSchema>, "name" | "email">>;
extra: {
authorization: string;
};
};
};

type ApiConfig = {
baseURL: string;
timeout: number;
};

const config: ApiConfig = {
baseURL: "https://api.example.com",
timeout: 5000,
};

// Token manager for handling authentication state
class TokenManager {
private accessToken: string | null = null;
private refreshToken: string | null = null;

setTokens(accessToken: string, refreshToken: string) {
this.accessToken = accessToken;
this.refreshToken = refreshToken;
}

getAccessToken() {
return this.accessToken;
}

getRefreshToken() {
return this.refreshToken;
}

clearTokens() {
this.accessToken = null;
this.refreshToken = null;
}

isAuthenticated() {
return !!this.accessToken;
}
}

const tokenManager = new TokenManager();

const authApi = init<ApiConfig>(config)<AuthContracts>()({
login: {
resolver: async ({ payload, config }) => {
const response = await axios.post(`${config.baseURL}/auth/login`, payload, {
timeout: config.timeout,
});
return response.data;
},
schemas: {
dto: check((data: unknown) => LoginResponseSchema.parse(data), LoginResponseSchema),
payload: check((data: unknown) => {
const schema = z.object({
email: z.string().email("Invalid email format"),
password: z.string().min(1, "Password is required"),
});
return schema.parse(data);
}),
},
},
refresh: {
resolver: async ({ payload, config }) => {
const response = await axios.post(`${config.baseURL}/auth/refresh`, payload, {
timeout: config.timeout,
});
return response.data;
},
schemas: {
dto: check((data: unknown) => RefreshResponseSchema.parse(data), RefreshResponseSchema),
payload: check((data: unknown) => {
const schema = z.object({
refreshToken: z.string().min(1, "Refresh token is required"),
});
return schema.parse(data);
}),
},
},
logout: {
resolver: async ({ extra, config }) => {
const response = await axios.post(
`${config.baseURL}/auth/logout`,
{},
{
headers: {
Authorization: extra.authorization,
},
timeout: config.timeout,
}
);
return response.data;
},
schemas: {
extra: check((data: unknown) => {
const schema = z.object({
authorization: z.string().min(1, "Authorization header is required"),
});
return schema.parse(data);
}),
},
},
getProfile: {
resolver: async ({ extra, config }) => {
const response = await axios.get(`${config.baseURL}/auth/profile`, {
headers: {
Authorization: extra.authorization,
},
timeout: config.timeout,
});
return response.data;
},
schemas: {
extra: check((data: unknown) => {
const schema = z.object({
authorization: z.string().min(1, "Authorization header is required"),
});
return schema.parse(data);
}),
},
},
updateProfile: {
resolver: async ({ payload, extra, config }) => {
const response = await axios.put(`${config.baseURL}/auth/profile`, payload, {
headers: {
Authorization: extra.authorization,
},
timeout: config.timeout,
});
return response.data;
},
schemas: {
payload: check((data: unknown) => {
const schema = z.object({
name: z.string().optional(),
email: z.string().email().optional(),
});
return schema.parse(data);
}),
extra: check((data: unknown) => {
const schema = z.object({
authorization: z.string().min(1, "Authorization header is required"),
});
return schema.parse(data);
}),
},
},
});

const parseError = errorParser(authApi);

// Add profile endpoint to MSW handlers
import { server } from "./msw/server";
import { http, HttpResponse } from "msw";

// Set up additional auth endpoints for testing
server.use(
http.get("https://api.example.com/auth/profile", async ({ request }) => {
const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          type: "unauthorized",
          status: 401,
          message: "Missing or invalid authorization header",
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    if (token === "mock-jwt-token-12345" || token.startsWith("mock-jwt-token-new-")) {
      return HttpResponse.json({
        user: {
          id: "1",
          name: "John Doe",
          email: "admin@example.com",
          avatar: "https://example.com/avatar1.jpg",
          role: "admin",
          createdAt: "2024-01-01T00:00:00Z",
        },
      });
    }

    return HttpResponse.json(
      {
        type: "token_expired",
        status: 401,
        message: "Token has expired",
      },
      { status: 401 }
    );

}),

http.put("https://api.example.com/auth/profile", async ({ request }) => {
const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json(
        {
          type: "unauthorized",
          status: 401,
          message: "Missing or invalid authorization header",
        },
        { status: 401 }
      );
    }

    const body = await request.json() as { name?: string; email?: string };

    if (body.email && !z.string().email().safeParse(body.email).success) {
      return HttpResponse.json(
        {
          type: "validation_error",
          status: 400,
          message: "Invalid email format",
        },
        { status: 400 }
      );
    }

    return HttpResponse.json({
      user: {
        id: "1",
        name: body.name || "John Doe",
        email: body.email || "admin@example.com",
        avatar: "https://example.com/avatar1.jpg",
        role: "admin",
        createdAt: "2024-01-01T00:00:00Z",
      },
    });

})
);

describe("Authentication Flow with MSW", () => {
beforeEach(() => {
// Clear tokens before each test
tokenManager.clearTokens();
});

describe("Login Flow", () => {
it("should login successfully with valid credentials", async () => {
const payload = authApi.payload("login", {
email: "admin@example.com",
password: "password123",
});

      const result = await authApi.call("login", { payload });

      expect(result).toMatchObject({
        user: expect.objectContaining({
          id: "1",
          name: "John Doe",
          email: "admin@example.com",
          role: "admin",
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
        expiresIn: expect.any(Number),
      });

      // Store tokens for subsequent tests
      tokenManager.setTokens(result.accessToken, result.refreshToken);
    });

    it("should handle invalid credentials", async () => {
      const payload = authApi.payload("login", {
        email: "invalid@example.com",
        password: "wrongpassword",
      });

      const [success, error] = await authApi.safeCall("login", { payload });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("login", error);
        expect(parsedError.type).toBe("invalid_credentials");
        expect(parsedError.status).toBe(401);
        expect(parsedError.message).toBe("Invalid email or password");
      }
    });

    it("should validate login payload", () => {
      expect(() => {
        authApi.payload("login", {
          email: "invalid-email",
          password: "",
        });
      }).toThrow();
    });

    it("should handle missing credentials", async () => {
      const [success, error] = await authApi.safeCall("login", {
        payload: {} as any,
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("login", error);
        expect(parsedError.type).toBe("validation_error");
        expect(parsedError.status).toBe(400);
        expect(parsedError.message).toBe("Missing required fields");
      }
    });

});

describe("Token Refresh Flow", () => {
it("should refresh tokens successfully", async () => {
// First login to get tokens
const loginPayload = authApi.payload("login", {
email: "admin@example.com",
password: "password123",
});
const loginResult = await authApi.call("login", { payload: loginPayload });

      // Now refresh the token
      const refreshPayload = authApi.payload("refresh", {
        refreshToken: loginResult.refreshToken,
      });
      const refreshResult = await authApi.call("refresh", { payload: refreshPayload });

      expect(refreshResult).toMatchObject({
        accessToken: expect.any(String),
        expiresIn: expect.any(Number),
      });

      // New access token should be different
      expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);
    });

    it("should handle invalid refresh token", async () => {
      const payload = authApi.payload("refresh", {
        refreshToken: "invalid-refresh-token",
      });

      const [success, error] = await authApi.safeCall("refresh", { payload });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("refresh", error);
        expect(parsedError.type).toBe("invalid_token");
        expect(parsedError.status).toBe(401);
        expect(parsedError.message).toBe("Invalid refresh token");
      }
    });

});

describe("Protected Endpoints", () => {
it("should access profile with valid token", async () => {
// Login first
const loginPayload = authApi.payload("login", {
email: "admin@example.com",
password: "password123",
});
const loginResult = await authApi.call("login", { payload: loginPayload });

      // Access profile
      const extra = authApi.extra("getProfile", {
        authorization: `Bearer ${loginResult.accessToken}`,
      });
      const profileResult = await authApi.call("getProfile", { extra });

      expect(profileResult.user).toMatchObject({
        id: "1",
        name: "John Doe",
        email: "admin@example.com",
        role: "admin",
      });
    });

    it("should reject requests without authorization", async () => {
      const [success, error] = await authApi.safeCall("getProfile", {
        extra: { authorization: "" } as any,
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("getProfile", error);
        expect(parsedError.type).toBe("unauthorized");
        expect(parsedError.status).toBe(401);
      }
    });

    it("should handle expired tokens", async () => {
      const extra = authApi.extra("getProfile", {
        authorization: "Bearer expired-token",
      });

      const [success, error] = await authApi.safeCall("getProfile", { extra });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("getProfile", error);
        expect(parsedError.type).toBe("token_expired");
        expect(parsedError.status).toBe(401);
      }
    });

});

describe("Profile Management", () => {
let authToken: string;

    beforeEach(async () => {
      // Login to get a valid token
      const loginPayload = authApi.payload("login", {
        email: "admin@example.com",
        password: "password123",
      });
      const loginResult = await authApi.call("login", { payload: loginPayload });
      authToken = loginResult.accessToken;
    });

    it("should update profile successfully", async () => {
      const payload = authApi.payload("updateProfile", {
        name: "Updated Name",
      });
      const extra = authApi.extra("updateProfile", {
        authorization: `Bearer ${authToken}`,
      });

      const result = await authApi.call("updateProfile", { payload, extra });

      expect(result.user.name).toBe("Updated Name");
      expect(result.user.id).toBe("1");
    });

    it("should validate profile update data", async () => {
      const extra = authApi.extra("updateProfile", {
        authorization: `Bearer ${authToken}`,
      });

      expect(() => {
        authApi.payload("updateProfile", {
          email: "invalid-email-format",
        });
      }).toThrow();
    });

    it("should handle invalid email in profile update", async () => {
      const extra = authApi.extra("updateProfile", {
        authorization: `Bearer ${authToken}`,
      });

      // This should pass client validation but fail on server
      const [success, error] = await authApi.safeCall("updateProfile", {
        payload: { email: "invalid" } as any,
        extra,
      });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("updateProfile", error);
        expect(parsedError.type).toBe("validation_error");
        expect(parsedError.status).toBe(400);
      }
    });

});

describe("Logout Flow", () => {
it("should logout successfully", async () => {
// Login first
const loginPayload = authApi.payload("login", {
email: "admin@example.com",
password: "password123",
});
const loginResult = await authApi.call("login", { payload: loginPayload });

      // Logout
      const extra = authApi.extra("logout", {
        authorization: `Bearer ${loginResult.accessToken}`,
      });
      const logoutResult = await authApi.call("logout", { extra });

      expect(logoutResult.success).toBe(true);
    });

});

describe("Complete Authentication Workflow", () => {
it("should handle complete auth workflow with token refresh", async () => {
// 1. Login
const loginPayload = authApi.payload("login", {
email: "admin@example.com",
password: "password123",
});
const loginResult = await authApi.call("login", { payload: loginPayload });

      expect(loginResult.accessToken).toBeDefined();
      expect(loginResult.refreshToken).toBeDefined();

      // 2. Access protected resource
      const profileExtra = authApi.extra("getProfile", {
        authorization: `Bearer ${loginResult.accessToken}`,
      });
      const profileResult = await authApi.call("getProfile", { extra: profileExtra });

      expect(profileResult.user.email).toBe("admin@example.com");

      // 3. Refresh token
      const refreshPayload = authApi.payload("refresh", {
        refreshToken: loginResult.refreshToken,
      });
      const refreshResult = await authApi.call("refresh", { payload: refreshPayload });

      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(loginResult.accessToken);

      // 4. Use new token to access protected resource
      const newProfileExtra = authApi.extra("getProfile", {
        authorization: `Bearer ${refreshResult.accessToken}`,
      });
      const newProfileResult = await authApi.call("getProfile", { extra: newProfileExtra });

      expect(newProfileResult.user.email).toBe("admin@example.com");

      // 5. Update profile
      const updatePayload = authApi.payload("updateProfile", {
        name: "Updated John Doe",
      });
      const updateExtra = authApi.extra("updateProfile", {
        authorization: `Bearer ${refreshResult.accessToken}`,
      });
      const updateResult = await authApi.call("updateProfile", {
        payload: updatePayload,
        extra: updateExtra
      });

      expect(updateResult.user.name).toBe("Updated John Doe");

      // 6. Logout
      const logoutExtra = authApi.extra("logout", {
        authorization: `Bearer ${refreshResult.accessToken}`,
      });
      const logoutResult = await authApi.call("logout", { extra: logoutExtra });

      expect(logoutResult.success).toBe(true);
    });

});

describe("Authentication Helper Functions", () => {
it("should implement automatic token refresh on 401", async () => {
class AuthenticatedApiClient {
constructor(
private api: typeof authApi,
private tokenManager: TokenManager
) {}

        async callWithAuth<TKey extends keyof AuthContracts>(
          endpoint: TKey,
          params: Parameters<typeof authApi.call>[1] = {}
        ): Promise<AuthContracts[TKey]["dto"]> {
          const token = this.tokenManager.getAccessToken();
          if (!token) {
            throw new Error("Not authenticated");
          }

          // Add authorization to extra params
          const paramsWithAuth = {
            ...params,
            extra: {
              ...params?.extra,
              authorization: `Bearer ${token}`,
            },
          };

          const [success, result] = await this.api.safeCall(endpoint, paramsWithAuth);

          if (success) {
            return result;
          }

          // Try to refresh token on 401
          const parsedError = parseError(endpoint, result);
          if (parsedError.status === 401 && parsedError.type === "token_expired") {
            await this.refreshToken();

            // Retry with new token
            const newToken = this.tokenManager.getAccessToken();
            if (newToken) {
              const retryParams = {
                ...params,
                extra: {
                  ...params?.extra,
                  authorization: `Bearer ${newToken}`,
                },
              };
              const [retrySuccess, retryResult] = await this.api.safeCall(endpoint, retryParams);
              if (retrySuccess) {
                return retryResult;
              }
            }
          }

          throw result;
        }

        private async refreshToken(): Promise<void> {
          const refreshToken = this.tokenManager.getRefreshToken();
          if (!refreshToken) {
            throw new Error("No refresh token available");
          }

          const payload = this.api.payload("refresh", { refreshToken });
          const refreshResult = await this.api.call("refresh", { payload });

          this.tokenManager.setTokens(refreshResult.accessToken, refreshToken);
        }
      }

      // Test the authenticated client
      const authClient = new AuthenticatedApiClient(authApi, tokenManager);

      // Login first to get tokens
      const loginPayload = authApi.payload("login", {
        email: "admin@example.com",
        password: "password123",
      });
      const loginResult = await authApi.call("login", { payload: loginPayload });
      tokenManager.setTokens(loginResult.accessToken, loginResult.refreshToken);

      // Use the authenticated client
      const profile = await authClient.callWithAuth("getProfile");
      expect(profile.user.email).toBe("admin@example.com");
    });

});
});
