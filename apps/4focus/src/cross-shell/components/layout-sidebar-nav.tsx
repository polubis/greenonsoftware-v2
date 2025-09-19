import { BarChart3, Home, LogIn, UserPlus } from "lucide-react";
import {
  LayoutSidebarNavItem,
  LayoutSidebarNav as LayoutSidebarNavComponent,
} from "./layout";
import { AppRouter } from "@/kernel/routing/app-router";
import { useAuthState } from "@/kernel/auth/use-auth-state";

const isActive = (path: string, pathname: string) => pathname === path;

const LayoutSidebarNav = ({ activePathname }: { activePathname: string }) => {
  const auth = useAuthState();
  return (
    <LayoutSidebarNavComponent>
      <LayoutSidebarNavItem
        isActive={isActive(AppRouter.getPath("home"), activePathname)}
      >
        <a href={AppRouter.getPath("home")}>
          <Home />
          <span>Home</span>
        </a>
      </LayoutSidebarNavItem>
      {auth.status === "authenticated" ? (
        <>
          <LayoutSidebarNavItem
            isActive={isActive(AppRouter.getPath("dashboard"), activePathname)}
          >
            <a href={AppRouter.getPath("dashboard")}>
              <BarChart3 />
              <span>Application</span>
            </a>
          </LayoutSidebarNavItem>
        </>
      ) : (
        <>
          <LayoutSidebarNavItem
            isActive={isActive(AppRouter.getPath("login"), activePathname)}
          >
            <a href={AppRouter.getPath("login")}>
              <LogIn />
              <span>Login</span>
            </a>
          </LayoutSidebarNavItem>
          <LayoutSidebarNavItem
            isActive={isActive(AppRouter.getPath("register"), activePathname)}
          >
            <a href={AppRouter.getPath("register")}>
              <UserPlus />
              <span>Register</span>
            </a>
          </LayoutSidebarNavItem>
        </>
      )}
    </LayoutSidebarNavComponent>
  );
};

export { LayoutSidebarNav };
