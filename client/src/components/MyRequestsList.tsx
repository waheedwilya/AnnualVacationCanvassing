import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge, { type RequestStatus } from "./StatusBadge";
import { Calendar, Check, X } from "lucide-react";
import { format, addDays } from "date-fns";

interface VacationRequest {
  id: string;
  choice?: 'first' | 'second';
  weeks: number[];
  status: RequestStatus;
  submittedDate: Date;
  prioritizedWeeks?: string[];
  firstChoiceWeeks?: string[];
  secondChoiceWeeks?: string[];
  approvedWeeks?: string[];
  deniedWeeks?: string[];
}

interface MyRequestsListProps {
  requests: VacationRequest[];
  conflictingWeeks?: string[];
}

function PriorityWeeksList({ 
  weeks, 
  approvedWeeks = [], 
  deniedWeeks = [],
  conflictingWeeks = []
}: { 
  weeks: string[];
  approvedWeeks?: string[];
  deniedWeeks?: string[];
  conflictingWeeks?: string[];
}) {
  const approvedSet = new Set(approvedWeeks);
  const deniedSet = new Set(deniedWeeks);
  const conflictSet = new Set(conflictingWeeks);
  
  return (
    <div className="flex flex-wrap gap-2">
      {weeks.map((weekStart, priorityIndex) => {
        const start = new Date(weekStart);
        const end = addDays(start, 6); // Monday to Sunday
        const isApproved = approvedSet.has(weekStart);
        const isDenied = deniedSet.has(weekStart);
        const isConflicting = conflictSet.has(weekStart);
        
        return (
          <div
            key={weekStart}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border ${
              isApproved
                ? 'bg-success/10 text-success border-success/30' 
                : isDenied
                ? 'bg-destructive/10 text-destructive border-destructive/30'
                : isConflicting
                ? 'bg-warning/20 text-warning border-warning/40'
                : 'bg-primary/10 text-primary border-primary/30'
            }`}
            data-testid={`week-${weekStart}`}
          >
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              {priorityIndex + 1}
            </span>
            <span className="text-sm font-medium">
              {format(start, 'MMM d')} - {format(end, 'MMM d')}
            </span>
            {isApproved && <Check className="h-3 w-3 text-success" />}
            {isDenied && <X className="h-3 w-3 text-destructive" />}
            {isConflicting && !isApproved && !isDenied && (
              <span className="text-xs text-warning font-medium">⚠</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function MyRequestsList({ requests, conflictingWeeks = [] }: MyRequestsListProps) {
  if (requests.length === 0) {
    return (
      <Card data-testid="my-requests-empty">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-foreground font-medium mb-2">No requests submitted yet</p>
          <p className="text-sm text-muted-foreground text-center">
            Submit your vacation request to see it here
          </p>
        </CardContent>
      </Card>
    );
  }

  const hasConflicts = conflictingWeeks.length > 0;

  return (
    <div className="space-y-4" data-testid="my-requests-list">
      {hasConflicts && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/20">
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-warning/20 flex items-center justify-center mt-0.5">
            <span className="text-warning text-xs font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-medium text-warning mb-1">
              Conflicting Weeks Detected
            </p>
            <p className="text-sm text-muted-foreground">
              Some of your requested weeks conflict with higher seniority workers' requests. 
              These weeks are highlighted with a yellow border and may not be approved.
            </p>
          </div>
        </div>
      )}
      
      {requests.map((request) => {
        // Get weeks (prioritized or legacy)
        const prioritizedWeeks = request.prioritizedWeeks || 
          [...(request.firstChoiceWeeks || []), ...(request.secondChoiceWeeks || [])];
        const showWeeks = prioritizedWeeks.length > 0;
        
        return (
          <Card key={request.id} data-testid={`request-item-${request.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <CardTitle className="text-base font-medium">
                Vacation Request
              </CardTitle>
              <StatusBadge status={request.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              {showWeeks ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Your Priority Weeks (in order of preference):
                    </p>
                    <PriorityWeeksList 
                      weeks={prioritizedWeeks} 
                      approvedWeeks={request.approvedWeeks}
                      deniedWeeks={request.deniedWeeks}
                      conflictingWeeks={conflictingWeeks}
                    />
                  </div>
                  
                  {/* Show summary if there are approved or denied weeks */}
                  {(request.approvedWeeks && request.approvedWeeks.length > 0) && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                      <Check className="h-4 w-4 text-success" />
                      <p className="text-sm text-success font-medium">
                        {request.approvedWeeks.length} {request.approvedWeeks.length === 1 ? 'week' : 'weeks'} approved
                      </p>
                    </div>
                  )}
                  
                  {(request.deniedWeeks && request.deniedWeeks.length > 0) && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                      <X className="h-4 w-4 text-destructive" />
                      <p className="text-sm text-destructive font-medium">
                        {request.deniedWeeks.length} {request.deniedWeeks.length === 1 ? 'week' : 'weeks'} denied
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Requested Weeks:</p>
                  <div className="flex flex-wrap gap-1">
                    {request.weeks.map((week, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                        data-testid={`week-${week}`}
                      >
                        Week {week}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Submitted: {request.submittedDate.toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
