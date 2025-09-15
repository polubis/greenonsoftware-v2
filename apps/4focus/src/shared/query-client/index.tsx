import { QueryClient } from "@tanstack/react-query";

let globalQueryClient: QueryClient | undefined = undefined;

const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Stale time: how long data is considered fresh
        staleTime: 5 * 60 * 1000, // 5 minutes
        // Cache time: how long unused data stays in cache
        gcTime: 10 * 60 * 1000, // 10 minutes
        // Retry failed requests
        retry: (failureCount, error) => {
          // Don't retry on 4xx errors
          if (
            error instanceof Error &&
            "status" in error &&
            typeof error.status === "number" &&
            error.status >= 400 &&
            error.status < 500
          ) {
            return false;
          }
          return failureCount < 3;
        },
        // Refetch on window focus
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  });
};

const getQueryClient = () => {
  if (typeof window === "undefined") {
    return createQueryClient();
  }

  if (!globalQueryClient) {
    globalQueryClient = createQueryClient();
  }

  return globalQueryClient;
};

export { getQueryClient };
export const queryClient = getQueryClient();
