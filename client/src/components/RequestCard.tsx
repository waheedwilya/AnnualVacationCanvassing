import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle } from "lucide-react";
import { format, addDays } from "date-fns";
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
  firstChoiceWeeks?: string[];
  secondChoiceWeeks?: string[];
  allocatedChoice?: string | null;
}

interface RequestCardProps {
  request: VacationRequest;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  showActions?: boolean;
}

function WeeksList({ weeks, isAllocated }: { weeks: string[]; isAllocated?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {weeks.map((weekStart, idx) => {
        const start = new Date(weekStart);
        const end = addDays(start, 6); // Monday to Sunday
        return (
          <span 
            key={idx}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
              isAllocated 
                ? 'bg-success/10 text-success' 
                : 'bg-primary/10 text-primary'
            }`}
            data-testid={`week-${weekStart}`}
          >
            {format(start, 'MMM d')} - {format(end, 'MMM d')}
          </span>
        );
      })}
    </div>
  );
}

export default function RequestCard({ 
  request, 
  onApprove, 
  onDeny,
  showActions = true 
}: RequestCardProps) {
  const showWeeks = request.firstChoiceWeeks && request.secondChoiceWeeks;

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
          {showWeeks ? (
            <>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  First Choice ({request.firstChoiceWeeks!.length} {request.firstChoiceWeeks!.length === 1 ? 'week' : 'weeks'}):
                </p>
                <WeeksList 
                  weeks={request.firstChoiceWeeks!} 
                  isAllocated={request.allocatedChoice === 'first'}
                />
              </div>
              
              <div>
                <p className="text-sm font-medium text-foreground mb-2">
                  Second Choice ({request.secondChoiceWeeks!.length} {request.secondChoiceWeeks!.length === 1 ? 'week' : 'weeks'}):
                </p>
                <WeeksList 
                  weeks={request.secondChoiceWeeks!} 
                  isAllocated={request.allocatedChoice === 'second'}
                />
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
