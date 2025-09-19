import { Button } from "@/lib/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/components/card";
import { Input } from "@/lib/ui/components/input";
import { Label } from "@/lib/ui/components/label";
import { Layout, LayoutContent } from "@/cross-shell/components/layout";
import { useAppRedirectionWhenLoggedIn } from "@/kernel/auth/use-app-redirection-when-logged-in";
import { APIRouter } from "@/kernel/routing/api-router";
import { LayoutSidebarNav } from "@/cross-shell/components/layout-sidebar-nav";

const RegisterShell = ({ activePathname }: { activePathname: string }) => {
  useAppRedirectionWhenLoggedIn();

  return (
    <Layout>
      <LayoutSidebarNav activePathname={activePathname} />
      <LayoutContent>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-6">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold">
                  Create a new account
                </CardTitle>
                <CardDescription>
                  Enter your details to create your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-6"
                  action={APIRouter.getPath("register")}
                  method="POST"
                  data-astro-reload
                >
                  <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="Enter your email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Create a password"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-confirm">Confirm Password</Label>
                    <Input
                      id="password-confirm"
                      name="password-confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>

                  <Button className="w-full" type="submit">
                    Sign up
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </LayoutContent>
    </Layout>
  );
};

export { RegisterShell };
