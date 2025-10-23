import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";
import { format, startOfWeek, addWeeks } from "date-fns";

interface VacationRequestFormProps {
  availableWeeks: number;
  onSubmit?: (firstChoice: Date[], secondChoice: Date[]) => void;
}

export default function VacationRequestForm({ availableWeeks, onSubmit }: VacationRequestFormProps) {
  const [firstChoice, setFirstChoice] = useState<Date[]>([]);
  const [secondChoice, setSecondChoice] = useState<Date[]>([]);

  // Generate 52 weeks for selection
  const generateWeeks = () => {
    const weeks = [];
    const today = new Date();
    const yearStart = new Date(today.getFullYear() + 1, 0, 1);
    
    for (let i = 0; i < 52; i++) {
      const weekStart = addWeeks(startOfWeek(yearStart, { weekStartsOn: 1 }), i);
      weeks.push(weekStart);
    }
    return weeks;
  };

  const weeks = generateWeeks();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting vacation request:', { firstChoice, secondChoice });
    onSubmit?.(firstChoice, secondChoice);
  };

  const toggleWeek = (week: Date, choice: 'first' | 'second') => {
    const setter = choice === 'first' ? setFirstChoice : setSecondChoice;
    const current = choice === 'first' ? firstChoice : secondChoice;
    
    const weekTime = week.getTime();
    const isSelected = current.some(w => w.getTime() === weekTime);
    
    if (isSelected) {
      setter(current.filter(w => w.getTime() !== weekTime));
    } else {
      if (current.length < availableWeeks) {
        setter([...current, week]);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card data-testid="vacation-request-form">
        <CardHeader>
          <CardTitle>Submit Vacation Request</CardTitle>
          <CardDescription>
            Select your first and second choice weeks for {new Date().getFullYear() + 1} vacation.
            You are entitled to {availableWeeks} weeks.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-base">
              First Choice ({firstChoice.length}/{availableWeeks} weeks selected)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {weeks.slice(0, 26).map((week, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={firstChoice.some(w => w.getTime() === week.getTime()) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleWeek(week, 'first')}
                  data-testid={`button-week-first-${idx}`}
                  className="justify-start"
                >
                  <Calendar className="h-3 w-3 mr-2" />
                  Week {idx + 1}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base">
              Second Choice ({secondChoice.length}/{availableWeeks} weeks selected)
            </Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {weeks.slice(0, 26).map((week, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant={secondChoice.some(w => w.getTime() === week.getTime()) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleWeek(week, 'second')}
                  data-testid={`button-week-second-${idx}`}
                  className="justify-start"
                >
                  <Calendar className="h-3 w-3 mr-2" />
                  Week {idx + 1}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12"
            disabled={firstChoice.length === 0 || secondChoice.length === 0}
            data-testid="button-submit-request"
          >
            Submit Vacation Request
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
