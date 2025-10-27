import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RequestStatus = "pending" | "awarded_first" | "awarded_second" | "denied" | "conflict";

interface StatusBadgeProps {
  status: RequestStatus;
  className?: string;
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "bg-warning text-warning-foreground border-warning-border",
  },
  awarded_first: {
    label: "Awarded 1st Choice",
    className: "bg-success text-success-foreground border-success-border",
  },
  awarded_second: {
    label: "Awarded 2nd Choice",
    className: "bg-success text-success-foreground border-success-border",
  },
  denied: {
    label: "Denied",
    className: "bg-destructive text-destructive-foreground border-destructive-border",
  },
  conflict: {
    label: "Conflict",
    className: "bg-warning text-warning-foreground border-warning-border",
  },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as keyof typeof statusConfig];
  
  // Fallback for unknown status
  if (!config) {
    return (
      <Badge 
        className={cn("bg-muted text-muted-foreground", className)}
        data-testid={`badge-status-${status}`}
      >
        {status}
      </Badge>
    );
  }
  
  return (
    <Badge 
      className={cn(config.className, className)}
      data-testid={`badge-status-${status}`}
    >
      {config.label}
    </Badge>
  );
}
