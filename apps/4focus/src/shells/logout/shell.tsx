import { Button } from "@/lib/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/components/card";
import { Layout, LayoutContent } from "@/cross-shell/components/layout";
import { LayoutSidebarNav } from "@/cross-shell/components/layout-sidebar-nav";
import { AppRouter } from "@/kernel/routing/app-router";

const LogoutShell = ({ activePathname }: { activePathname: string }) => {
  return (
    <Layout>
      <LayoutSidebarNav activePathname={activePathname} />
      <LayoutContent>
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-semibold">
                  Successfully Signed Out
                </CardTitle>
                <CardDescription>
                  Thank you for using our application.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button asChild>
                  <a href={AppRouter.getPath("login")}>Sign in again</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
};

export { LogoutShell };
