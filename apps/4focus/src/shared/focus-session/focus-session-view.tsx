import { useFocusSessionLoad } from "./use-focus-session-load";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Target, CheckCircle, XCircle } from "lucide-react";

const FocusSessionView = () => {
  const [state] = useFocusSessionLoad();

  if (state.status === "idle" || state.status === "busy") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Focus Session</CardTitle>
          <CardDescription>
            Loading your active focus session...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            {state.status === "idle" ? "Initializing..." : "Loading..."}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (state.status === "error") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">
            Focus Session Error
          </CardTitle>
          <CardDescription>Failed to load focus session</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">{state.message}</div>
        </CardContent>
      </Card>
    );
  }

  const { hasActiveSession, session } = state.data;

  if (!hasActiveSession || !session) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            No Active Focus Session
          </CardTitle>
          <CardDescription>
            You don&apos;t have an active focus session. Start a task to begin
            focusing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <p>No active focus session found.</p>
            <p className="text-sm mt-2">
              To start a focus session, mark a task as &quot;pending&quot; in
              your tasks list.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sessionDuration = Math.floor(
    (Date.now() - new Date(session.startedAt).getTime()) / (1000 * 60),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Active Focus Session
        </CardTitle>
        <CardDescription>
          You&apos;re currently focusing on a task
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {session.task && (
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-foreground">
                {session.task.title}
              </h3>
              {session.task.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {session.task.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{session.task.priority}</Badge>
              <Badge variant="outline">{session.task.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{sessionDuration} min</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Estimated:</span>
                <span className="font-medium">
                  {session.task.estimatedDurationMinutes} min
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <XCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Interruptions:</span>
              <span className="font-medium">{session.totalInterruptions}</span>
            </div>

            <div className="pt-2 border-t border-border">
              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Session
                </Button>
                <Button size="sm" variant="destructive">
                  <XCircle className="h-4 w-4 mr-2" />
                  Abandon Session
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { FocusSessionView };
