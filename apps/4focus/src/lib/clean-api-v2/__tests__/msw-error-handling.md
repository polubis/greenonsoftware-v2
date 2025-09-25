import { describe, it, expect } from "vitest";
import \* as z from "zod";
import axios from "axios";
import { init, check } from "../core";
import { errorParser } from "../adapters/axios";
import { server } from "./msw/server";
import { http, HttpResponse } from "msw";

// Error simulation contracts
type ErrorTestContracts = {
networkError: {
dto: { message: string };
error: { type: "network_error"; status: -3; message: string };
};
slowEndpoint: {
dto: { message: string };
error: { type: "timeout"; status: -1; message: string };
};
serverError: {
dto: { message: string };
error: { type: "internal_server_error"; status: 500; message: string };
};
validationTest: {
dto: { result: string };
error: { type: "validation_error"; status: 400; message: string };
payload: { requiredField: string; optionalField?: string };
};
abortableRequest: {
dto: { data: string };
error: { type: "aborted"; status: 0; message: string };
};
};

type ApiConfig = {
baseURL: string;
timeout: number;
};

const config: ApiConfig = {
baseURL: "https://api.example.com",
timeout: 1000, // Short timeout for testing
};

const errorTestApi = init<ApiConfig>(config)<ErrorTestContracts>()({
networkError: {
resolver: async ({ config }) => {
const response = await axios.get(`${config.baseURL}/network-error`, {
timeout: config.timeout,
});
return response.data;
},
},
slowEndpoint: {
resolver: async ({ config }) => {
const response = await axios.get(`${config.baseURL}/slow-endpoint`, {
timeout: config.timeout,
});
return response.data;
},
},
serverError: {
resolver: async ({ config }) => {
const response = await axios.get(`${config.baseURL}/server-error`, {
timeout: config.timeout,
});
return response.data;
},
},
validationTest: {
resolver: async ({ payload, config }) => {
const response = await axios.post(`${config.baseURL}/validation-test`, payload, {
timeout: config.timeout,
});
return response.data;
},
schemas: {
payload: check((data: unknown) => {
const schema = z.object({
requiredField: z.string().min(1, "Required field cannot be empty"),
optionalField: z.string().optional(),
});
return schema.parse(data);
}),
},
},
abortableRequest: {
resolver: async ({ config, extra }) => {
const response = await axios.get(`${config.baseURL}/slow-data`, {
timeout: config.timeout,
signal: extra?.signal,
});
return response.data;
},
},
});

const parseError = errorParser(errorTestApi);

describe("Error Handling and Network Failure Simulation", () => {
describe("Network Error Handling", () => {
it("should handle network connection errors", async () => {
const [success, error] = await errorTestApi.safeCall("networkError");

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("networkError", error);
        expect(parsedError.type).toBe("no_server_response");
        expect(parsedError.status).toBe(-3);
        expect(parsedError.message).toBe("No server response");
        expect(parsedError.rawError).toBeDefined();
      }
    });

    it("should handle timeout errors", async () => {
      const [success, error] = await errorTestApi.safeCall("slowEndpoint");

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("slowEndpoint", error);
        // With short timeout, this should be a timeout error
        expect(parsedError.status).toBeLessThan(0); // Browser error
        expect(parsedError.rawError).toBeDefined();
      }
    });

    it("should handle server errors (5xx)", async () => {
      const [success, error] = await errorTestApi.safeCall("serverError");

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("serverError", error);
        expect(parsedError.type).toBe("internal_server_error");
        expect(parsedError.status).toBe(500);
        expect(parsedError.message).toBe("Internal server error occurred");
      }
    });

});

describe("Validation Error Handling", () => {
it("should handle client-side validation errors", async () => {
expect(() => {
errorTestApi.payload("validationTest", {
requiredField: "", // Invalid: empty string
});
}).toThrow();
});

    it("should handle server-side validation errors", async () => {
      // Add a temporary handler for validation endpoint
      server.use(
        http.post("https://api.example.com/validation-test", () => {
          return HttpResponse.json(
            {
              type: "validation_error",
              status: 400,
              message: "Validation failed",
              meta: {
                issues: [
                  { path: ["requiredField"], message: "Field is required" }
                ]
              }
            },
            { status: 400 }
          );
        })
      );

      const payload = errorTestApi.payload("validationTest", {
        requiredField: "valid",
      });

      const [success, error] = await errorTestApi.safeCall("validationTest", { payload });

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("validationTest", error);
        expect(parsedError.type).toBe("validation_error");
        expect(parsedError.status).toBe(400);
        expect(parsedError.message).toBe("Validation failed");
      }
    });

});

