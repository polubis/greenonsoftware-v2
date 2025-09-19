import {
  createRouter,
  createRoute,
  createRootRoute,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { AppRouter } from "@/kernel/routing/app-router";
import { DashboardView } from "./features/dashboard/dashboard-view";
import { AccountView } from "./features/account/account-view";
import { TasksView } from "./features/tasks/tasks-view";
import { Layout } from "./layout";

const rootRoute = createRootRoute({
  component: () => {
    return (
      <Layout>
        <Outlet />
      </Layout>
    );
  },
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: AppRouter.getPath("dashboard"),
  component: () => {
    return <DashboardView />;
  },
});

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: AppRouter.getPath("account"),
  component: () => {
    return <AccountView />;
  },
});

const tasksRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: AppRouter.getPath("tasks"),
  component: () => {
    return <TasksView />;
  },
});

const routeTree = rootRoute.addChildren([
  dashboardRoute,
  accountRoute,
  tasksRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const Router = () => <RouterProvider router={router} />;

export { Router };
