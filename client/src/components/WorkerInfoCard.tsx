import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { CalendarDays, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface WorkerInfoCardProps {
  name: string;
  joiningDate: Date;
  yearsOfService: number;
  weeksOfVacation: number;
  department?: string;
  compact?: boolean;
}

export default function WorkerInfoCard({ 
  name, 
  joiningDate, 
  yearsOfService, 
  weeksOfVacation,
  department,
  compact = false 
}: WorkerInfoCardProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  if (compact) {
    return (
      <div className="flex items-center gap-3" data-testid="worker-info-compact">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate" data-testid="text-worker-name">
            {name}
          </p>
          <p className="text-sm text-muted-foreground" data-testid="text-worker-seniority">
            {yearsOfService} years · {weeksOfVacation} weeks vacation
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="p-6" data-testid="worker-info-card">
      <div className="flex items-start gap-4">
        <Avatar className="h-12 w-12">
          <AvatarFallback className="bg-primary text-primary-foreground text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-lg text-foreground mb-2" data-testid="text-worker-name">
            {name}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span data-testid="text-joining-date">
                Joined: {format(joiningDate, 'MMM d, yyyy')} ({yearsOfService} years)
              </span>
            </div>
            {department && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span data-testid="text-department">{department}</span>
              </div>
            )}
            <div className="text-sm font-medium text-foreground">
              Vacation Entitlement: <span className="text-primary" data-testid="text-vacation-weeks">{weeksOfVacation} weeks</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
