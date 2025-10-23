import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, differenceInWeeks } from "date-fns";
import { cn } from "@/lib/utils";

interface VacationRequestFormProps {
  availableWeeks: number;
  onSubmit?: (firstChoice: { start: Date; end: Date }, secondChoice: { start: Date; end: Date }) => void;
}

export default function VacationRequestForm({ availableWeeks, onSubmit }: VacationRequestFormProps) {
  const [firstStart, setFirstStart] = useState<Date>();
  const [firstEnd, setFirstEnd] = useState<Date>();
  const [secondStart, setSecondStart] = useState<Date>();
  const [secondEnd, setSecondEnd] = useState<Date>();

  const calculateWeeks = (start?: Date, end?: Date) => {
    if (!start || !end) return 0;
    const weeks = Math.ceil(differenceInWeeks(end, start));
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

  const minDate = new Date(2026, 0, 1);
  const maxDate = new Date(2026, 11, 31);
  const defaultMonth = new Date(2026, 0);

  return (
    <form onSubmit={handleSubmit}>
      <Card data-testid="vacation-request-form">
        <CardHeader>
          <CardTitle>Submit Vacation Request</CardTitle>
          <CardDescription>
            Select your first and second choice date ranges for 2026 vacation.
            You are entitled to {availableWeeks} weeks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* First Choice */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              First Choice {firstChoiceWeeks > 0 && `(${firstChoiceWeeks} ${firstChoiceWeeks === 1 ? 'week' : 'weeks'})`}
            </Label>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal",
                        !firstStart && "text-muted-foreground"
                      )}
                      data-testid="button-first-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {firstStart ? format(firstStart, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={firstStart}
                      onSelect={setFirstStart}
                      disabled={(date) => date < minDate || date > maxDate}
                      defaultMonth={defaultMonth}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal",
                        !firstEnd && "text-muted-foreground"
                      )}
                      data-testid="button-first-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {firstEnd ? format(firstEnd, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={firstEnd}
                      onSelect={setFirstEnd}
                      disabled={(date) => {
                        if (date < minDate || date > maxDate) return true;
                        if (firstStart && date < firstStart) return true;
                        return false;
                      }}
                      defaultMonth={defaultMonth}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {firstChoiceWeeks > availableWeeks && (
              <p className="text-sm text-destructive">
                Selected range exceeds your {availableWeeks} week entitlement
              </p>
            )}
          </div>

          {/* Second Choice */}
          <div className="space-y-4">
            <Label className="text-base font-medium">
              Second Choice {secondChoiceWeeks > 0 && `(${secondChoiceWeeks} ${secondChoiceWeeks === 1 ? 'week' : 'weeks'})`}
            </Label>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal",
                        !secondStart && "text-muted-foreground"
                      )}
                      data-testid="button-second-start-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {secondStart ? format(secondStart, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={secondStart}
                      onSelect={setSecondStart}
                      disabled={(date) => date < minDate || date > maxDate}
                      defaultMonth={defaultMonth}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal",
                        !secondEnd && "text-muted-foreground"
                      )}
                      data-testid="button-second-end-date"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {secondEnd ? format(secondEnd, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={secondEnd}
                      onSelect={setSecondEnd}
                      disabled={(date) => {
                        if (date < minDate || date > maxDate) return true;
                        if (secondStart && date < secondStart) return true;
                        return false;
                      }}
                      defaultMonth={defaultMonth}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

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