describe("Request Abortion", () => {
it("should handle aborted requests", async () => {
// Add handler for slow data endpoint
server.use(
http.get("https://api.example.com/slow-data", async () => {
// Simulate a slow response
await new Promise(resolve => setTimeout(resolve, 2000));
return HttpResponse.json({ data: "slow data" });
})
);

      const controller = new AbortController();

      // Start the request
      const requestPromise = errorTestApi.safeCall("abortableRequest", {
        extra: { signal: controller.signal },
      });

      // Abort after 100ms
      setTimeout(() => controller.abort(), 100);

      const [success, error] = await requestPromise;

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("abortableRequest", error);
        expect(parsedError.type).toBe("aborted");
        expect(parsedError.status).toBe(0);
        expect(parsedError.message).toBe("Request aborted");
      }
    });

});

describe("Error Recovery Patterns", () => {
it("should implement retry logic with exponential backoff", async () => {
let attempts = 0;
const maxRetries = 3;
const baseDelay = 100;

      const retryWithBackoff = async <T>(
        operation: () => Promise<[boolean, T | unknown]>,
        retries = maxRetries
      ): Promise<[boolean, T | unknown]> => {
        attempts++;
        const [success, result] = await operation();

        if (success || retries === 0) {
          return [success, result];
        }

        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, maxRetries - retries);
        await new Promise(resolve => setTimeout(resolve, delay));

        return retryWithBackoff(operation, retries - 1);
      };

      // This will fail 3 times, then we'll check the attempts
      const [success] = await retryWithBackoff(() =>
        errorTestApi.safeCall("networkError")
      );

      expect(success).toBe(false);
      expect(attempts).toBe(maxRetries + 1); // Initial attempt + retries
    });

    it("should implement circuit breaker pattern", async () => {
      class CircuitBreaker {
        private failures = 0;
        private readonly threshold = 3;
        private readonly timeout = 1000;
        private nextAttempt = Date.now();
        private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

        async execute<T>(operation: () => Promise<[boolean, T | unknown]>): Promise<[boolean, T | unknown]> {
          if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
              return [false, new Error('Circuit breaker is OPEN')];
            } else {
              this.state = 'HALF_OPEN';
            }
          }

          const [success, result] = await operation();

          if (success) {
            this.onSuccess();
          } else {
            this.onFailure();
          }

          return [success, result];
        }

        private onSuccess() {
          this.failures = 0;
          this.state = 'CLOSED';
        }

        private onFailure() {
          this.failures++;
          if (this.failures >= this.threshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.timeout;
          }
        }

        getState() {
          return this.state;
        }
      }

      const circuitBreaker = new CircuitBreaker();

      // First 3 calls should fail and open the circuit
      for (let i = 0; i < 3; i++) {
        const [success] = await circuitBreaker.execute(() =>
          errorTestApi.safeCall("networkError")
        );
        expect(success).toBe(false);
      }

      expect(circuitBreaker.getState()).toBe('OPEN');

      // Next call should be rejected by circuit breaker
      const [success, result] = await circuitBreaker.execute(() =>
        errorTestApi.safeCall("networkError")
      );

      expect(success).toBe(false);
      expect(result).toBeInstanceOf(Error);
      expect((result as Error).message).toBe('Circuit breaker is OPEN');
    });

});

