import { Button } from "@/lib/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/ui/components/card";
import { Badge } from "@/lib/ui/components/badge";
import { Separator } from "@/lib/ui/components/separator";
import {
  Brain,
  Target,
  Clock,
  BarChart3,
  Shield,
  Smartphone,
  CheckCircle,
  ArrowRight,
  Users,
  Zap,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { AppRouter } from "../../kernel/routing/app-router";
import { useAuth } from "../../kernel/auth/use-auth";
import { NavBar } from "../../cross-shell/components/nav-bar";

const HomeShell = ({ activePathname }: { activePathname: string }) => {
  const auth = useAuth();

  const features = [
    {
      icon: Brain,
      title: "Eisenhower Matrix",
      description:
        "Organize tasks into four categories: urgent & important, important but not urgent, urgent but not important, and neither urgent nor important.",
    },
    {
      icon: Target,
      title: "Focus Blocker",
      description:
        "A dedicated screen that helps you stay focused on your current task by making it harder to exit or get distracted.",
    },
    {
      icon: Clock,
      title: "Time Tracking",
      description:
        "Set estimated completion times for tasks and get positive reinforcement when you finish on time.",
    },
    {
      icon: BarChart3,
      title: "Health Score",
      description:
        "Track your progress with a comprehensive health score that shows how well you're managing your ADHD symptoms.",
    },
    {
      icon: Shield,
      title: "Daily Reports",
      description:
        "Get detailed daily statistics including completion times, distraction instances, and personalized suggestions.",
    },
    {
      icon: Smartphone,
      title: "Mobile Support",
      description:
        "Full mobile support so you can manage your tasks and stay focused wherever you are.",
    },
  ];

  const eisenhowerMatrix = [
    {
      quadrant: "Urgent & Important",
      color: "bg-red-500",
      description: "Do these tasks immediately",
      examples: ["Deadlines", "Crises", "Emergency tasks"],
    },
    {
      quadrant: "Important, Not Urgent",
      color: "bg-blue-500",
      description: "Schedule these tasks",
      examples: ["Planning", "Learning", "Relationship building"],
    },
    {
      quadrant: "Urgent, Not Important",
      color: "bg-yellow-500",
      description: "Delegate if possible",
      examples: ["Interruptions", "Some emails", "Some meetings"],
    },
    {
      quadrant: "Neither Urgent nor Important",
      color: "bg-gray-500",
      description: "Eliminate these tasks",
      examples: ["Time wasters", "Excessive social media", "Busy work"],
    },
  ];

  const stats = [
    { icon: Users, value: "200+", label: "Users in first week" },
    { icon: TrendingUp, value: "75%", label: "Retention rate" },
    { icon: Zap, value: "4", label: "Task categories" },
    { icon: Calendar, value: "Daily", label: "Progress reports" },
  ];

  return (
    <NavBar activePathname={activePathname}>
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background to-muted/20">
          <div className="container mx-auto px-4 py-20 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <Badge variant="secondary" className="mb-6">
                <Brain className="w-4 h-4 mr-2" />
                ADHD Focus Management
              </Badge>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                Focus Better with
                <span className="text-primary block">4Focus</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                Transform your productivity with the Eisenhower Matrix. Designed
                specifically for people with ADHD to organize tasks, track
                progress, and build better focus habits.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                {auth.status === "authenticated" ? (
                  <Button size="lg" asChild className="text-lg px-8 py-6">
                    <a href={AppRouter.getPath("dashboard")}>
                      Go to Dashboard
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                ) : (
                  <>
                    <Button size="lg" asChild className="text-lg px-8 py-6">
                      <a href={AppRouter.getPath("register")}>
                        Get Started Free
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      asChild
                      className="text-lg px-8 py-6"
                    >
                      <a href={AppRouter.getPath("login")}>Sign In</a>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 rounded-full bg-primary/10">
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything You Need to Focus Better
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Built specifically for people with ADHD, 4Focus provides the
                tools and structure you need to manage tasks effectively.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Eisenhower Matrix Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                The Eisenhower Matrix
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Organize your tasks into four categories to prioritize what
                matters most and eliminate distractions.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {eisenhowerMatrix.map((quadrant, index) => (
                <Card key={index} className="relative overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 w-full h-2 ${quadrant.color}`}
                  />
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {quadrant.quadrant}
                    </CardTitle>
                    <CardDescription className="font-medium text-foreground">
                      {quadrant.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {quadrant.examples.map((example, exampleIndex) => (
                        <li
                          key={exampleIndex}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                          {example}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Ready to Transform Your Productivity?
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join hundreds of users who have improved their focus and
                productivity with 4Focus. Start your journey today.
              </p>

              {auth.status === "authenticated" ? (
                <Button size="lg" asChild className="text-lg px-8 py-6">
                  <a href={AppRouter.getPath("tasks")}>
                    Start Managing Tasks
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </a>
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="text-lg px-8 py-6">
                    <a href={AppRouter.getPath("register")}>
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    asChild
                    className="text-lg px-8 py-6"
                  >
                    <a href={AppRouter.getPath("login")}>Sign In</a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-muted/50 py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="h-8 w-8 text-primary" />
                  <span className="text-2xl font-bold text-foreground">
                    4Focus
                  </span>
                </div>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Helping people with ADHD organize tasks, track progress, and
                  build better focus habits through the Eisenhower Matrix.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Product</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href={AppRouter.getPath("tasks")}
                      className="hover:text-foreground transition-colors"
                    >
                      Tasks
                    </a>
                  </li>
                  <li>
                    <a
                      href={AppRouter.getPath("dashboard")}
                      className="hover:text-foreground transition-colors"
                    >
                      Dashboard
                    </a>
                  </li>
                  <li>
                    <a
                      href={AppRouter.getPath("account")}
                      className="hover:text-foreground transition-colors"
                    >
                      Account
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-foreground mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Help Center
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Contact Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#"
                      className="hover:text-foreground transition-colors"
                    >
                      Privacy Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            <Separator className="my-8" />

            <div className="text-center text-sm text-muted-foreground">
              <p>&copy; 2024 4Focus. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </NavBar>
  );
};

export { HomeShell };
