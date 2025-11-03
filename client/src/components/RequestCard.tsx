import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, AlertTriangle, Save } from "lucide-react";
import { format, addDays } from "date-fns";
import { useState, useEffect } from "react";
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
  approvedWeeks?: string[];
  deniedWeeks?: string[];
}

interface RequestCardProps {
  request: VacationRequest;
  onApprove?: (id: string) => void;
  onDeny?: (id: string) => void;
  onUpdateWeeks?: (id: string, approvedWeeks: string[], deniedWeeks: string[]) => void;
  showActions?: boolean;
}

interface WeekWithActionsProps {
  week: string;
  choice: 'first' | 'second';
  isApproved: boolean;
  isDenied: boolean;
  onToggleApprove: () => void;
  onToggleDeny: () => void;
  disabled?: boolean;
}

function WeekWithActions({ 
  week, 
  choice, 
  isApproved, 
  isDenied, 
  onToggleApprove, 
  onToggleDeny,
  disabled = false
}: WeekWithActionsProps) {
  const start = new Date(week);
  const end = addDays(start, 6);
  
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg border bg-card">
      <div className="flex-1">
        <div className="text-sm font-medium text-foreground">
          {format(start, 'MMM d')} - {format(end, 'MMM d')}
        </div>
        <div className="text-xs text-muted-foreground">
          {choice === 'first' ? 'First Choice' : 'Second Choice'}
        </div>
      </div>
      <div className="flex gap-1">
        <Button
          size="sm"
          variant={isApproved ? "default" : "outline"}
          onClick={onToggleApprove}
          disabled={disabled}
          className="h-8 w-20"
          data-testid={`approve-week-${week}`}
        >
          <Check className="h-3 w-3 mr-1" />
          {isApproved ? 'Approved' : 'Approve'}
        </Button>
        <Button
          size="sm"
          variant={isDenied ? "destructive" : "outline"}
          onClick={onToggleDeny}
          disabled={disabled}
          className="h-8 w-16"
          data-testid={`deny-week-${week}`}
        >
          <X className="h-3 w-3 mr-1" />
          {isDenied ? 'Denied' : 'Deny'}
        </Button>
      </div>
    </div>
  );
}

export default function RequestCard({ 
  request, 
  onApprove, 
  onDeny,
  onUpdateWeeks,
  showActions = true 
}: RequestCardProps) {
  const showWeeks = request.firstChoiceWeeks && request.secondChoiceWeeks;
  
  // Initialize state from request data
  const [approvedWeeks, setApprovedWeeks] = useState<Set<string>>(
    new Set(request.approvedWeeks || [])
  );
  const [deniedWeeks, setDeniedWeeks] = useState<Set<string>>(
    new Set(request.deniedWeeks || [])
  );
  const [hasChanges, setHasChanges] = useState(false);
  
  // Sync state when props change (e.g., after auto-allocation or other supervisor edits)
  useEffect(() => {
    setApprovedWeeks(new Set(request.approvedWeeks || []));
    setDeniedWeeks(new Set(request.deniedWeeks || []));
    setHasChanges(false);
  }, [request.approvedWeeks, request.deniedWeeks, request.id]);
  
  const handleToggleApprove = (week: string) => {
    const newApproved = new Set(approvedWeeks);
    const newDenied = new Set(deniedWeeks);
    
    if (newApproved.has(week)) {
      newApproved.delete(week);
    } else {
      newApproved.add(week);
      newDenied.delete(week); // Can't be both approved and denied
    }
    
    setApprovedWeeks(newApproved);
    setDeniedWeeks(newDenied);
    setHasChanges(true);
  };
  
  const handleToggleDeny = (week: string) => {
    const newApproved = new Set(approvedWeeks);
    const newDenied = new Set(deniedWeeks);
    
    if (newDenied.has(week)) {
      newDenied.delete(week);
    } else {
      newDenied.add(week);
      newApproved.delete(week); // Can't be both approved and denied
    }
    
    setApprovedWeeks(newApproved);
    setDeniedWeeks(newDenied);
    setHasChanges(true);
  };
  
  const handleSave = () => {
    if (onUpdateWeeks) {
      onUpdateWeeks(request.id, Array.from(approvedWeeks), Array.from(deniedWeeks));
      setHasChanges(false);
    }
  };
  
  // Combine all weeks from both choices
  const allWeeks = [
    ...(request.firstChoiceWeeks || []).map(week => ({ week, choice: 'first' as const })),
    ...(request.secondChoiceWeeks || []).map(week => ({ week, choice: 'second' as const })),
  ];

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

        {showWeeks && showActions && request.status === 'pending' ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                Requested Weeks ({allWeeks.length} total)
              </p>
              {hasChanges && (
                <Button
                  size="sm"
                  onClick={handleSave}
                  data-testid="button-save-weeks"
                >
                  <Save className="h-3 w-3 mr-1" />
                  Save Changes
                </Button>
              )}
            </div>
            
            <div className="space-y-2">
              {allWeeks.map(({ week, choice }) => (
                <WeekWithActions
                  key={week}
                  week={week}
                  choice={choice}
                  isApproved={approvedWeeks.has(week)}
                  isDenied={deniedWeeks.has(week)}
                  onToggleApprove={() => handleToggleApprove(week)}
                  onToggleDeny={() => handleToggleDeny(week)}
                />
              ))}
            </div>
          </div>
        ) : showWeeks ? (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                First Choice ({request.firstChoiceWeeks!.length} {request.firstChoiceWeeks!.length === 1 ? 'week' : 'weeks'}):
              </p>
              <div className="flex flex-wrap gap-2">
                {request.firstChoiceWeeks!.map((weekStart) => {
                  const start = new Date(weekStart);
                  const end = addDays(start, 6);
                  const isApproved = request.approvedWeeks?.includes(weekStart);
                  const isDenied = request.deniedWeeks?.includes(weekStart);
                  return (
                    <span 
                      key={weekStart}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                        isApproved
                          ? 'bg-success/10 text-success' 
                          : isDenied
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                      data-testid={`week-${weekStart}`}
                    >
                      {format(start, 'MMM d')} - {format(end, 'MMM d')}
                      {isApproved && <Check className="h-3 w-3 ml-2" />}
                      {isDenied && <X className="h-3 w-3 ml-2" />}
                    </span>
                  );
                })}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Second Choice ({request.secondChoiceWeeks!.length} {request.secondChoiceWeeks!.length === 1 ? 'week' : 'weeks'}):
              </p>
              <div className="flex flex-wrap gap-2">
                {request.secondChoiceWeeks!.map((weekStart) => {
                  const start = new Date(weekStart);
                  const end = addDays(start, 6);
                  const isApproved = request.approvedWeeks?.includes(weekStart);
                  const isDenied = request.deniedWeeks?.includes(weekStart);
                  return (
                    <span 
                      key={weekStart}
                      className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium ${
                        isApproved
                          ? 'bg-success/10 text-success' 
                          : isDenied
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-primary/10 text-primary'
                      }`}
                      data-testid={`week-${weekStart}`}
                    >
                      {format(start, 'MMM d')} - {format(end, 'MMM d')}
                      {isApproved && <Check className="h-3 w-3 ml-2" />}
                      {isDenied && <X className="h-3 w-3 ml-2" />}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