describe("Error Context and Debugging", () => {
it("should preserve original error information", async () => {
const [success, error] = await errorTestApi.safeCall("serverError");

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseError("serverError", error);

        // Check that raw error is preserved
        expect(parsedError.rawError).toBeDefined();
        expect(axios.isAxiosError(parsedError.rawError)).toBe(true);

        if (axios.isAxiosError(parsedError.rawError)) {
          expect(parsedError.rawError.response?.status).toBe(500);
          expect(parsedError.rawError.config?.url).toContain('/server-error');
        }
      }
    });

    it("should handle unsupported server response formats", async () => {
      // Add handler that returns invalid error format
      server.use(
        http.get("https://api.example.com/invalid-error-format", () => {
          return HttpResponse.json(
            { someField: "not a standard error format" },
            { status: 422 }
          );
        })
      );

      const testApi = init<ApiConfig>(config)<{
        invalidFormat: {
          dto: { message: string };
          error: { type: "custom_error"; status: 422; message: string };
        };
      }>()({
        invalidFormat: {
          resolver: async ({ config }) => {
            const response = await axios.get(`${config.baseURL}/invalid-error-format`, {
              timeout: config.timeout,
            });
            return response.data;
          },
        },
      });

      const parseErrorForTest = errorParser(testApi);
      const [success, error] = await testApi.safeCall("invalidFormat");

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseErrorForTest("invalidFormat", error);
        expect(parsedError.type).toBe("unsupported_server_response");
        expect(parsedError.status).toBe(-5);
        expect(parsedError.message).toBe("The server's error response format is unsupported.");

        if ('meta' in parsedError) {
          expect(parsedError.meta).toMatchObject({
            originalStatus: 422,
            originalResponse: { someField: "not a standard error format" },
          });
        }
      }
    });

});

describe("Real-world Error Scenarios", () => {
it("should handle intermittent connection issues", async () => {
let callCount = 0;

      // Override handler to simulate intermittent failures
      server.use(
        http.get("https://api.example.com/intermittent", () => {
          callCount++;
          if (callCount <= 2) {
            return HttpResponse.error(); // Network error
          }
          return HttpResponse.json({ message: "Success on third try" });
        })
      );

      const intermittentApi = init<ApiConfig>(config)<{
        intermittent: {
          dto: { message: string };
          error: { type: "network_error"; status: -3; message: string };
        };
      }>()({
        intermittent: {
          resolver: async ({ config }) => {
            const response = await axios.get(`${config.baseURL}/intermittent`, {
              timeout: config.timeout,
            });
            return response.data;
          },
        },
      });

      const parseErrorIntermittent = errorParser(intermittentApi);

      // First two calls should fail
      const [success1] = await intermittentApi.safeCall("intermittent");
      expect(success1).toBe(false);

      const [success2] = await intermittentApi.safeCall("intermittent");
      expect(success2).toBe(false);

      // Third call should succeed
      const [success3, result3] = await intermittentApi.safeCall("intermittent");
      expect(success3).toBe(true);
      if (success3) {
        expect(result3.message).toBe("Success on third try");
      }
    });

    it("should handle rate limiting scenarios", async () => {
      server.use(
        http.get("https://api.example.com/rate-limited", () => {
          return HttpResponse.json(
            {
              type: "rate_limit_exceeded",
              status: 429,
              message: "Too many requests",
              meta: {
                retryAfter: 1, // seconds
                limit: 100,
                remaining: 0,
              },
            },
            {
              status: 429,
              headers: {
                'Retry-After': '1',
                'X-RateLimit-Limit': '100',
                'X-RateLimit-Remaining': '0',
              },
            }
          );
        })
      );

      const rateLimitApi = init<ApiConfig>(config)<{
        rateLimited: {
          dto: { data: string };
          error: {
            type: "rate_limit_exceeded";
            status: 429;
            message: string;
            meta: { retryAfter: number; limit: number; remaining: number };
          };
        };
      }>()({
        rateLimited: {
          resolver: async ({ config }) => {
            const response = await axios.get(`${config.baseURL}/rate-limited`, {
              timeout: config.timeout,
            });
            return response.data;
          },
        },
      });

      const parseRateLimitError = errorParser(rateLimitApi);
      const [success, error] = await rateLimitApi.safeCall("rateLimited");

      expect(success).toBe(false);
      if (!success) {
        const parsedError = parseRateLimitError("rateLimited", error);
        expect(parsedError.type).toBe("rate_limit_exceeded");
        expect(parsedError.status).toBe(429);
        expect(parsedError.message).toBe("Too many requests");

        if ('meta' in parsedError) {
          expect(parsedError.meta).toMatchObject({
            retryAfter: 1,
            limit: 100,
            remaining: 0,
          });
        }
      }
    });

});
});
