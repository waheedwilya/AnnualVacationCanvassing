import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { differenceInWeeks, format } from "date-fns";
import WeekPicker from "./WeekPicker";

interface VacationRequestFormProps {
  availableWeeks: number;
  onSubmit?: (firstChoice: { start: Date; end: Date }, secondChoice: { start: Date; end: Date }) => void;
}

export default function VacationRequestForm({ availableWeeks, onSubmit }: VacationRequestFormProps) {
  const [firstStart, setFirstStart] = useState<Date>();
  const [firstEnd, setFirstEnd] = useState<Date>();
  const [secondStart, setSecondStart] = useState<Date>();
  const [secondEnd, setSecondEnd] = useState<Date>();

  const handleFirstWeekSelect = (start: Date, end: Date) => {
    setFirstStart(start);
    setFirstEnd(end);
  };

  const handleSecondWeekSelect = (start: Date, end: Date) => {
    setSecondStart(start);
    setSecondEnd(end);
  };

  const calculateWeeks = (start?: Date, end?: Date) => {
    if (!start || !end) return 0;
    // Add 1 to differenceInWeeks since a Monday-Sunday range counts as 1 week
    const weeks = differenceInWeeks(end, start) + 1;
    return weeks > 0 ? weeks : 0;
  };

  const firstChoiceWeeks = calculateWeeks(firstStart, firstEnd);
  const secondChoiceWeeks = calculateWeeks(secondStart, secondEnd);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstStart || !firstEnd || !secondStart || !secondEnd) return;
    
    console.log('Submitting vacation request:', {
      first: { start: firstStart, end: firstEnd },
      second: { start: secondStart, end: secondEnd }
    });
    onSubmit?.({ start: firstStart, end: firstEnd }, { start: secondStart, end: secondEnd });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card data-testid="vacation-request-form">
        <CardHeader>
          <CardTitle>Submit Vacation Request</CardTitle>
          <CardDescription>
            Select your first and second choice weeks for 2026 vacation.
            You are entitled to {availableWeeks} weeks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Choice */}
          <div className="space-y-4">
            <WeekPicker
              selectedWeek={firstStart || null}
              onWeekSelect={handleFirstWeekSelect}
              label={`First Choice ${firstChoiceWeeks > 0 ? `(${firstChoiceWeeks} ${firstChoiceWeeks === 1 ? 'week' : 'weeks'})` : ''}`}
            />

            {firstChoiceWeeks > availableWeeks && (
              <p className="text-sm text-destructive">
                Selected range exceeds your {availableWeeks} week entitlement
              </p>
            )}
          </div>

          {/* Second Choice */}
          <div className="space-y-4">
            <WeekPicker
              selectedWeek={secondStart || null}
              onWeekSelect={handleSecondWeekSelect}
              label={`Second Choice ${secondChoiceWeeks > 0 ? `(${secondChoiceWeeks} ${secondChoiceWeeks === 1 ? 'week' : 'weeks'})` : ''}`}
            />

            {secondChoiceWeeks > availableWeeks && (
              <p className="text-sm text-destructive">
                Selected range exceeds your {availableWeeks} week entitlement
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full h-12"
            disabled={
              !firstStart || !firstEnd || !secondStart || !secondEnd ||
              firstChoiceWeeks === 0 || secondChoiceWeeks === 0 ||
              firstChoiceWeeks > availableWeeks || secondChoiceWeeks > availableWeeks
            }
            data-testid="button-submit-request"
          >
            Submit Vacation Request
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
