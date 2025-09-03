/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CallArgs,
  CleanApi,
  Configuration,
  Contracts,
  ContractSchemas,
} from "./models";

/**
 * Creates a synchronous validator function that validates data and returns it if valid.
 * @param validator - Function that validates the data and throws ValidationException if invalid
 * @param rawSchema - Optional raw schema object (e.g., Zod schema) for client-side usage
 * @returns A function that validates data synchronously with optional raw schema attached
 */
const check = <T, TRawSchema = unknown>(
  validator: (data: unknown) => T,
  rawSchema?: TRawSchema,
) => {
  const validatorFn = (data: unknown): T => {
    return validator(data);
  };

  // Attach raw schema as a property if provided
  if (rawSchema !== undefined) {
    (validatorFn as any).__rawSchema = rawSchema;
  }

  return validatorFn;
};

/**
 * Creates an asynchronous validator function that validates data and returns it if valid.
 * @param validator - Function that validates the data and throws ValidationException if invalid
 * @param rawSchema - Optional raw schema object (e.g., Zod schema) for client-side usage
 * @returns A function that validates data asynchronously with optional raw schema attached
 */
const checkAsync = <T, TRawSchema = unknown>(
  validator: (data: unknown) => Promise<T>,
  rawSchema?: TRawSchema,
) => {
  const validatorFn = async (data: unknown): Promise<T> => {
    return await validator(data);
  };

  // Attach raw schema as a property if provided
  if (rawSchema !== undefined) {
    (validatorFn as any).__rawSchema = rawSchema;
  }

  return validatorFn;
};

