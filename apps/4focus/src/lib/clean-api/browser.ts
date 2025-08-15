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
    ? TPath
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

type CleanBrowserAPIError =
  | ErrorVariant<"aborted", 0>
  | ErrorVariant<"client_exception", -1>
  | ErrorVariant<"no_internet", -2>
  | ErrorVariant<"no_server_response", -3>
  | ErrorVariant<"configuration_issue", -4>;

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
          const result = {
            status: error.response.status,
            type: error.response.statusText,
            message: error.response.data.message,
            rawError: error,
            meta: error.response.data,
          } as ParsedError<TContracts, TKey>;
          return result;
        }
        // Case 2: The request was made but no response was received.
        // This can happen due to network errors (e.g., the server is down, DNS issues).
        // `error.request` is an instance of XMLHttpRequest in the browser.
        else if (error.request) {
          if (typeof navigator !== "undefined" && !navigator.onLine) {
            const result: Extract<
              ParsedError<TContracts, TKey>,
              { type: "no_internet" }
            > = {
              status: -2,
              type: "no_internet",
              message: "No internet connection",
              rawError: error,
            };

            return result;
          } else {
            const result: Extract<
              ParsedError<TContracts, TKey>,
              { type: "no_server_response" }
            > = {
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
          const result: Extract<
            ParsedError<TContracts, TKey>,
            { type: "configuration_issue" }
          > = {
            status: -4,
            type: "configuration_issue",
            message: "Error setting up the request",
            rawError: error,
          };
          return result;
        }
      } else if (axios.isCancel(error)) {
        const result: Extract<
          ParsedError<TContracts, TKey>,
          { type: "aborted" }
        > = {
          status: 0,
          type: "aborted",
          message: "Request aborted",
          rawError: error,
        };
        return result;
      } else {
        const result: Extract<
          ParsedError<TContracts, TKey>,
          { type: "client_exception" }
        > = {
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
export { cleanAPIBrowser };
