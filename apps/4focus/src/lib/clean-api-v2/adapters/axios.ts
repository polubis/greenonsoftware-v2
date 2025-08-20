import axios from "axios";
import type {
  AbortedError,
  ClientExceptionError,
  ConfigurationIssueError,
  Contracts,
  NoInternetError,
  NoServerResponseError,
  ParsedError,
  UnsupportedServerResponseError,
  CleanApi,
} from "../models";

const errorParser =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  <TContracts extends Contracts>(api: CleanApi<TContracts>) =>
    <TKey extends keyof TContracts>(
      key: TKey,
      error: unknown,
    ): ParsedError<TContracts, TKey> => {
      if (axios.isAxiosError(error)) {
        // Case 1: The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response) {
          const responseData = error.response.data as {
            type?: TContracts[TKey]["error"] extends { type: infer TType }
              ? TType
              : never;
            status?: TContracts[TKey]["error"] extends { status: infer TStatus }
              ? TStatus
              : never;
            message?: string;
            meta?: TContracts[TKey]["error"] extends { meta: infer TMeta }
              ? TMeta
              : never;
          };

          if (
            typeof responseData.message === "string" &&
            typeof responseData.type === "string" &&
            typeof responseData.status === "number"
          ) {
            const result = {
              status: responseData.status,
              type: responseData.type,
              message: responseData.message,
              rawError: error,
              ...(responseData.meta ? { meta: responseData.meta } : {}),
            } as ParsedError<TContracts, TKey>;

            return result;
          }

          const result: UnsupportedServerResponseError & { rawError: unknown } =
            {
              status: -5,
              type: "unsupported_server_response",
              message: "The server's error response format is unsupported.",
              rawError: error,
              meta: {
                originalStatus: error.response.status,
                originalResponse: error.response.data,
              },
            };

          return result;
        }
        // Case 2: The request was made but no response was received.
        // This can happen due to network errors (e.g., the server is down, DNS issues).
        // `error.request` is an instance of XMLHttpRequest in the browser.
        else if (error.request) {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            const result: NoInternetError & { rawError: unknown } = {
              status: -2,
              type: "no_internet",
              message: "No internet connection",
              rawError: error,
            };

            return result;
          } else {
            const result: NoServerResponseError & { rawError: unknown } = {
              status: -3,
              type: "no_server_response",
              message: "No server response",
              rawError: error,
            };
            return result;
          }
        }
        // Case 3: Something happened in setting up the request that triggered an Error.
        // This could be a configuration issue, or an issue with the request itself before it was sent.
        else {
          const result: ConfigurationIssueError & { rawError: unknown } = {
            status: -4,
            type: "configuration_issue",
            message: "Error setting up the request",
            rawError: error,
          };
          return result;
        }
      } else if (axios.isCancel(error)) {
        const result: AbortedError & { rawError: unknown } = {
          status: 0,
          type: "aborted",
          message: "Request aborted",
          rawError: error,
        };
        return result;
      } else {
        const result: ClientExceptionError & { rawError: unknown } = {
          status: -1,
          type: "client_exception",
          message: "Client exception",
          rawError: error,
        };
        return result;
      }
    };

export { errorParser };
