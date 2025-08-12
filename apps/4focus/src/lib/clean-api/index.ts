type ErrorVariant<
  T extends string,
  TCode extends number,
  TMessage extends string,
> = {
  type: T;
  code: TCode;
  message: TMessage;
};

type APIError =
  | ErrorVariant<"bad_request", 400, string>
  | ErrorVariant<"unauthorized", 401, string>
  | ErrorVariant<"forbidden", 403, string>
  | ErrorVariant<"unprocessable_entity", 422, string>
  | ErrorVariant<"internal_server_error", 500, string>
  | ErrorVariant<"client_error", 0, string>;

type ContractErrorHandler = (...args: any[]) => any;
type ContractHandler = (...args: any[]) => any;

type Contracts = Record<
  string,
  {
    method: "POST" | "GET" | "PUT" | "DELETE";
    url: string;
    error?: ContractErrorHandler;
    handler: ContractHandler;
  }
>;

type APIConfig<TContracts extends Contracts> = {
  baseUrl: string;
  contracts: TContracts;
};

type OmitUndefined<T> = {
  [K in keyof T as T[K] extends undefined ? never : K]: T[K];
};

type APIReturn<TContracts extends Contracts> = {
  [Key in keyof TContracts]: (
    ...args: Parameters<TContracts[Key]["handler"]>
  ) =>
    | Promise<[true, ReturnType<TContracts[Key]["handler"]>]>
    | Promise<
        [
          false,
          TContracts[Key]["error"] extends ContractErrorHandler
            ? ReturnType<TContracts[Key]["error"]>
            : APIError,
          { aborted: boolean },
        ]
      >;
};

type InferError<
  TContracts extends Record<string, ContractHandler>,
  TKey extends keyof TContracts,
> = Extract<Awaited<ReturnType<TContracts[TKey]>>, [false, any, any]>[1];

type InferContract<
  TContracts extends Record<string, ContractHandler>,
  TKey extends keyof TContracts,
> = OmitUndefined<{
  dto: ReturnType<TContracts[TKey]>;
  error: InferError<TContracts, TKey>;
  payload: Parameters<TContracts[TKey]>[0];
  params: Parameters<TContracts[TKey]>[1];
  searchParams: Parameters<TContracts[TKey]>[2];
}>;

type InferResult<
  TContracts extends Record<string, ContractHandler>,
  TKey extends keyof TContracts,
> = ReturnType<TContracts[TKey]>;

type InferDto<
  TContracts extends Record<string, ContractHandler>,
  TKey extends keyof TContracts,
> = Extract<Awaited<ReturnType<TContracts[TKey]>>, [true, any]>[1];

type InferPayload<
  TContracts extends Record<string, ContractHandler>,
  TKey extends keyof TContracts,
> = Parameters<TContracts[TKey]>[0];

type InferParams<
  TContracts extends Record<string, ContractHandler>,
  TKey extends keyof TContracts,
> = Parameters<TContracts[TKey]>[1];

type InferSearchParams<
  TContracts extends Record<string, ContractHandler>,
  TKey extends keyof TContracts,
> = Parameters<TContracts[TKey]>[2];

const parseError = (error: unknown): APIError => {
  return {} as APIError;
};

const createAPI = <TContracts extends Contracts>(
  config: APIConfig<TContracts>
) => {
  return {} as APIReturn<TContracts>;
};

const tasksAPI = createAPI({
  baseUrl: "http://localhost:3000",
  contracts: {
    create: {
      method: "POST",
      url: "/api/tasks",
      handler: (
        payload: { title: string; description: string },
        params: { id: string },
        searchParams: { page: number; limit: number }
      ) => ({
        title: payload.title,
        description: payload.description,
        id: params.id,
        page: searchParams.page,
        limit: searchParams.limit,
      }),
    },
    get: {
      method: "GET",
      url: "/api/tasks",
      handler: (payload: { xd: string; description: string }) => ({
        xd: payload.xd,
        description: payload.description,
      }),
    },
  },
});

type Result = InferResult<typeof tasksAPI, "create">;
type Dto = InferDto<typeof tasksAPI, "create">;
type Contract = InferContract<typeof tasksAPI, "create">;
type Payload = InferPayload<typeof tasksAPI, "create">;
type Params = InferParams<typeof tasksAPI, "create">;
type SearchParams = InferSearchParams<typeof tasksAPI, "create">;
type Error = InferError<typeof tasksAPI, "create">;

// const create = async () => {
//     const [ok, result, meta] = await tasksAPI.create({
//         title: 'test',
//         description: 'test',
//     }, {
//         id: '1',
//     }, {
//         page: 1, limit: 10
//     })

//     if (ok) {
//         result.description
//     } else {
//         if (meta.aborted) {
//             return
//         }

//         result.code
//     }
// }

export type { InferContract, InferDto };
export { createAPI, parseError };
