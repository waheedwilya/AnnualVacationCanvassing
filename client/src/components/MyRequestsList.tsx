import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge, { type RequestStatus } from "./StatusBadge";
import { Calendar } from "lucide-react";
import { format } from "date-fns";

interface VacationRequest {
  id: string;
  choice: 'first' | 'second';
  weeks: number[];
  status: RequestStatus;
  submittedDate: Date;
  firstChoiceStart?: string;
  firstChoiceEnd?: string;
  secondChoiceStart?: string;
  secondChoiceEnd?: string;
}

interface MyRequestsListProps {
  requests: VacationRequest[];
}

export default function MyRequestsList({ requests }: MyRequestsListProps) {
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

  return (
    <div className="space-y-4" data-testid="my-requests-list">
      {requests.map((request) => {
        const showDates = request.firstChoiceStart && request.firstChoiceEnd && 
                         request.secondChoiceStart && request.secondChoiceEnd;
        
        return (
          <Card key={request.id} data-testid={`request-item-${request.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4">
              <CardTitle className="text-base font-medium">
                Vacation Request
              </CardTitle>
              <StatusBadge status={request.status} />
            </CardHeader>
            <CardContent className="space-y-4">
              {showDates ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">First Choice:</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.firstChoiceStart!), 'MMM d, yyyy')} - {format(new Date(request.firstChoiceEnd!), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Second Choice:</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(request.secondChoiceStart!), 'MMM d, yyyy')} - {format(new Date(request.secondChoiceEnd!), 'MMM d, yyyy')}
                    </p>
                  </div>
                  {(request.choice === 'first' || request.choice === 'second') && (
                    <p className="text-sm text-primary font-medium">
                      ✓ Allocated: {request.choice === 'first' ? 'First' : 'Second'} Choice
                    </p>
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
