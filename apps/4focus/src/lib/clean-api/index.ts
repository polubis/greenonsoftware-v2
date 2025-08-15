import type { AxiosRequestConfig } from "axios";
import axios from "axios";

type ErrorVariant<
  T extends string,
  TStatus extends number,
  TMeta = undefined,
> = TMeta extends undefined
  ? {
      type: T;
      status: TStatus;
      message: string;
    }
  : {
      type: T;
      status: TStatus;
      message: string;
      meta: TMeta;
    };

type CleanAPIContracts = Record<
  string,
  {
    dto: unknown;
    error: ErrorVariant<string, number>;
    payload?: unknown;
    pathParams?: Record<string, unknown>;
    searchParams?: Record<string, unknown>;
  }
>;

type CleanAPIMethod = "get" | "post" | "put" | "patch" | "delete";

type ExtractPathParams<TPath extends string> =
  TPath extends `${string}/:${infer P}/${infer R}`
    ? P | ExtractPathParams<`/${R}`>
    : TPath extends `${string}/:${infer P}`
      ? P
      : never;

type ParsedError<
  TContracts extends CleanAPIContracts,
  TKey extends keyof TContracts,
> = (TContracts[TKey]["error"] | CleanBrowserAPIError) & { rawError: unknown };

type ValidatedPath<TContract, TPath extends string> = TContract extends {
  pathParams: infer TPathParams;
}
  ? TPath extends `/${string}`
    ? [keyof TPathParams] extends [ExtractPathParams<TPath>]
      ? [ExtractPathParams<TPath>] extends [keyof TPathParams]
        ? TPath
        : `Path "${TPath}" has parameters not defined in contract.`
      : `Path "${TPath}" is missing parameters from contract.`
    : `Path "${TPath}" must start with a '/'.`
  : TPath extends `/${string}`
    ? ExtractPathParams<TPath> extends never
      ? TPath
      : `Path "${TPath}" has dynamic parameters, but no 'pathParams' are defined in the contract.`
    : `Path "${TPath}" must start with a '/'.`;

type CleanAPIBrowserConfig<
  TContracts extends CleanAPIContracts,
  TConfig extends {
    [K in keyof TContracts]: {
      method: CleanAPIMethod;
      path: string;
    };
  },
> = {
  [K in keyof TContracts]: {
    method: CleanAPIMethod;
    path: ValidatedPath<TContracts[K], TConfig[K]["path"]>;
  };
};

type CallArgs<
  TContracts extends CleanAPIContracts,
  TKey extends keyof TContracts,
> = TContracts[TKey] extends
  | { pathParams: unknown }
  | { searchParams: unknown }
  | { payload: unknown }
  ? [input: InferInput<TContracts, TContracts[TKey]>]
  : [];

type InferInput<
  TContracts extends CleanAPIContracts,
  TContract extends TContracts[keyof TContracts],
> = ("pathParams" extends keyof TContract
  ? { pathParams: TContract["pathParams"] }
  : unknown) &
  ("searchParams" extends keyof TContract
    ? { searchParams: TContract["searchParams"] }
    : unknown) &
  ("payload" extends keyof TContract
    ? { payload: TContract["payload"] }
    : unknown);

const applyPathParams = (
  path: string,
  pathParams?: Record<string, unknown>,
): string => {
  let finalPath = path;
  if (pathParams) {
    for (const paramKey in pathParams) {
      finalPath = finalPath.replace(
        `:${paramKey}`,
        String(pathParams[paramKey]),
      );
    }
  }
  return finalPath;
};

const contract =
  <TContracts extends CleanAPIContracts>() =>
  <
    TConfig extends {
      [K in keyof TContracts]: { method: CleanAPIMethod; path: string };
    },
  >(
    config: TConfig & CleanAPIBrowserConfig<TContracts, TConfig>,
  ) => {
    return config;
  };

type AbortedError = ErrorVariant<"aborted", 0>;
type ClientExceptionError = ErrorVariant<"client_exception", -1>;
type NoInternetError = ErrorVariant<"no_internet", -2>;
type NoServerResponseError = ErrorVariant<"no_server_response", -3>;
type ConfigurationIssueError = ErrorVariant<"configuration_issue", -4>;
type UnsupportedServerResponseError = ErrorVariant<
  "unsupported_server_response",
  -5,
  { originalStatus: number; originalResponse: unknown }
>;

type CleanBrowserAPIError =
  | AbortedError
  | ClientExceptionError
  | NoInternetError
  | NoServerResponseError
  | ConfigurationIssueError
  | UnsupportedServerResponseError;

const cleanAPIBrowser =
  <TContracts extends CleanAPIContracts>() =>
  <
    TConfig extends {
      [K in keyof TContracts]: { method: CleanAPIMethod; path: string };
    },
  >(
    config: TConfig & CleanAPIBrowserConfig<TContracts, TConfig>,
  ) => {
    const call = async <TKey extends keyof TContracts>(
      key: TKey,
      ...args: CallArgs<TContracts, TKey>
    ): Promise<TContracts[TKey]["dto"]> => {
      const input = args[0] as
        | {
            pathParams?: Record<string, unknown>;
            searchParams?: Record<string, unknown>;
            payload?: unknown;
          }
        | undefined;
      const contract = config[key];
      const finalPath = applyPathParams(contract.path, input?.pathParams);
      const axiosConfig: AxiosRequestConfig = { params: input?.searchParams };
      const type = config[key].method;

      switch (type) {
        case "get":
          return axios.get(finalPath, axiosConfig);
        case "post":
          return axios.post(finalPath, input?.payload, axiosConfig);
        case "put":
          return axios.put(finalPath, input?.payload, axiosConfig);
        case "patch":
          return axios.patch(finalPath, input?.payload, axiosConfig);
        case "delete":
          return axios.delete(finalPath, axiosConfig);
      }
    };

    const parseError = <TKey extends keyof TContracts>(
      _: TKey,
      error: unknown,
    ): ParsedError<TContracts, TKey> => {
      if (axios.isAxiosError(error)) {
        // Case 1: The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response) {
          const responseData = error.response.data as {
            message?: string;
            meta?: TContracts[TKey]["error"] extends { meta: infer TMeta }
              ? TMeta
              : never;
          };

          if (typeof responseData.message === "string") {
            const baseError = {
              status: error.response.status,
              type: error.response.statusText,
              message: responseData.message,
              rawError: error,
            };

            const result = {
              ...baseError,
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

    const safeCall = async <TKey extends keyof TContracts>(
      key: TKey,
      ...args: CallArgs<TContracts, TKey>
    ): Promise<
      | [true, TContracts[TKey]["dto"]]
      | [false, TContracts[TKey]["error"] | CleanBrowserAPIError]
    > => {
      try {
        const result = await call(key, ...args);
        return [true, result];
      } catch (error) {
        return [false, parseError(key, error)];
      }
    };

    return { call, safeCall, parseError };
  };

export type {
  CleanAPIBrowserConfig,
  CleanAPIContracts,
  ErrorVariant,
  InferInput,
};
export { cleanAPIBrowser, contract };
