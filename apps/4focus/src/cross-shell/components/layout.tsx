import { Button } from "@/lib/ui/components/button";
import { Avatar, AvatarFallback } from "@/lib/ui/components/avatar";
import { LogOut } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/lib/ui/components/sidebar";
import { AppRouter } from "@/kernel/routing/app-router";
import { APIRouter } from "@/kernel/routing/api-router";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/ui/utils/cn";
import { useAuthState } from "@/kernel/auth/use-auth-state";

const Layout = ({
  children,
}: {
  children: [React.ReactNode, React.ReactNode];
}) => {
  const auth = useAuthState();

  const [nav, content] = children;

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2">
            <div className="text-primary font-bold text-xl">4Focus</div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>{nav}</SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {auth.status === "authenticated" && (
          <SidebarFooter>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <div className="flex items-center gap-2 px-2 py-2">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                          {auth.user.email?.charAt(0).toUpperCase() || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-sidebar-foreground truncate">
                          {auth.user.email || "User"}
                        </div>
                      </div>
                    </div>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <form action={APIRouter.getPath("logout")} method="POST">
                      <SidebarMenuButton asChild>
                        <button type="submit" className="w-full">
                          <LogOut />
                          <span>Log out</span>
                        </button>
                      </SidebarMenuButton>
                    </form>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarFooter>
        )}
      </Sidebar>

      <SidebarInset>
        <nav className="flex items-center p-4 bg-background border-b border-border">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <a href={AppRouter.getPath("home")} className="flex items-center">
              <div className="text-primary font-bold text-xl">4Focus</div>
            </a>
          </div>

          <div className="flex-1 flex items-center justify-end">
            {auth.status === "authenticated" && (
              <div className="hidden lg:flex items-center">
                {/* User Avatar */}
                <div className="flex items-center mr-4">
                  <Avatar className="mr-3 w-10 h-10">
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                      {auth.user.email?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-foreground">
                    {auth.user.email || "User"}
                  </span>
                </div>

                {/* Logout Button */}
                <form action={APIRouter.getPath("logout")} method="POST">
                  <Button>Log out</Button>
                </form>
              </div>
            )}
            {(auth.status === "idle" || auth.status === "unauthenticated") && (
              <div className="hidden lg:flex items-center gap-4">
                <a
                  href={AppRouter.getPath("login")}
                  className={`text-lg font-medium no-underline transition-colors duration-300`}
                >
                  Login
                </a>
                <Button asChild>
                  <a href={AppRouter.getPath("register")}>Register</a>
                </Button>
              </div>
            )}
          </div>
        </nav>

        {content}
      </SidebarInset>
    </SidebarProvider>
  );
};

const LayoutSidebarNav = SidebarMenu;

const LayoutSidebarNavItem = ({
  children,
  ...props
}: Omit<ComponentPropsWithoutRef<typeof SidebarMenuButton>, "asChild">) => {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton {...props} asChild>
        {children}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
};

const LayoutContent = ({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<"main">) => {
  return (
    <main className={cn("flex-1", className)} {...props}>
      {children}
    </main>
  );
};

export { Layout, LayoutContent, LayoutSidebarNav, LayoutSidebarNavItem };
