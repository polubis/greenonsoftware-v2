import type { ErrorVariant } from "@/lib/clean-api-v2";

const ErrorResponse = <TError extends ErrorVariant<string, number>>(
  apiError: TError,
) => {
  return new Response(JSON.stringify(apiError), {
    status: apiError.status,
    headers: { "content-type": "application/json" },
  });
};

const OkResponse = <TData>(data: TData, status: number) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
};

export { ErrorResponse, OkResponse };