const init =
  <TConfiguration extends Configuration | undefined>(config?: TConfiguration) =>
  <TContracts extends Contracts>() =>
  <
    TContractsSignature extends {
      [K in keyof TContracts]: {
        resolver: (
          ...args: CallArgs<TConfiguration, TContracts, K>
        ) => Promise<TContracts[K]["dto"]>;
        schemas?: ContractSchemas<TContracts[K]>;
      };
    },
  >(
    contracts: TContractsSignature,
  ): CleanApi<TContracts, TConfiguration, TContractsSignature> => {
    const onCallSubs = new Map<
      keyof TContracts,
      Map<symbol, (...args: any[]) => void | Promise<void>>
    >();

    const onOkSubs = new Map<
      keyof TContracts,
      Map<symbol, (...args: any[]) => void | Promise<void>>
    >();

    const onCall: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["onCall"] = (key, callback) => {
      const callId = Symbol(`onCall:${key.toString()}`);

      // Create a Map for this endpoint if it doesn't exist
      if (!onCallSubs.has(key)) {
        onCallSubs.set(key, new Map());
      }

      onCallSubs.get(key)?.set(callId, callback);

      return () => {
        const endpointSubs = onCallSubs.get(key);

        if (endpointSubs) {
          endpointSubs.delete(callId);

          if (endpointSubs.size === 0) {
            onCallSubs.delete(key);
          }
        }
      };
    };

    const onOk: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["onOk"] = (key, callback) => {
      const callId = Symbol(`onOk:${key.toString()}`);

      // Create a Map for this endpoint if it doesn't exist
      if (!onOkSubs.has(key)) {
        onOkSubs.set(key, new Map());
      }

      onOkSubs.get(key)?.set(callId, callback);

      return () => {
        const endpointSubs = onOkSubs.get(key);

        if (endpointSubs) {
          endpointSubs.delete(callId);

          if (endpointSubs.size === 0) {
            onOkSubs.delete(key);
          }
        }
      };
    };

    const validateSchema = <TData>(
      key: keyof TContracts,
      schemaKey: keyof Contracts[keyof Contracts],
      data: TData,
    ): TData => {
      const schemas = contracts[key]?.schemas;

      if (schemas && schemaKey in schemas) {
        const validator = (schemas as Record<string, unknown>)[schemaKey];
        if (typeof validator === "function") {
          validator(data);
        }
      }

      return data;
    };

    const pathParams: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["pathParams"] = (key, pathParams) => {
      return validateSchema(key, "pathParams", pathParams);
    };

    const searchParams: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["searchParams"] = (key, searchParams) => {
      return validateSchema(key, "searchParams", searchParams);
    };

    const payload: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["payload"] = (key, payload) => {
      return validateSchema(key, "payload", payload);
    };

    const extra: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["extra"] = (key, extra) => {
      return validateSchema(key, "extra", extra);
    };

    const error: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["error"] = (key, error) => {
      return validateSchema(key, "error", error);
    };

    const dto: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["dto"] = (key, dto) => {
      return validateSchema(key, "dto", dto);
    };

    const call: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["call"] = async (key, ...args) => {
      const resolver = contracts[key].resolver;
      const input = (args[0] ?? {}) as {
        pathParams?: Record<string, unknown>;
        searchParams?: Record<string, unknown>;
        payload?: unknown;
        extra?: unknown;
      };
      const keys = [
        "pathParams",
        "searchParams",
        "payload",
        "extra",
      ] as (keyof typeof input)[];

      const finalInput = {} as typeof input & {
        config?: TConfiguration;
      };

      // Runtime validation: validate each parameter if schema exists
      // Validate in order and fail fast
      for (const paramKey of keys) {
        if (paramKey in input) {
          // Validate the parameter if schema exists
          validateSchema(key, paramKey, input[paramKey]);
          finalInput[paramKey] = input[paramKey] as any;
        }
      }

      if (typeof config === "object" && !!config) {
        finalInput.config = config;
      }

      const subs = onCallSubs.get(key);

      if (subs) {
        for (const [, callback] of subs) {
          try {
            callback(finalInput);
          } catch (error) {
            console.error(
              `onCall callback error for endpoint '${key.toString()}':`,
              error,
            );
          }
        }
      }

      // Execute resolver and get result
      const result = await resolver(finalInput as any);

      // Validate result against dto schema if it exists
      const validatedResult = validateSchema(key, "dto", result);

      // Call onOk subscribers after successful execution
      const onOkSubscribers = onOkSubs.get(key);
      if (onOkSubscribers) {
        for (const [, callback] of onOkSubscribers) {
          try {
            callback({ ...finalInput, dto: validatedResult });
          } catch (error) {
            console.error(
              `onOk callback error for endpoint '${key.toString()}':`,
              error,
            );
          }
        }
      }

      return validatedResult;
    };

    const safeCall: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["safeCall"] = async (key, ...args) => {
      try {
        const result = await call(key, ...args);
        return [true, result];
      } catch (error) {
        return [false, error];
      }
    };

    const getSchema: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["getSchema"] = (contractKey) => {
      const contract = contracts[contractKey];
      const schemas = contract?.schemas;

      if (!schemas) {
        // Return unknown if no schemas are defined
        return undefined as unknown;
      }

      // Filter out undefined schemas and return only the provided ones
      const providedSchemas: Record<string, unknown> = {};

      for (const [key, schema] of Object.entries(schemas)) {
        if (schema !== undefined) {
          providedSchemas[key] = schema;
        }
      }

      // If no schemas were actually provided, return unknown
      if (Object.keys(providedSchemas).length === 0) {
        return undefined as unknown;
      }

      return providedSchemas as any;
    };

    const getRawSchema: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["getRawSchema"] = (contractKey) => {
      const contract = contracts[contractKey];
      const schemas = contract?.schemas;

      if (!schemas) {
        // Return unknown if no schemas are defined
        return undefined as unknown;
      }

      // Extract raw schemas from validators
      const rawSchemas: Record<string, unknown> = {};

      for (const [key, schema] of Object.entries(schemas)) {
        if (
          schema !== undefined &&
          typeof schema === "function" &&
          "__rawSchema" in schema
        ) {
          rawSchemas[key] = (schema as any).__rawSchema;
        }
      }

      // If no raw schemas were found, return unknown
      if (Object.keys(rawSchemas).length === 0) {
        return undefined as unknown;
      }

      return rawSchemas as any;
    };

    return {
      call,
      onCall,
      onOk,
      safeCall,
      error,
      dto,
      pathParams,
      searchParams,
      payload,
      extra,
      getSchema,
      getRawSchema,
    };
  };

export { init, check, checkAsync };
