import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatusBadge, { type RequestStatus } from "./StatusBadge";
import { Calendar } from "lucide-react";
import { format, addDays } from "date-fns";

interface VacationRequest {
  id: string;
  choice: 'first' | 'second';
  weeks: number[];
  status: RequestStatus;
  submittedDate: Date;
  firstChoiceWeeks?: string[];
  secondChoiceWeeks?: string[];
}

interface MyRequestsListProps {
  requests: VacationRequest[];
}

function WeeksList({ weeks }: { weeks: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {weeks.map((weekStart, idx) => {
        const start = new Date(weekStart);
        const end = addDays(start, 6); // Monday to Sunday
        return (
          <span 
            key={idx}
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium"
            data-testid={`week-${weekStart}`}
          >
            {format(start, 'MMM d')} - {format(end, 'MMM d')}
          </span>
        );
      })}
    </div>
  );
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
        const showWeeks = request.firstChoiceWeeks && request.secondChoiceWeeks;
        
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
                      First Choice ({request.firstChoiceWeeks!.length} {request.firstChoiceWeeks!.length === 1 ? 'week' : 'weeks'}):
                    </p>
                    <WeeksList weeks={request.firstChoiceWeeks!} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">
                      Second Choice ({request.secondChoiceWeeks!.length} {request.secondChoiceWeeks!.length === 1 ? 'week' : 'weeks'}):
                    </p>
                    <WeeksList weeks={request.secondChoiceWeeks!} />
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
