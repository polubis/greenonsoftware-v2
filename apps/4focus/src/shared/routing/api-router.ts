const createRoute = <TKey extends string, TPath extends `/${string}`>(
  key: TKey,
  path: TPath,
): { key: TKey; path: TPath } => {
  return { key, path };
};

const appRoutes = [
  createRoute("callback", "/api/auth/callback"),
  createRoute("register", "/api/auth/register"),
  createRoute("login", "/api/auth/login"),
  createRoute("logout", "/api/auth/logout"),
  createRoute("tasks", "/api/tasks"),
  createRoute("taskHistory", "/api/task-history"),
] as const;

type APIRoute = (typeof appRoutes)[number];
type APIRouteKey = APIRoute["key"];

const apiRoutesMap = Object.fromEntries(
  appRoutes.map((route) => [route.key, route.path]),
) as { [K in APIRouteKey]: Extract<APIRoute, { key: K }>["path"] };

class APIRouter {
  static getPath = <TKey extends APIRouteKey>(
    key: TKey,
  ): (typeof apiRoutesMap)[TKey] => {
    return apiRoutesMap[key];
  };
}

export { APIRouter };
