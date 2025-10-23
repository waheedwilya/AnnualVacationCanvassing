import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import StatusBadge, { type RequestStatus } from "./StatusBadge";
import WorkerInfoCard from "./WorkerInfoCard";

interface VacationRequest {
  id: string;
  workerName: string;
  joiningDate: Date;
  yearsOfService: number;
  weeksOfVacation: number;
  department: string;
  requestedWeeks: { week: number; choice: 'first' | 'second' }[];
  status: RequestStatus;
  hasConflict?: boolean;
  conflictDetails?: string;
  firstChoiceStart?: string;
  firstChoiceEnd?: string;
  secondChoiceStart?: string;
  secondChoiceEnd?: string;
  allocatedChoice?: string | null;
}

interface RequestCardProps {
  request: VacationRequest;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  showActions?: boolean;
}

export default function RequestCard({ 
  request, 
  onApprove, 
  onDeny,
  showActions = true 
}: RequestCardProps) {
  return (
    <Card data-testid={`request-card-${request.id}`}>
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0 pb-4">
        <WorkerInfoCard
          name={request.workerName}
          joiningDate={request.joiningDate}
          yearsOfService={request.yearsOfService}
          weeksOfVacation={request.weeksOfVacation}
          department={request.department}
          compact
        />
        <StatusBadge status={request.status} />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {request.hasConflict && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
            <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Conflict Detected</p>
              <p className="text-xs text-muted-foreground mt-1">
                {request.conflictDetails || 'This request conflicts with staffing requirements'}
              </p>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {request.firstChoiceStart && request.firstChoiceEnd && request.secondChoiceStart && request.secondChoiceEnd ? (
            <>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">First Choice:</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.firstChoiceStart), 'MMM d, yyyy')} - {format(new Date(request.firstChoiceEnd), 'MMM d, yyyy')}
                </p>
                {request.allocatedChoice === 'first' && (
                  <span className="inline-flex items-center px-2 py-1 mt-2 rounded-md bg-success/10 text-success text-xs font-medium">
                    Allocated
                  </span>
                )}
              </div>
              
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Second Choice:</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(request.secondChoiceStart), 'MMM d, yyyy')} - {format(new Date(request.secondChoiceEnd), 'MMM d, yyyy')}
                </p>
                {request.allocatedChoice === 'second' && (
                  <span className="inline-flex items-center px-2 py-1 mt-2 rounded-md bg-success/10 text-success text-xs font-medium">
                    Allocated
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">First Choice:</p>
                <div className="flex flex-wrap gap-1">
                  {request.requestedWeeks
                    .filter(w => w.choice === 'first')
                    .map((w, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium"
                        data-testid={`week-first-${w.week}`}
                      >
                        Week {w.week}
                      </span>
                    ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-foreground mb-2">Second Choice:</p>
                <div className="flex flex-wrap gap-1">
                  {request.requestedWeeks
                    .filter(w => w.choice === 'second')
                    .map((w, idx) => (
                      <span 
                        key={idx}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-muted text-muted-foreground text-xs font-medium"
                        data-testid={`week-second-${w.week}`}
                      >
                        Week {w.week}
                      </span>
                    ))}
                </div>
              </div>
            </>
          )}
        </div>

        {showActions && request.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button
              className="flex-1 h-12"
              onClick={() => onApprove?.(request.id)}
              data-testid="button-approve"
            >
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-12"
              onClick={() => onDeny?.(request.id)}
              data-testid="button-deny"
            >
              <X className="h-4 w-4 mr-2" />
              Deny
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
