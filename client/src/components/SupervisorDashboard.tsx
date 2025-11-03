import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, CheckCircle2, AlertTriangle, Sparkles, RotateCcw } from "lucide-react";
import { useState } from "react";

interface SupervisorDashboardProps {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  conflicts: number;
  onAutoAllocate?: () => void;
  onResetAllApprovals?: () => void;
}

export default function SupervisorDashboard({
  totalRequests,
  pendingRequests,
  approvedRequests,
  conflicts,
  onAutoAllocate,
  onResetAllApprovals
}: SupervisorDashboardProps) {
  const [isAllocating, setIsAllocating] = useState(false);

  const handleAutoAllocate = () => {
    setIsAllocating(true);
    console.log('Auto-allocating vacation requests...');
    setTimeout(() => {
      setIsAllocating(false);
      onAutoAllocate?.();
    }, 1500);
  };

  return (
    <div className="space-y-6" data-testid="supervisor-dashboard">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Vacation Request Management
          </h1>
          <p className="text-muted-foreground">
            Review and approve vacation requests for {new Date().getFullYear() + 1}
          </p>
        </div>
        
        <div className="flex gap-2">
          {approvedRequests > 0 && (
            <Button
              onClick={onResetAllApprovals}
              variant="outline"
              className="h-12"
              data-testid="button-reset-all"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset All Approvals
            </Button>
          )}
          {conflicts > 0 && (
            <Button
              onClick={handleAutoAllocate}
              disabled={isAllocating}
              className="h-12 bg-auto-allocate hover:bg-auto-allocate text-auto-allocate-foreground border border-auto-allocate-border"
              data-testid="button-auto-allocate"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isAllocating ? 'Allocating...' : 'Auto-Allocate'}
            </Button>
          )}
        </div>
      </div>

      {conflicts > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-foreground" data-testid="text-conflict-alert">
                  {conflicts} Conflicts Detected
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Multiple workers have requested the same weeks. Use auto-allocate to resolve based on seniority.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Requests
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="text-total-requests">
              {totalRequests}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning" data-testid="text-pending-requests">
              {pendingRequests}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Approved
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success" data-testid="text-approved-requests">
              {approvedRequests}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Conflicts
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive" data-testid="text-conflicts">
              {conflicts}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
