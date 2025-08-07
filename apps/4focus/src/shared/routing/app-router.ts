const createRoute = <TKey extends string, TPath extends `/${string}`>(
  key: TKey,
  path: TPath,
): { key: TKey; path: TPath } => {
  return { key, path };
};

const appRoutes = [
  createRoute("home", "/"),
  createRoute("login", "/login"),
  createRoute("register", "/register"),
  createRoute("tasks", "/tasks"),
  createRoute("account", "/account"),
  createRoute("dashboard", "/dashboard"),
] as const;

type AppRoute = (typeof appRoutes)[number];
type AppRouteKey = AppRoute["key"];

const appRoutesMap = Object.fromEntries(
  appRoutes.map((route) => [route.key, route.path]),
) as { [K in AppRouteKey]: Extract<AppRoute, { key: K }>["path"] };

class AppRouter {
  static getPath = <TKey extends AppRouteKey>(
    key: TKey,
  ): (typeof appRoutesMap)[TKey] => {
    return appRoutesMap[key];
  };
}

export { AppRouter };
