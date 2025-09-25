import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import \* as z from "zod";
import axios from "axios";
import { init, check } from "../core";
import { errorParser } from "../adapters/axios";
import { server } from "./msw/server";
import { http, HttpResponse, delay } from "msw";

// Real-time data schemas
const NotificationSchema = z.object({
id: z.string(),
type: z.enum(["info", "warning", "error", "success"]),
title: z.string(),
message: z.string(),
timestamp: z.string(),
read: z.boolean(),
userId: z.string(),
});

const TaskStatusSchema = z.object({
id: z.string(),
status: z.enum(["pending", "in_progress", "completed", "failed"]),
progress: z.number().min(0).max(100),
lastUpdated: z.string(),
estimatedCompletion: z.string().optional(),
});

const SystemStatusSchema = z.object({
status: z.enum(["healthy", "degraded", "maintenance", "down"]),
uptime: z.number(),
lastCheck: z.string(),
services: z.array(z.object({
name: z.string(),
status: z.enum(["online", "offline", "degraded"]),
responseTime: z.number(),
})),
});

const MetricsSchema = z.object({
timestamp: z.string(),
cpu: z.number().min(0).max(100),
memory: z.number().min(0).max(100),
disk: z.number().min(0).max(100),
activeUsers: z.number().min(0),
requestsPerSecond: z.number().min(0),
});

// Real-time contracts
type RealtimeContracts = {
getNotifications: {
dto: { notifications: z.infer<typeof NotificationSchema>[] };
error: { type: "unauthorized"; status: 401; message: string };
searchParams?: {
since?: string;
limit?: number;
unreadOnly?: boolean;
};
extra: {
authorization: string;
};
};
markNotificationRead: {
dto: { success: boolean };
error: { type: "not_found"; status: 404; message: string };
pathParams: {
notificationId: string;
};
extra: {
authorization: string;
};
};
getTaskStatus: {
dto: { task: z.infer<typeof TaskStatusSchema> };
error: { type: "not_found"; status: 404; message: string };
pathParams: {
taskId: string;
};
};
getSystemStatus: {
dto: z.infer<typeof SystemStatusSchema>;
error: { type: "service_unavailable"; status: 503; message: string };
searchParams?: {};
};
getCurrentMetrics: {
dto: z.infer<typeof MetricsSchema>;
error: { type: "unauthorized"; status: 401; message: string };
extra: {
authorization: string;
};
};
getMetricsHistory: {
dto: { metrics: z.infer<typeof MetricsSchema>[] };
error: { type: "unauthorized"; status: 401; message: string };
searchParams: {
startTime: string;
endTime: string;
interval?: string;
};
extra: {
authorization: string;
};
};
startLongPolling: {
dto: { events: Array<{ type: string; data: unknown; timestamp: string; id: string }> };
error: { type: "timeout"; status: 408; message: string };
searchParams?: {
timeout?: number;
lastEventId?: string;
};
extra: {
authorization: string;
};
};
};

type ApiConfig = {
baseURL: string;
timeout: number;
pollingInterval: number;
};

const config: ApiConfig = {
baseURL: "https://api.example.com",
timeout: 30000, // Longer timeout for polling
pollingInterval: 1000, // 1 second default polling
};

