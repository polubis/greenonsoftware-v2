import type { HttpRequestHandler } from "msw";
import { http } from "msw";

import { setupServer } from "msw/node";

const server = setupServer();

type SetupFunction = (callback: () => void) => void;

interface Setup {
  beforeAll: SetupFunction;
  afterEach: SetupFunction;
  afterAll: SetupFunction;
}

type Method = keyof typeof http;

const serverFixture = ({ beforeAll, afterAll, afterEach }: Setup) => {
  beforeAll(() => {
    server.listen();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  afterAll(() => {
    server.close();
  });

  const mock = (method: Method, ...args: Parameters<HttpRequestHandler>) => {
    server.use(http[method](...args));
  };

  return mock;
};

export { serverFixture };
