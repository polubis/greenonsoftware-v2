import * as React from "react";
import { AlertTriangle, XCircle, AlertCircle, WifiOff } from "lucide-react";
import { cn } from "@/lib/ui/utils/cn";

// Error icon variants
const errorIconVariants = {
  default: AlertTriangle,
  critical: XCircle,
  warning: AlertCircle,
  network: WifiOff,
} as const;

type ErrorIconVariant = keyof typeof errorIconVariants;

// Main ErrorScreen component
function ErrorScreen({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="error-screen"
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] p-8 text-center",
        "bg-card border border-border rounded-xl shadow-sm",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// ErrorIcon component
interface ErrorIconProps extends React.ComponentProps<"div"> {
  variant?: ErrorIconVariant;
  size?: "sm" | "md" | "lg" | "xl";
}

function ErrorIcon({
  className,
  variant = "default",
  size = "xl",
  ...props
}: ErrorIconProps) {
  const IconComponent = errorIconVariants[variant];

  const sizeClasses = {
    sm: "size-8",
    md: "size-12",
    lg: "size-16",
    xl: "size-20",
  };

  const colorClasses = {
    default: "text-destructive",
    critical: "text-destructive",
    warning: "text-yellow-500",
    network: "text-muted-foreground",
  };

  return (
    <div
      data-slot="error-icon"
      className={cn("flex items-center justify-center mb-6", className)}
      {...props}
    >
      <IconComponent
        className={cn(
          sizeClasses[size],
          colorClasses[variant],
          "drop-shadow-sm",
        )}
      />
    </div>
  );
}

// ErrorHeader component
interface ErrorHeaderProps extends React.ComponentProps<"div"> {
  title?: string;
}

function ErrorHeader({
  className,
  title,
  children,
  ...props
}: ErrorHeaderProps) {
  return (
    <div data-slot="error-header" className={cn("mb-4", className)} {...props}>
      {title && <h2 className="typo-h3 text-foreground mb-2">{title}</h2>}
      {children}
    </div>
  );
}

// ErrorDescription component
interface ErrorDescriptionProps extends React.ComponentProps<"div"> {
  description?: string;
}

function ErrorDescription({
  className,
  description,
  children,
  ...props
}: ErrorDescriptionProps) {
  return (
    <div
      data-slot="error-description"
      className={cn("mb-6 max-w-md", className)}
      {...props}
    >
      {description && (
        <p className="typo-p text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  );
}

function ErrorFooter({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="error-footer"
      className={cn(
        "flex flex-col sm:flex-row gap-3 items-center justify-center",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Compound component exports
export {
  ErrorScreen,
  ErrorIcon,
  ErrorHeader,
  ErrorDescription,
  ErrorFooter,
  type ErrorIconVariant,
};
