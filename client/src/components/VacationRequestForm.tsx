import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import PriorityWeeksPicker from "./PriorityWeeksPicker";

interface VacationRequestFormProps {
  availableWeeks: number;
  isSubmitting?: boolean;
  onSubmit?: (prioritizedWeeks: Date[]) => void;
  conflictingWeeks?: string[]; // Weeks with senior worker conflicts
  departmentLimitWeeks?: string[]; // Weeks where department limit reached
}

export default function VacationRequestForm({ 
  availableWeeks, 
  isSubmitting = false, 
  onSubmit,
  conflictingWeeks = [],
  departmentLimitWeeks = []
}: VacationRequestFormProps) {
  const requiredWeeks = availableWeeks * 2; // Must select exactly 2× entitlement
  const [prioritizedWeeks, setPrioritizedWeeks] = useState<Date[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prioritizedWeeks.length !== requiredWeeks) return;
    
    onSubmit?.(prioritizedWeeks);
  };

  const isFormValid = prioritizedWeeks.length === requiredWeeks;

  return (
    <form onSubmit={handleSubmit}>
      <Card data-testid="vacation-request-form">
        <CardHeader>
          <CardTitle>Submit Vacation Request</CardTitle>
          <CardDescription>
            Select exactly {requiredWeeks} priority weeks in order of preference (most preferred first).
            {availableWeeks === 0 ? (
              <span className="text-destructive font-medium block mt-2">
                You need at least 1 year of service to be eligible for vacation.
              </span>
            ) : (
              <span className="font-medium block mt-2">
                You are entitled to {availableWeeks} {availableWeeks === 1 ? 'week' : 'weeks'} based on your seniority.
                You must select {requiredWeeks} priority weeks (2× your entitlement).
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <PriorityWeeksPicker
            selectedWeeks={prioritizedWeeks}
            onWeeksChange={setPrioritizedWeeks}
            maxWeeks={requiredWeeks}
            disabled={availableWeeks === 0 || isSubmitting}
            conflictingWeeks={conflictingWeeks}
            departmentLimitWeeks={departmentLimitWeeks}
          />

          <Button 
            type="submit" 
            className="w-full h-12"
            disabled={!isFormValid || availableWeeks === 0 || isSubmitting}
            data-testid="button-submit-request"
          >
            {isSubmitting ? 'Submitting...' : `Submit Vacation Request (${prioritizedWeeks.length}/${requiredWeeks} weeks)`}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
