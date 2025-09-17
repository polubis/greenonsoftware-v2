import { Button } from "@/lib/ui/components/button";
import { Avatar, AvatarFallback } from "@/lib/ui/components/avatar";
import { BarChart3, CheckSquare, User, LogOut } from "lucide-react";
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
import { Link, useLocation } from "@tanstack/react-router";
import { AppRouter } from "@/kernel/routing/app-router";
import { APIRouter } from "@/kernel/routing/api-router";
import { useUser } from "@/kernel/auth/use-user";

const isActive = (path: string, pathname: string) => pathname === path;

const CustomSidebar = () => {
  const user = useUser();
  const location = useLocation();

  const navItems = [
    {
      title: "Dashboard",
      url: AppRouter.getPath("dashboard"),
      icon: BarChart3,
      isActive: isActive(AppRouter.getPath("dashboard"), location.pathname),
    },
    {
      title: "Tasks",
      url: AppRouter.getPath("tasks"),
      icon: CheckSquare,
      isActive: isActive(AppRouter.getPath("tasks"), location.pathname),
    },
    {
      title: "Account",
      url: AppRouter.getPath("account"),
      icon: User,
      isActive: isActive(AppRouter.getPath("account"), location.pathname),
    },
  ];

  return (
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
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={item.isActive}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-2 px-2 py-2">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                      {user.email?.charAt(0).toUpperCase() || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-sidebar-foreground truncate">
                      {user.email || "User"}
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
    </Sidebar>
  );
};

const Layout = ({ children }: { children: React.ReactNode }) => {
  const user = useUser();

  return (
    <SidebarProvider>
      <CustomSidebar />

      <SidebarInset>
        <nav className="flex items-center p-4 bg-background border-b border-border">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <a href={AppRouter.getPath("home")} className="flex items-center">
              <div className="text-primary font-bold text-xl">4Focus</div>
            </a>
          </div>

          <div className="flex-1 flex items-center justify-end">
            <div className="hidden lg:flex items-center">
              <div className="flex items-center mr-4">
                <Avatar className="mr-3 w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-medium">
                    {user.email?.charAt(0).toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="text-foreground">{user.email || "User"}</span>
              </div>

              <form action={APIRouter.getPath("logout")} method="POST">
                <Button>Log out</Button>
              </form>
            </div>
          </div>
        </nav>

        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};

export { Layout };