// Mock data state that changes over time
class MockDataState {
private static instance: MockDataState;
private notifications: z.infer<typeof NotificationSchema>[] = [];
private taskStatuses: Map<string, z.infer<typeof TaskStatusSchema>> = new Map();
private systemStatus: z.infer<typeof SystemStatusSchema> = {
status: "healthy",
uptime: 0,
lastCheck: new Date().toISOString(),
services: [
{ name: "api", status: "online", responseTime: 150 },
{ name: "database", status: "online", responseTime: 25 },
{ name: "cache", status: "online", responseTime: 5 },
],
};
private metrics: z.infer<typeof MetricsSchema>[] = [];
private events: Array<{ type: string; data: unknown; timestamp: string; id: string }> = [];

static getInstance(): MockDataState {
if (!MockDataState.instance) {
MockDataState.instance = new MockDataState();
}
return MockDataState.instance;
}

addNotification(notification: Omit<z.infer<typeof NotificationSchema>, "id" | "timestamp">) {
const newNotification: z.infer<typeof NotificationSchema> = {
...notification,
id: `notif-${Date.now()}`,
timestamp: new Date().toISOString(),
};
this.notifications.unshift(newNotification);
this.addEvent("notification", newNotification);
}

getNotifications(since?: string, limit = 50, unreadOnly = false): z.infer<typeof NotificationSchema>[] {
let filtered = this.notifications;

    if (since) {
      filtered = filtered.filter(n => n.timestamp > since);
    }

    if (unreadOnly) {
      filtered = filtered.filter(n => !n.read);
    }

    return filtered.slice(0, limit);

}

markNotificationRead(id: string): boolean {
const notification = this.notifications.find(n => n.id === id);
if (notification) {
notification.read = true;
return true;
}
return false;
}

updateTaskStatus(taskId: string, updates: Partial<z.infer<typeof TaskStatusSchema>>) {
const existing = this.taskStatuses.get(taskId) || {
id: taskId,
status: "pending" as const,
progress: 0,
lastUpdated: new Date().toISOString(),
};

    const updated = { ...existing, ...updates, lastUpdated: new Date().toISOString() };
    this.taskStatuses.set(taskId, updated);
    this.addEvent("task_update", updated);

}

getTaskStatus(taskId: string): z.infer<typeof TaskStatusSchema> | undefined {
return this.taskStatuses.get(taskId);
}

updateSystemStatus(updates: Partial<z.infer<typeof SystemStatusSchema>>) {
this.systemStatus = {
...this.systemStatus,
...updates,
lastCheck: new Date().toISOString(),
};
this.addEvent("system_status", this.systemStatus);
}

getSystemStatus(): z.infer<typeof SystemStatusSchema> {
return { ...this.systemStatus };
}

addMetrics(metrics: Omit<z.infer<typeof MetricsSchema>, "timestamp">) {
const newMetrics: z.infer<typeof MetricsSchema> = {
...metrics,
timestamp: new Date().toISOString(),
};
this.metrics.push(newMetrics);

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    this.addEvent("metrics", newMetrics);

}

getCurrentMetrics(): z.infer<typeof MetricsSchema> | undefined {
return this.metrics[this.metrics.length - 1];
}

getMetricsHistory(startTime: string, endTime: string): z.infer<typeof MetricsSchema>[] {
return this.metrics.filter(m => m.timestamp >= startTime && m.timestamp <= endTime);
}

private addEvent(type: string, data: unknown) {
const event = {
type,
data,
timestamp: new Date().toISOString(),
id: `event-${Date.now()}-${Math.random()}`,
};
this.events.push(event);

    // Keep only last 50 events
    if (this.events.length > 50) {
      this.events = this.events.slice(-50);
    }

}

getEventsSince(lastEventId?: string): typeof this.events {
if (!lastEventId) {
return [...this.events];
}

    const lastIndex = this.events.findIndex(e => e.id === lastEventId);
    return lastIndex >= 0 ? this.events.slice(lastIndex + 1) : [...this.events];

}

reset() {
this.notifications = [];
this.taskStatuses.clear();
this.metrics = [];
this.events = [];
this.systemStatus = {
status: "healthy",
uptime: 0,
lastCheck: new Date().toISOString(),
services: [
{ name: "api", status: "online", responseTime: 150 },
{ name: "database", status: "online", responseTime: 25 },
{ name: "cache", status: "online", responseTime: 5 },
],
};
}
}

