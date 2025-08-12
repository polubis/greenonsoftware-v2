/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { isAxiosError, type AxiosRequestConfig } from "axios";

/**
 * A base type defining the shape of an API contract.
 * - `dto`: The data transfer object returned on a successful response.
 * - `error`: The shape of the error object on a failed response.
 * - `payload`: The shape of the request body (for POST, PUT, PATCH).
 * - `pathParams`: A record of parameters to be substituted into the URL path.
 * - `searchParams`: A record of parameters to be added as a query string.
 */
type CleanAPIContracts = Record<
  string,
  {
    dto: any;
    error: any;
    payload?: any;
    pathParams?: Record<string, any>;
    searchParams?: Record<string, any>;
  }
>;

/**
 * The configuration object mapping contract keys to their HTTP method and path.
 * The path should use colon-prefixed placeholders for path parameters (e.g., "/api/users/:id").
 */
type ClientAPIBrowserConfig<TContracts extends CleanAPIContracts> = {
  [K in keyof TContracts]: {
    method: "get" | "post" | "put" | "patch" | "delete";
    path: string;
  };
};

/**
 * Creates a type-safe API client for browser environments based on a contract definition.
 * @param config An object mapping contract keys to their HTTP method and path.
 */
const cleanAPIBrowser = <TContracts extends CleanAPIContracts>(
  config: ClientAPIBrowserConfig<TContracts>
) => {
  // Utility type for GET or DELETE requests (no request body).
  type QueryInput<TContract extends TContracts[keyof TContracts]> =
    ("pathParams" extends keyof TContract
      ? { pathParams: TContract["pathParams"] }
      : unknown) &
      ("searchParams" extends keyof TContract
        ? { searchParams: TContract["searchParams"] }
        : unknown);

  // Utility type for POST, PUT, or PATCH requests (may include a request body).
  type BodyRequestInput<TContract extends TContracts[keyof TContracts]> =
    ("pathParams" extends keyof TContract
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
    pathParams?: Record<string, any>
  ): string => {
    let finalPath = path;
    if (pathParams) {
      for (const paramKey in pathParams) {
        finalPath = finalPath.replace(
          `:${paramKey}`,
          String(pathParams[paramKey])
        );
      }
    }
    return finalPath;
  };

  const get = <TKey extends keyof TContracts>(
    key: TKey,
    ...args: TContracts[TKey] extends
      | { pathParams: any }
      | { searchParams: any }
      ? [input: QueryInput<TContracts[TKey]>]
      : []
  ): Promise<TContracts[TKey]["dto"]> => {
    const input = args[0] as
      | { pathParams?: Record<string, any>; searchParams?: Record<string, any> }
      | undefined;
    const contract = config[key];
    const finalPath = applyPathParams(contract.path, input?.pathParams);
    const axiosConfig: AxiosRequestConfig = { params: input?.searchParams };

    return axios.get(finalPath, axiosConfig);
  };

  const post = <TKey extends keyof TContracts>(
    key: TKey,
    ...args: TContracts[TKey] extends
      | { pathParams: any }
      | { searchParams: any }
      | { payload: any }
      ? [input: BodyRequestInput<TContracts[TKey]>]
      : []
  ): Promise<TContracts[TKey]["dto"]> => {
    const input = args[0] as
      | {
          pathParams?: Record<string, any>;
          searchParams?: Record<string, any>;
          payload?: any;
        }
      | undefined;
    const contract = config[key];
    const finalPath = applyPathParams(contract.path, input?.pathParams);
    const axiosConfig: AxiosRequestConfig = { params: input?.searchParams };

    return axios.post(finalPath, input?.payload, axiosConfig);
  };

  const put = <TKey extends keyof TContracts>(
    key: TKey,
    ...args: TContracts[TKey] extends
      | { pathParams: any }
      | { searchParams: any }
      | { payload: any }
      ? [input: BodyRequestInput<TContracts[TKey]>]
      : []
  ): Promise<TContracts[TKey]["dto"]> => {
    const input = args[0] as
      | {
          pathParams?: Record<string, any>;
          searchParams?: Record<string, any>;
          payload?: any;
        }
      | undefined;
    const contract = config[key];
    const finalPath = applyPathParams(contract.path, input?.pathParams);
    const axiosConfig: AxiosRequestConfig = { params: input?.searchParams };

    return axios.put(finalPath, input?.payload, axiosConfig);
  };

  const patch = <TKey extends keyof TContracts>(
    key: TKey,
    ...args: TContracts[TKey] extends
      | { pathParams: any }
      | { searchParams: any }
      | { payload: any }
      ? [input: BodyRequestInput<TContracts[TKey]>]
      : []
  ): Promise<TContracts[TKey]["dto"]> => {
    const input = args[0] as
      | {
          pathParams?: Record<string, any>;
          searchParams?: Record<string, any>;
          payload?: any;
        }
      | undefined;
    const contract = config[key];
    const finalPath = applyPathParams(contract.path, input?.pathParams);
    const axiosConfig: AxiosRequestConfig = { params: input?.searchParams };

    return axios.patch(finalPath, input?.payload, axiosConfig);
  };

  const del = <TKey extends keyof TContracts>(
    key: TKey,
    ...args: TContracts[TKey] extends
      | { pathParams: any }
      | { searchParams: any }
      ? [input: QueryInput<TContracts[TKey]>]
      : []
  ): Promise<TContracts[TKey]["dto"]> => {
    const input = args[0] as
      | { pathParams?: Record<string, any>; searchParams?: Record<string, any> }
      | undefined;
    const contract = config[key];
    const finalPath = applyPathParams(contract.path, input?.pathParams);
    const axiosConfig: AxiosRequestConfig = { params: input?.searchParams };

    return axios.delete(finalPath, axiosConfig);
  };

  /**
   * Safely parses an error from a catch block, inferring its type from the contract.
   * @param key The contract key corresponding to the API endpoint that was called.
   * @param error The `unknown` error object caught in a try/catch block.
   * @returns The correctly typed error object if it's a recognized API error, otherwise `null`.
   */
  const parseError = <TKey extends keyof TContracts>(
    _: TKey, // This key is used purely for TypeScript to infer the correct error type.
    error: unknown
  ): TContracts[TKey]["error"] | null => {
    // Check if it's an Axios error containing a response from the server.
    if (isAxiosError(error) && error.response?.data) {
      const errorData = error.response.data;

      // NOTE: This is a basic runtime check. For production-grade safety,
      // you would use a schema validation library like Zod here to rigorously
      // parse `errorData` against the expected error schema.
      if (typeof errorData === 'object' && errorData !== null) {
        // If the data is an object, we can reasonably cast it.
        return errorData as TContracts[TKey]["error"];
      }
    }
    // If the error isn't an Axios error or doesn't have the expected data, return null.
    return null;
  };

  return {
    get,
    post,
    put,
    patch,
    delete: del,
    parseError,
  };
};

export { cleanAPIBrowser };
export type { CleanAPIContracts, ClientAPIBrowserConfig };