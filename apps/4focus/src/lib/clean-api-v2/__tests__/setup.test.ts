import { describe, it } from "vitest";
import type { ErrorVariant } from "../models";
import { create } from "..";

describe("setup works when", () => {
    it("contract is enforced for configuration", () => {
        type APIContracts = {
            get: {
                searchParams: { version: number };
                dto: { tasks: { id: number }[] };
                error: ErrorVariant<"bad_request", 400> | ErrorVariant<"unauthorized", 401>;
            };
            post: {
                payload: { name: string };
                pathParams: { id: string };
                searchParams: { version: number };
                dto: { tasks: { id: number }[] };
                error: ErrorVariant<"bad_request", 400> | ErrorVariant<"unauthorized", 401>;
            };
        };

        create<APIContracts>()({
            get: {
                // @ts-expect-error - wrong dto type
                resolver: () => { },
            },
        });
        create<APIContracts>()({
            // @ts-expect-error - typo in key
            getType: {
                resolver: () => { },
            },
        });
        // @ts-expect-error - not full contract configured
        create<APIContracts>()({
            post: {
                resolver: () => Promise.resolve({ tasks: [{ id: 1 }] }),
            },
        });
        create<APIContracts>()({
            get: {
                // @ts-expect-error - payload and pathParams are not defined in the contract
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                resolver: ({ payload, pathParams }) => Promise.resolve({ tasks: [{ id: 1 }] }),
            },
            post: {
                resolver: ({ pathParams, searchParams, payload }) => {
                    return Promise.resolve({ tasks: [], pathParams, searchParams, payload })
                },
            },
        });
        create<APIContracts>()({
            post: {
                resolver: ({ pathParams, searchParams, payload }) => {
                    return Promise.resolve({ tasks: [], pathParams, searchParams, payload })
                },
            },
            get: {
                resolver: ({ searchParams }) => {
                    return Promise.resolve({ tasks: [{ id: 1 }], searchParams })
                }
            },
        });
    });
});
