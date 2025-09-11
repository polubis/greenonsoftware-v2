import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  BarChart3,
  CheckSquare,
  User,
  LogOut,
  LogIn,
  UserPlus,
} from "lucide-react";
import { AppRouter } from "../routing/app-router";
import { useClientAuth } from "../client-auth/use-client-auth";
import { APIRouter } from "../routing/api-router";
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
} from "@/components/ui/sidebar";

// App Sidebar Component
const AppSidebar = ({ activePathname }: { activePathname: string }) => {
  const auth = useClientAuth();

  const isActive = (path: string) => activePathname === path;

  // Get avatar display character
  const getAvatarDisplay = () => {
    if (auth.status !== "authenticated") return "?";

    const { user } = auth;

    // Check for email and get first letter
    if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }

    // Fallback
    return "?";
  };

  // Navigation items
  const navItems = [
    {
      title: "Home",
      url: AppRouter.getPath("home"),
      icon: Home,
      isActive: isActive(AppRouter.getPath("home")),
    },
    ...(auth.status === "authenticated"
      ? [
          {
            title: "Dashboard",
            url: AppRouter.getPath("dashboard"),
            icon: BarChart3,
            isActive: isActive(AppRouter.getPath("dashboard")),
          },
          {
            title: "Tasks",
            url: AppRouter.getPath("tasks"),
            icon: CheckSquare,
            isActive: isActive(AppRouter.getPath("tasks")),
          },
          {
            title: "Account",
            url: AppRouter.getPath("account"),
            icon: User,
            isActive: isActive(AppRouter.getPath("account")),
          },
        ]
      : [
          {
            title: "Login",
            url: AppRouter.getPath("login"),
            icon: LogIn,
            isActive: isActive(AppRouter.getPath("login")),
          },
          {
            title: "Register",
            url: AppRouter.getPath("register"),
            icon: UserPlus,
            isActive: isActive(AppRouter.getPath("register")),
          },
        ]),
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
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
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
                        {getAvatarDisplay()}
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
  );
};

export const NavBar = ({
  activePathname,
  children,
}: {
  activePathname: string;
  children?: React.ReactNode;
}) => {
  const auth = useClientAuth();

  const isActive = (path: string) => activePathname === path;

  return (
    <SidebarProvider>
      <AppSidebar activePathname={activePathname} />

      <SidebarInset>
        {/* Top Navigation Bar */}
        <nav className="flex items-center p-4 bg-background border-b border-border">
          {/* Left - Sidebar Trigger */}
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <a href={AppRouter.getPath("home")} className="flex items-center">
              <div className="text-primary font-bold text-xl">4Focus</div>
            </a>
          </div>

          {/* Right section - auth content for desktop */}
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
                  className={`text-lg font-medium no-underline transition-colors duration-300 ${
                    isActive(AppRouter.getPath("login"))
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
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

        {/* Main Content Area */}
        <main className="flex-1">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
};
