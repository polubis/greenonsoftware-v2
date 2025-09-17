import * as React from "react";
import { cn } from "../utils/cn";

function Timeline({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("relative", className)} {...props} />;
}

function TimelineItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("relative flex gap-4 pb-8 last:pb-0", className)}
      {...props}
    />
  );
}

function TimelineIndicator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium ring-4 ring-background",
        className,
      )}
      {...props}
    />
  );
}

function TimelineContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex-1 space-y-1", className)} {...props} />;
}

function TimelineHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex items-center gap-2", className)} {...props} />
  );
}

function TimelineTime({ className, ...props }: React.ComponentProps<"time">) {
  return (
    <time
      className={cn("text-xs text-muted-foreground", className)}
      {...props}
    />
  );
}

function TimelineTitle({ className, ...props }: React.ComponentProps<"h4">) {
  return (
    <h4
      className={cn("text-sm font-medium text-foreground", className)}
      {...props}
    />
  );
}

function TimelineDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

function TimelineConnector({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("absolute left-3 top-6 h-full w-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Timeline,
  TimelineItem,
  TimelineIndicator,
  TimelineContent,
  TimelineHeader,
  TimelineTime,
  TimelineTitle,
  TimelineDescription,
  TimelineConnector,
};
