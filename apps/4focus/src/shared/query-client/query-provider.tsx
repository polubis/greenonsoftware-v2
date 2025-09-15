import {
  QueryClientProvider,
  type QueryClientProviderProps,
} from "@tanstack/react-query";
import { queryClient } from "./query-client";

export const QueryProvider = ({
  children,
}: Pick<QueryClientProviderProps, "children">) => {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};
