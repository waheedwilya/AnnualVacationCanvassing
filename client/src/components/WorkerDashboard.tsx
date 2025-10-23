import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { differenceInDays } from "date-fns";

interface WorkerDashboardProps {
  workerName: string;
  weeksEntitled: number;
  weeksRequested: number;
  weeksApproved: number;
  submissionDeadline: Date;
  pendingRequests: number;
  approvedRequests: number;
}

export default function WorkerDashboard({
  workerName,
  weeksEntitled,
  weeksRequested,
  weeksApproved,
  submissionDeadline,
  pendingRequests,
  approvedRequests
}: WorkerDashboardProps) {
  const daysUntilDeadline = differenceInDays(submissionDeadline, new Date());
  const hasSubmitted = weeksRequested > 0;

  return (
    <div className="space-y-6" data-testid="worker-dashboard">
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2" data-testid="text-welcome">
          Welcome, {workerName}
        </h1>
        <p className="text-muted-foreground">
          Manage your {new Date().getFullYear() + 1} vacation requests
        </p>
      </div>

      {daysUntilDeadline > 0 && !hasSubmitted && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-warning mt-0.5" />
              <div>
                <p className="font-medium text-foreground" data-testid="text-deadline-reminder">
                  Deadline Reminder
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit your vacation request by {submissionDeadline.toLocaleDateString()} ({daysUntilDeadline} days remaining)
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
              Vacation Entitlement
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="text-weeks-entitled">
              {weeksEntitled} weeks
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Requested
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="text-weeks-requested">
              {weeksRequested} weeks
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pendingRequests} pending
            </p>
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
            <div className="text-2xl font-bold text-success" data-testid="text-weeks-approved">
              {weeksApproved} weeks
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedRequests} requests approved
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Remaining
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground" data-testid="text-weeks-remaining">
              {Math.max(0, weeksEntitled - weeksApproved)} weeks
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
