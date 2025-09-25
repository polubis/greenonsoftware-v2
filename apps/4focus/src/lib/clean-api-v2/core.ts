/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  CallArgs,
  CleanApi,
  Configuration,
  Contracts,
  ContractSchemas,
  SchemaValidator,
} from "./models";

/**
 * Generic event subscription manager for handling API event callbacks
 */
class EventSubscriptionManager<TContracts extends Contracts> {
  private subscriptions = new Map<
    keyof TContracts,
    Map<symbol, (...args: any[]) => void | Promise<void>>
  >();

  /**
   * Subscribe to an event for a specific endpoint
   */
  subscribe = <TKey extends keyof TContracts>(
    key: TKey,
    callback: (...args: any[]) => void | Promise<void>,
    eventType: string,
  ): (() => void) => {
    const callId = Symbol(`${eventType}:${key.toString()}`);

    // Create a Map for this endpoint if it doesn't exist
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Map());
    }

    this.subscriptions.get(key)?.set(callId, callback);

    return () => {
      const endpointSubs = this.subscriptions.get(key);

      if (endpointSubs) {
        endpointSubs.delete(callId);

        if (endpointSubs.size === 0) {
          this.subscriptions.delete(key);
        }
      }
    };
  };

  /**
   * Emit an event to all subscribers of a specific endpoint
   */
  emit = <TKey extends keyof TContracts>(
    key: TKey,
    data: any,
    eventType: string,
  ): void => {
    const subs = this.subscriptions.get(key);
    if (subs) {
      for (const [, callback] of subs) {
        try {
          callback(data);
        } catch (error) {
          console.error(
            `${eventType} callback error for endpoint '${key.toString()}':`,
            error,
          );
        }
      }
    }
  };
}

/**
 * Creates a synchronous validator function that validates data and returns it if valid.
 * @param validator - Function that validates the data and throws ValidationException if invalid
 * @param rawSchema - Optional raw schema object (e.g., Zod schema) for client-side usage
 * @returns A function that validates data synchronously with optional raw schema attached
 */
const check = <TData, TRawSchema = unknown>(
  validator: (data: unknown) => TData,
  rawSchema?: TRawSchema,
): SchemaValidator<TData, TRawSchema> => {
  const validatorFn = (data: unknown): TData => {
    return validator(data);
  };

  if (rawSchema !== undefined) {
    validatorFn["__rawSchema"] = rawSchema;
  }

  return validatorFn as SchemaValidator<TData, TRawSchema>;
};

/**
 * Creates an asynchronous validator function that validates data and returns it if valid.
 * @param validator - Function that validates the data and throws ValidationException if invalid
 * @param rawSchema - Optional raw schema object (e.g., Zod schema) for client-side usage
 * @returns A function that validates data asynchronously with optional raw schema attached
 */
const checkAsync = <TData, TRawSchema = unknown>(
  validator: (data: unknown) => Promise<TData>,
  rawSchema?: TRawSchema,
): SchemaValidator<TData, TRawSchema> => {
  const validatorFn = async (data: unknown): Promise<TData> => {
    return await validator(data);
  };

  if (rawSchema !== undefined) {
    validatorFn["__rawSchema"] = rawSchema;
  }

  return validatorFn as SchemaValidator<TData, TRawSchema>;
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
    // Create event managers for different event types
    const onCallManager = new EventSubscriptionManager<TContracts>();
    const onOkManager = new EventSubscriptionManager<TContracts>();
    const onFailManager = new EventSubscriptionManager<TContracts>();

    const onCall: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["onCall"] = (key, callback) => {
      return onCallManager.subscribe(key, callback, "onCall");
    };

    const onOk: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["onOk"] = (key, callback) => {
      return onOkManager.subscribe(key, callback, "onOk");
    };

    const onFail: CleanApi<
      TContracts,
      TConfiguration,
      TContractsSignature
    >["onFail"] = (key, callback) => {
      return onFailManager.subscribe(key, callback, "onFail");
    };

    const validateSchema = <TData>(
      key: keyof TContracts,
      schemaKey: keyof Contracts[keyof Contracts],
      data: TData,
    ): TData => {
      try {
        const schemas = contracts[key]?.schemas;

        if (schemas && schemaKey in schemas) {
          const validator = (schemas as Record<string, unknown>)[schemaKey];
          if (typeof validator === "function") {
            validator(data);
          }
        }

        return data;
      } catch (error) {
        console.error("Validation of", key, schemaKey, "failed");
        throw error;
      }
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
      // Initialize variables to ensure they're available for onFail callbacks
      const finalInput = {} as {
        pathParams?: Record<string, unknown>;
        searchParams?: Record<string, unknown>;
        payload?: unknown;
        extra?: unknown;
        config?: TConfiguration;
      };

      try {
        // Get resolver - this could throw if contracts[key] doesn't exist
        const resolver = contracts[key].resolver;

        // Process input - this could throw during type casting or property access
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

        // Build finalInput first (without validation) to ensure it's available for onFail
        for (const paramKey of keys) {
          if (paramKey in input) {
            finalInput[paramKey] = input[paramKey] as any;
          }
        }

        // Add config if available - this could throw during config access/processing
        if (typeof config === "object" && !!config) {
          finalInput.config = config;
        }

        // Runtime validation: validate each parameter if schema exists
        // Validate in order and fail fast
        for (const paramKey of keys) {
          if (paramKey in input) {
            // Validate the parameter if schema exists
            validateSchema(key, paramKey, input[paramKey]);
          }
        }

        // Execute onCall callbacks
        onCallManager.emit(key, finalInput, "onCall");

        // Execute resolver and get result
        const result = await resolver(finalInput as any);

        // Validate result against dto schema if it exists
        const validatedResult = validateSchema(key, "dto", result);

        // Call onOk subscribers after successful execution
        onOkManager.emit(key, { ...finalInput, dto: validatedResult }, "onOk");

        return validatedResult;
      } catch (callError) {
        // Call onFail subscribers for ANY error during the call process
        // This includes: resolver access, input processing, config handling,
        // validation errors, resolver execution, DTO validation, etc.
        onFailManager.emit(key, { ...finalInput, error: callError }, "onFail");

        // Re-throw the original error to maintain normal error flow
        throw callError;
      }
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
      onFail,
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
