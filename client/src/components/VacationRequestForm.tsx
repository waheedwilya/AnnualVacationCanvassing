import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import MultiWeekPicker from "./MultiWeekPicker";

interface VacationRequestFormProps {
  availableWeeks: number;
  onSubmit?: (firstChoiceWeeks: Date[], secondChoiceWeeks: Date[]) => void;
}

export default function VacationRequestForm({ availableWeeks, onSubmit }: VacationRequestFormProps) {
  const [firstChoiceWeeks, setFirstChoiceWeeks] = useState<Date[]>([]);
  const [secondChoiceWeeks, setSecondChoiceWeeks] = useState<Date[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstChoiceWeeks.length === 0 || secondChoiceWeeks.length === 0) return;
    
    console.log('Submitting vacation request:', {
      firstChoice: firstChoiceWeeks.map(w => format(w, 'yyyy-MM-dd')),
      secondChoice: secondChoiceWeeks.map(w => format(w, 'yyyy-MM-dd'))
    });
    
    onSubmit?.(firstChoiceWeeks, secondChoiceWeeks);
  };

  const isFormValid = firstChoiceWeeks.length > 0 && 
                      secondChoiceWeeks.length > 0 &&
                      firstChoiceWeeks.length <= availableWeeks &&
                      secondChoiceWeeks.length <= availableWeeks;

  return (
    <form onSubmit={handleSubmit}>
      <Card data-testid="vacation-request-form">
        <CardHeader>
          <CardTitle>Submit Vacation Request</CardTitle>
          <CardDescription>
            Select up to {availableWeeks} separate weeks for each choice.
            {availableWeeks === 0 ? (
              <span className="text-destructive font-medium block mt-2">
                You need at least 1 year of service to be eligible for vacation.
              </span>
            ) : (
              <span className="font-medium block mt-2">
                You are entitled to {availableWeeks} {availableWeeks === 1 ? 'week' : 'weeks'} based on your seniority.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Choice */}
          <div className="space-y-4">
            <MultiWeekPicker
              selectedWeeks={firstChoiceWeeks}
              onWeeksChange={setFirstChoiceWeeks}
              maxWeeks={availableWeeks}
              label="First Choice"
              disabled={availableWeeks === 0}
            />
          </div>

          {/* Second Choice */}
          <div className="space-y-4">
            <MultiWeekPicker
              selectedWeeks={secondChoiceWeeks}
              onWeeksChange={setSecondChoiceWeeks}
              maxWeeks={availableWeeks}
              label="Second Choice"
              disabled={availableWeeks === 0}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full h-12"
            disabled={!isFormValid || availableWeeks === 0}
            data-testid="button-submit-request"
          >
            Submit Vacation Request
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
