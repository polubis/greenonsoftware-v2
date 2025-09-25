import {
  QueryClient,
  QueryClientProvider,
  type QueryClientProviderProps,
} from "@tanstack/react-query";

const createClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: (failureCount) => {
          return failureCount < 3;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
      },
    },
  });
};

const client = createClient();

const QueryProvider = ({
  children,
}: Pick<QueryClientProviderProps, "children">) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

export { QueryProvider };
