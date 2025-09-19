import { BarChart3, CheckSquare, User } from "lucide-react";
import { Link, useLocation } from "@tanstack/react-router";
import { AppRouter } from "@/kernel/routing/app-router";
import {
  Layout,
  LayoutContent,
  LayoutSidebarNav,
  LayoutSidebarNavItem,
} from "@/cross-shell/components/layout";

const isActive = (path: string, pathname: string) => pathname === path;

const ShellLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return (
    <Layout>
      <LayoutSidebarNav>
        <LayoutSidebarNavItem
          isActive={isActive(AppRouter.getPath("dashboard"), location.pathname)}
        >
          <Link to={AppRouter.getPath("dashboard")}>
            <BarChart3 />
            <span>Dashboard</span>
          </Link>
        </LayoutSidebarNavItem>

        <LayoutSidebarNavItem
          isActive={isActive(AppRouter.getPath("tasks"), location.pathname)}
        >
          <Link to={AppRouter.getPath("tasks")}>
            <CheckSquare />
            <span>Tasks</span>
          </Link>
        </LayoutSidebarNavItem>

        <LayoutSidebarNavItem
          isActive={isActive(AppRouter.getPath("account"), location.pathname)}
        >
          <Link to={AppRouter.getPath("account")}>
            <User />
            <span>Account</span>
          </Link>
        </LayoutSidebarNavItem>
      </LayoutSidebarNav>
      <LayoutContent>{children}</LayoutContent>
    </Layout>
  );
};

export { ShellLayout as Layout };
