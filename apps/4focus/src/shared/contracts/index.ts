import { APIRouter } from "../routing/api-router";
import { init } from "@/lib/clean-api-v2";
import { errorParser } from "@/lib/clean-api-v2/adapters/axios";
import z from "zod";
import { zodCheck } from "@/lib/clean-api-v2/adapters/zod";
import { getTasksSchema } from "./schemas";

type Focus4Contracts = {
  getTasks: {
    extra: {
      signal: AbortSignal;
    };
    dto: z.infer<typeof getTasksSchema.dto>;
    error: z.infer<typeof getTasksSchema.error>;
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
});

const parseFocus4APIError = errorParser(focus4API);

export type { Focus4Contracts };
export { focus4API, parseFocus4APIError };