const realtimeApi = init<ApiConfig>(config)<RealtimeContracts>()({
getNotifications: {
resolver: async ({ searchParams, extra, config }) => {
const params = new URLSearchParams();
if (searchParams?.since) params.append("since", searchParams.since);
if (searchParams?.limit) params.append("limit", searchParams.limit.toString());
if (searchParams?.unreadOnly) params.append("unreadOnly", searchParams.unreadOnly.toString());

      const response = await axios.get(`${config.baseURL}/notifications?${params}`, {
        headers: { Authorization: extra.authorization },
        timeout: config.timeout,
      });
      return response.data;
    },
    schemas: {
      searchParams: check((data: unknown) => {
        const schema = z.object({
          since: z.string().optional(),
          limit: z.number().optional(),
          unreadOnly: z.boolean().optional(),
        });
        return schema.parse(data);
      }),
    },

},
markNotificationRead: {
resolver: async ({ pathParams, extra, config }) => {
const response = await axios.put(
`${config.baseURL}/notifications/${pathParams.notificationId}/read`,
{},
{
headers: { Authorization: extra.authorization },
timeout: config.timeout,
}
);
return response.data;
},
},
getTaskStatus: {
resolver: async ({ pathParams, config }) => {
const response = await axios.get(`${config.baseURL}/tasks/${pathParams.taskId}/status`, {
timeout: config.timeout,
});
return response.data;
},
},
getSystemStatus: {
resolver: async ({ config }) => {
const response = await axios.get(`${config.baseURL}/system/status`, {
timeout: config.timeout,
});
return response.data;
},
},
getCurrentMetrics: {
resolver: async ({ extra, config }) => {
const response = await axios.get(`${config.baseURL}/metrics/current`, {
headers: { Authorization: extra.authorization },
timeout: config.timeout,
});
return response.data;
},
},
getMetricsHistory: {
resolver: async ({ searchParams, extra, config }) => {
const params = new URLSearchParams();
params.append("startTime", searchParams.startTime);
params.append("endTime", searchParams.endTime);
if (searchParams.interval) params.append("interval", searchParams.interval);

      const response = await axios.get(`${config.baseURL}/metrics/history?${params}`, {
        headers: { Authorization: extra.authorization },
        timeout: config.timeout,
      });
      return response.data;
    },

},
startLongPolling: {
resolver: async ({ searchParams, extra, config }) => {
const params = new URLSearchParams();
if (searchParams?.timeout) params.append("timeout", searchParams.timeout.toString());
if (searchParams?.lastEventId) params.append("lastEventId", searchParams.lastEventId);

      const response = await axios.get(`${config.baseURL}/events/poll?${params}`, {
        headers: { Authorization: extra.authorization },
        timeout: (searchParams?.timeout || 30) * 1000,
      });
      return response.data;
    },

},
});

const parseError = errorParser(realtimeApi);

// Add real-time endpoints to MSW
const mockState = MockDataState.getInstance();

