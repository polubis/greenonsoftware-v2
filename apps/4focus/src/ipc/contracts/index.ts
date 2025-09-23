import { APIRouter } from "../../kernel/routing/api-router";
import { init } from "@/lib/clean-api-v2";
import { errorParser } from "@/lib/clean-api-v2/adapters/axios";
import z from "zod";
import { zodCheck } from "@/lib/clean-api-v2/adapters/zod";
import {
  getTasksSchema,
  getActiveFocusSessionSchema,
  updateFocusSessionSchema,
  updateFocusSessionRequestSchema,
  createTaskSchema,
} from "./schemas";

type Focus4Contracts = {
  getTasks: {
    extra: {
      signal: AbortSignal;
    };
    dto: z.infer<typeof getTasksSchema.dto>;
    error: z.infer<typeof getTasksSchema.error>;
  };
  createTask: {
    dto: z.infer<typeof createTaskSchema.dto>;
    error: z.infer<typeof createTaskSchema.error>;
    payload: z.infer<typeof createTaskSchema.payload>;
  };
  getActiveFocusSession: {
    extra: {
      signal: AbortSignal;
    };
    dto: z.infer<typeof getActiveFocusSessionSchema.dto>;
    error: z.infer<typeof getActiveFocusSessionSchema.error>;
  };
  updateFocusSession: {
    extra: {
      signal: AbortSignal;
    };
    payload: z.infer<typeof updateFocusSessionRequestSchema>;
    dto: z.infer<typeof updateFocusSessionSchema.dto>;
    error: z.infer<typeof updateFocusSessionSchema.error>;
  };
};

const contract = init();
const create = contract<Focus4Contracts>();

const focus4API = create({
  getTasks: {
    schemas: {
      dto: zodCheck(getTasksSchema.dto),
      error: zodCheck(getTasksSchema.error),
    },
    resolver: async ({ extra }) => {
      return fetch(APIRouter.getPath("tasks"), {
        signal: extra.signal,
      }).then((res) => res.json());
    },
  },
  createTask: {
    schemas: {
      dto: zodCheck(createTaskSchema.dto),
      error: zodCheck(createTaskSchema.error),
      payload: zodCheck(createTaskSchema.payload),
    },
    resolver: async ({ payload }) => {
      return fetch(APIRouter.getPath("tasks"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }).then((res) => res.json());
    },
  },
  getActiveFocusSession: {
    schemas: {
      dto: zodCheck(getActiveFocusSessionSchema.dto),
      error: zodCheck(getActiveFocusSessionSchema.error),
    },
    resolver: async ({ extra }) => {
      return fetch(APIRouter.getPath("focus-sessions"), {
        signal: extra.signal,
      }).then((res) => res.json());
    },
  },
  updateFocusSession: {
    schemas: {
      dto: zodCheck(updateFocusSessionSchema.dto),
      error: zodCheck(updateFocusSessionSchema.error),
    },
    resolver: async ({ extra, payload }) => {
      return fetch(APIRouter.getPath("focus-sessions"), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: extra.signal,
      }).then((res) => res.json());
    },
  },
});

const parseFocus4APIError = errorParser(focus4API);

export type { Focus4Contracts };
export { focus4API, parseFocus4APIError };
