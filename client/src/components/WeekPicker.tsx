import { useState } from "react";
import { format, startOfWeek, endOfWeek, addWeeks, addDays, startOfDay, isSameWeek } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface WeekPickerProps {
  selectedWeek: Date | null;
  onWeekSelect: (weekStart: Date, weekEnd: Date) => void;
  label: string;
  disabled?: boolean;
}

export default function WeekPicker({ selectedWeek, onWeekSelect, label, disabled }: WeekPickerProps) {
  const year2026 = new Date(2026, 0, 1);
  const [currentMonth, setCurrentMonth] = useState(0); // 0 = January, 11 = December
  
  // Get all weeks in the current month view
  const getWeeksInMonth = (monthIndex: number) => {
    const weeks: { start: Date; end: Date; weekNumber: number }[] = [];
    const monthStart = new Date(2026, monthIndex, 1);
    const monthEnd = new Date(2026, monthIndex + 1, 0);
    
    // Start from the first Monday on or before the month start
    let weekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    let weekNumber = 1;
    
    // Generate weeks until the week start is past the end of the month
    // This ensures we capture all weeks that have at least one day in the month
    while (weekStart <= monthEnd) {
      // Calculate end as Sunday at start of day to avoid timezone issues
      // endOfWeek returns 23:59:59 which can shift to next day in some timezones
      const weekEnd = startOfDay(addDays(weekStart, 6));
      
      // Include this week - it has at least one day in the month
      weeks.push({
        start: weekStart,
        end: weekEnd,
        weekNumber: weekNumber++
      });
      
      weekStart = addWeeks(weekStart, 1);
    }
    
    return weeks;
  };
  
  const weeks = getWeeksInMonth(currentMonth);
  const monthName = format(new Date(2026, currentMonth, 1), 'MMMM yyyy');
  
  const handlePrevMonth = () => {
    if (currentMonth > 0) setCurrentMonth(currentMonth - 1);
  };
  
  const handleNextMonth = () => {
    if (currentMonth < 11) setCurrentMonth(currentMonth + 1);
  };
  
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      
      <Card className="p-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handlePrevMonth}
            disabled={disabled || currentMonth === 0}
            data-testid="button-prev-month"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h3 className="text-lg font-semibold">{monthName}</h3>
          
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleNextMonth}
            disabled={disabled || currentMonth === 11}
            data-testid="button-next-month"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Week list */}
        <div className="space-y-2">
          {weeks.map((week, index) => {
            const isSelected = selectedWeek && isSameWeek(selectedWeek, week.start, { weekStartsOn: 1 });
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => onWeekSelect(week.start, week.end)}
                disabled={disabled}
                className={`
                  w-full min-h-[56px] px-4 py-3 rounded-md text-left transition-colors
                  ${isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover-elevate active-elevate-2'}
                  ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                data-testid={`week-${format(week.start, 'yyyy-MM-dd')}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      Week {index + 1}
                    </p>
                    <p className={`text-sm ${isSelected ? 'text-primary-foreground/90' : 'text-muted-foreground'}`}>
                      {format(week.start, 'MMM d')} - {format(week.end, 'MMM d, yyyy')}
                    </p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                      <div className="w-3 h-3 rounded-full bg-primary-foreground" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