server.use(
// Notifications endpoint
http.get("https://api.example.com/notifications", async ({ request }) => {
await delay(100);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        { type: "unauthorized", status: 401, message: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const since = url.searchParams.get("since") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";

    const notifications = mockState.getNotifications(since, limit, unreadOnly);
    return HttpResponse.json({ notifications });

}),

// Mark notification as read
http.put("https://api.example.com/notifications/:notificationId/read", async ({ params }) => {
await delay(50);

    const success = mockState.markNotificationRead(params.notificationId as string);
    if (!success) {
      return HttpResponse.json(
        { type: "not_found", status: 404, message: "Notification not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json({ success: true });

}),

// Task status endpoint
http.get("https://api.example.com/tasks/:taskId/status", async ({ params }) => {
await delay(150);

    const task = mockState.getTaskStatus(params.taskId as string);
    if (!task) {
      return HttpResponse.json(
        { type: "not_found", status: 404, message: "Task not found" },
        { status: 404 }
      );
    }

    return HttpResponse.json({ task });

}),

// System status endpoint
http.get("https://api.example.com/system/status", async () => {
await delay(100);

    const status = mockState.getSystemStatus();
    return HttpResponse.json(status);

}),

// Current metrics endpoint
http.get("https://api.example.com/metrics/current", async ({ request }) => {
await delay(100);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        { type: "unauthorized", status: 401, message: "Authentication required" },
        { status: 401 }
      );
    }

    const metrics = mockState.getCurrentMetrics();
    if (!metrics) {
      // Generate initial metrics if none exist
      mockState.addMetrics({
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        disk: Math.random() * 100,
        activeUsers: Math.floor(Math.random() * 1000),
        requestsPerSecond: Math.random() * 500,
      });
      return HttpResponse.json(mockState.getCurrentMetrics()!);
    }

    return HttpResponse.json(metrics);

}),

// Metrics history endpoint
http.get("https://api.example.com/metrics/history", async ({ request }) => {
await delay(200);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        { type: "unauthorized", status: 401, message: "Authentication required" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const startTime = url.searchParams.get("startTime")!;
    const endTime = url.searchParams.get("endTime")!;

    const metrics = mockState.getMetricsHistory(startTime, endTime);
    return HttpResponse.json({ metrics });

}),

// Long polling endpoint
http.get("https://api.example.com/events/poll", async ({ request }) => {
const url = new URL(request.url);
const timeout = parseInt(url.searchParams.get("timeout") || "30");
const lastEventId = url.searchParams.get("lastEventId") || undefined;

    // Simulate waiting for events
    await delay(Math.min(timeout * 100, 3000)); // Shorter delay for testing

    const events = mockState.getEventsSince(lastEventId);
    return HttpResponse.json({ events });

})
);

describe("Real-time Data and Polling with MSW", () => {
beforeEach(() => {
// Reset mock state before each test
mockState.reset();
vi.clearAllTimers();
vi.useFakeTimers();
});

afterEach(() => {
vi.useRealTimers();
});

describe("Notifications", () => {
it("should fetch initial notifications", async () => {
// Add some mock notifications
mockState.addNotification({
type: "info",
title: "Welcome",
message: "Welcome to the system",
read: false,
userId: "user1",
});
mockState.addNotification({
type: "warning",
title: "Update Available",
message: "A new version is available",
read: false,
userId: "user1",
});

      const extra = realtimeApi.extra("getNotifications", {
        authorization: "Bearer valid-token",
      });
      const result = await realtimeApi.call("getNotifications", { extra, searchParams: {} });

      expect(result.notifications).toHaveLength(2);
      expect(result.notifications[0].type).toBe("warning"); // Most recent first
      expect(result.notifications[1].type).toBe("info");
    });

    it("should fetch notifications since specific timestamp", async () => {
      const baseTime = new Date("2024-01-01T00:00:00Z");

      // Add notification at base time
      mockState.addNotification({
        type: "info",
        title: "Old notification",
        message: "This is old",
        read: false,
        userId: "user1",
      });

      // Advance time and add new notification
      vi.advanceTimersByTime(60000); // 1 minute
      mockState.addNotification({
        type: "success",
        title: "New notification",
        message: "This is new",
        read: false,
        userId: "user1",
      });

      const since = new Date(baseTime.getTime() + 30000).toISOString(); // 30 seconds after base
      const searchParams = realtimeApi.searchParams("getNotifications", { since });
      const extra = realtimeApi.extra("getNotifications", {
        authorization: "Bearer valid-token",
      });

      const result = await realtimeApi.call("getNotifications", { searchParams, extra });

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].title).toBe("New notification");
    });

    it("should mark notification as read", async () => {
      mockState.addNotification({
        type: "info",
        title: "Test",
        message: "Test message",
        read: false,
        userId: "user1",
      });

      const notifications = mockState.getNotifications();
      const notificationId = notifications[0].id;

      const pathParams = realtimeApi.pathParams("markNotificationRead", { notificationId });
      const extra = realtimeApi.extra("markNotificationRead", {
        authorization: "Bearer valid-token",
      });

      const result = await realtimeApi.call("markNotificationRead", { pathParams, extra });

      expect(result.success).toBe(true);

      // Verify notification is marked as read
      const updatedNotifications = mockState.getNotifications();
      expect(updatedNotifications[0].read).toBe(true);
    });

});

describe("Task Status Monitoring", () => {
it("should monitor task progress over time", async () => {
const taskId = "task-123";

      // Initial task status
      mockState.updateTaskStatus(taskId, {
        status: "pending",
        progress: 0,
      });

      const pathParams = realtimeApi.pathParams("getTaskStatus", { taskId });

      // Check initial status
      let result = await realtimeApi.call("getTaskStatus", { pathParams });
      expect(result.task.status).toBe("pending");
      expect(result.task.progress).toBe(0);

      // Simulate task progress
      mockState.updateTaskStatus(taskId, {
        status: "in_progress",
        progress: 25,
      });

      result = await realtimeApi.call("getTaskStatus", { pathParams });
      expect(result.task.status).toBe("in_progress");
      expect(result.task.progress).toBe(25);

      // Complete the task
      mockState.updateTaskStatus(taskId, {
        status: "completed",
        progress: 100,
      });

      result = await realtimeApi.call("getTaskStatus", { pathParams });
      expect(result.task.status).toBe("completed");
      expect(result.task.progress).toBe(100);
    });

    it("should implement polling for task status", async () => {
      const taskId = "polling-task";
      const statusUpdates: string[] = [];

      // Start with pending status
      mockState.updateTaskStatus(taskId, {
        status: "pending",
        progress: 0,
      });

      // Polling function
      const pollTaskStatus = async () => {
        const pathParams = realtimeApi.pathParams("getTaskStatus", { taskId });
        const result = await realtimeApi.call("getTaskStatus", { pathParams });
        statusUpdates.push(result.task.status);
        return result.task;
      };

      // Start polling
      const pollingPromise = (async () => {
        while (statusUpdates.length < 4) {
          await pollTaskStatus();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      })();

      // Simulate status changes
      setTimeout(() => {
        mockState.updateTaskStatus(taskId, { status: "in_progress", progress: 25 });
      }, 600);

      setTimeout(() => {
        mockState.updateTaskStatus(taskId, { status: "in_progress", progress: 75 });
      }, 1200);

      setTimeout(() => {
        mockState.updateTaskStatus(taskId, { status: "completed", progress: 100 });
      }, 1800);

      // Advance timers to trigger the polling
      vi.advanceTimersByTime(2000);
      await pollingPromise;

      expect(statusUpdates).toEqual(["pending", "in_progress", "in_progress", "completed"]);
    });

});

describe("System Status Monitoring", () => {
it("should get system status", async () => {
const result = await realtimeApi.call("getSystemStatus", { searchParams: {} });

      expect(result).toMatchObject({
        status: "healthy",
        uptime: expect.any(Number),
        lastCheck: expect.any(String),
        services: expect.arrayContaining([
          expect.objectContaining({
            name: expect.any(String),
            status: expect.stringMatching(/^(online|offline|degraded)$/),
            responseTime: expect.any(Number),
          }),
        ]),
      });
    });

    it("should monitor system status changes", async () => {
      // Initial healthy status
      let result = await realtimeApi.call("getSystemStatus");
      expect(result.status).toBe("healthy");

      // Simulate status degradation
      mockState.updateSystemStatus({
        status: "degraded",
        services: [
          { name: "api", status: "online", responseTime: 150 },
          { name: "database", status: "degraded", responseTime: 250 },
          { name: "cache", status: "online", responseTime: 5 },
        ],
      });

      result = await realtimeApi.call("getSystemStatus", { searchParams: {} });
      expect(result.status).toBe("degraded");
      expect(result.services.find(s => s.name === "database")?.status).toBe("degraded");
    });

});

describe("Metrics Collection", () => {
it("should get current metrics", async () => {
const extra = realtimeApi.extra("getCurrentMetrics", {
authorization: "Bearer valid-token",
});

      const result = await realtimeApi.call("getCurrentMetrics", { extra });

      expect(result).toMatchObject({
        timestamp: expect.any(String),
        cpu: expect.any(Number),
        memory: expect.any(Number),
        disk: expect.any(Number),
        activeUsers: expect.any(Number),
        requestsPerSecond: expect.any(Number),
      });
    });

    it("should get metrics history", async () => {
      // Add some historical metrics
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      for (let i = 0; i < 5; i++) {
        const timestamp = new Date(oneHourAgo.getTime() + i * 10 * 60 * 1000); // 10-minute intervals
        mockState.addMetrics({
          cpu: 50 + i * 10,
          memory: 60 + i * 5,
          disk: 30,
          activeUsers: 100 + i * 20,
          requestsPerSecond: 50 + i * 10,
        });
      }

      const searchParams = realtimeApi.searchParams("getMetricsHistory", {
        startTime: oneHourAgo.toISOString(),
        endTime: now.toISOString(),
        interval: "10m",
      });
      const extra = realtimeApi.extra("getMetricsHistory", {
        authorization: "Bearer valid-token",
      });

      const result = await realtimeApi.call("getMetricsHistory", { searchParams, extra });

      expect(result.metrics).toHaveLength(5);
      expect(result.metrics[0].cpu).toBe(50);
      expect(result.metrics[4].cpu).toBe(90);
    });

    it("should implement continuous metrics polling", async () => {
      const metricsHistory: number[] = [];
      let pollCount = 0;

      const pollMetrics = async () => {
        const extra = realtimeApi.extra("getCurrentMetrics", {
          authorization: "Bearer valid-token",
        });
        const result = await realtimeApi.call("getCurrentMetrics", { extra });
        metricsHistory.push(result.cpu);
        pollCount++;
      };

      // Start continuous polling
      const pollingInterval = setInterval(async () => {
        if (pollCount < 3) {
          await pollMetrics();
          // Simulate changing metrics
          mockState.addMetrics({
            cpu: 50 + pollCount * 20,
            memory: 60,
            disk: 30,
            activeUsers: 100,
            requestsPerSecond: 50,
          });
        } else {
          clearInterval(pollingInterval);
        }
      }, 1000);

      // Wait for polling to complete
      vi.advanceTimersByTime(4000);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(metricsHistory).toHaveLength(3);
      expect(metricsHistory[0]).toBeGreaterThan(0);
      expect(metricsHistory[1]).toBeGreaterThan(metricsHistory[0]);
    });

});

describe("Long Polling", () => {
it("should implement long polling for events", async () => {
// Start long polling
const extra = realtimeApi.extra("startLongPolling", {
authorization: "Bearer valid-token",
});
const searchParams = realtimeApi.searchParams("startLongPolling", {
timeout: 5,
});

      // Generate some events after a delay
      setTimeout(() => {
        mockState.addNotification({
          type: "info",
          title: "Real-time notification",
          message: "This came through long polling",
          read: false,
          userId: "user1",
        });
      }, 100);

      const result = await realtimeApi.call("startLongPolling", { searchParams, extra });

      expect(result.events).toBeInstanceOf(Array);
      expect(result.events.length).toBeGreaterThan(0);
      expect(result.events[0]).toMatchObject({
        type: expect.any(String),
        data: expect.any(Object),
        timestamp: expect.any(String),
        id: expect.any(String),
      });
    });

    it("should handle incremental updates with last event ID", async () => {
      // Generate initial events
      mockState.addNotification({
        type: "info",
        title: "Event 1",
        message: "First event",
        read: false,
        userId: "user1",
      });

      // First poll to get initial events
      const extra = realtimeApi.extra("startLongPolling", {
        authorization: "Bearer valid-token",
      });

      const firstResult = await realtimeApi.call("startLongPolling", { extra });
      const lastEventId = firstResult.events[firstResult.events.length - 1]?.id;

      // Generate new events
      mockState.addNotification({
        type: "success",
        title: "Event 2",
        message: "Second event",
        read: false,
        userId: "user1",
      });

      // Second poll with last event ID
      const searchParams = realtimeApi.searchParams("startLongPolling", {
        lastEventId,
        timeout: 5,
      });

      const secondResult = await realtimeApi.call("startLongPolling", { searchParams, extra });

      // Should only get new events
      expect(secondResult.events.length).toBe(1);
      expect(secondResult.events[0].data).toMatchObject({
        title: "Event 2",
      });
    });

});

describe("Real-time Helper Classes", () => {
it("should implement a real-time data manager", async () => {
class RealtimeDataManager {
private intervals: NodeJS.Timeout[] = [];
private subscribers: Map<string, Array<(data: any) => void>> = new Map();

        startPolling<TKey extends keyof RealtimeContracts>(
          endpoint: TKey,
          params: Parameters<typeof realtimeApi.call>[1],
          interval: number,
          onUpdate: (data: any) => void
        ) {
          const poll = async () => {
            const [success, result] = await realtimeApi.safeCall(endpoint, params);
            if (success) {
              onUpdate(result);
            }
          };

          // Initial poll
          poll();

          // Set up interval
          const intervalId = setInterval(poll, interval);
          this.intervals.push(intervalId);

          return () => clearInterval(intervalId);
        }

        subscribe(event: string, callback: (data: any) => void) {
          if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
          }
          this.subscribers.get(event)!.push(callback);

          return () => {
            const callbacks = this.subscribers.get(event);
            if (callbacks) {
              const index = callbacks.indexOf(callback);
              if (index > -1) {
                callbacks.splice(index, 1);
              }
            }
          };
        }

        emit(event: string, data: any) {
          const callbacks = this.subscribers.get(event);
          if (callbacks) {
            callbacks.forEach(callback => callback(data));
          }
        }

        cleanup() {
          this.intervals.forEach(clearInterval);
          this.intervals = [];
          this.subscribers.clear();
        }
      }

      const manager = new RealtimeDataManager();
      const updates: any[] = [];

      // Set up task status polling
      const stopPolling = manager.startPolling(
        "getTaskStatus",
        { pathParams: realtimeApi.pathParams("getTaskStatus", { taskId: "test-task" }) },
        500,
        (data) => updates.push(data.task.status)
      );

      // Initialize task
      mockState.updateTaskStatus("test-task", {
        status: "pending",
        progress: 0,
      });

      // Simulate status changes
      setTimeout(() => {
        mockState.updateTaskStatus("test-task", {
          status: "in_progress",
          progress: 50,
        });
      }, 600);

      setTimeout(() => {
        mockState.updateTaskStatus("test-task", {
          status: "completed",
          progress: 100,
        });
      }, 1200);

      // Run for 1.5 seconds
      vi.advanceTimersByTime(1500);
      await new Promise(resolve => setTimeout(resolve, 100));

      stopPolling();
      manager.cleanup();

      expect(updates.length).toBeGreaterThan(2);
      expect(updates).toContain("pending");
      expect(updates).toContain("in_progress");
      expect(updates).toContain("completed");
    });

});
});
