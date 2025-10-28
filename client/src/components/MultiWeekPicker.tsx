import { useState } from "react";
import { format, startOfWeek, addWeeks, addDays, startOfDay, isSameDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface MultiWeekPickerProps {
  selectedWeeks: Date[];
  onWeeksChange: (weeks: Date[]) => void;
  label: string;
  maxWeeks: number;
  disabled?: boolean;
}

export default function MultiWeekPicker({ 
  selectedWeeks, 
  onWeeksChange, 
  label, 
  maxWeeks,
  disabled 
}: MultiWeekPickerProps) {
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
    while (weekStart <= monthEnd) {
      const weekEnd = startOfDay(addDays(weekStart, 6));
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
  
  const isWeekSelected = (weekStart: Date) => {
    return selectedWeeks.some(selected => isSameDay(selected, weekStart));
  };
  
  const handleWeekToggle = (weekStart: Date) => {
    console.log(`[${label}] Week clicked:`, format(weekStart, 'yyyy-MM-dd'));
    console.log(`[${label}] Currently selected weeks:`, selectedWeeks.map(w => format(w, 'yyyy-MM-dd')));
    console.log(`[${label}] Is week already selected?`, isWeekSelected(weekStart));
    
    if (isWeekSelected(weekStart)) {
      // Remove the week
      const newWeeks = selectedWeeks.filter(w => !isSameDay(w, weekStart));
      console.log(`[${label}] Removing week, new selection:`, newWeeks.map(w => format(w, 'yyyy-MM-dd')));
      onWeeksChange(newWeeks);
    } else {
      // Add the week if under the limit
      if (selectedWeeks.length < maxWeeks) {
        const newWeeks = [...selectedWeeks, weekStart];
        console.log(`[${label}] Adding week, new selection:`, newWeeks.map(w => format(w, 'yyyy-MM-dd')));
        onWeeksChange(newWeeks);
      } else {
        console.log(`[${label}] Cannot add week - limit reached (${selectedWeeks.length}/${maxWeeks})`);
      }
    }
  };
  
  const handleRemoveWeek = (weekStart: Date) => {
    onWeeksChange(selectedWeeks.filter(w => !isSameDay(w, weekStart)));
  };
  
  const sortedSelectedWeeks = [...selectedWeeks].sort((a, b) => a.getTime() - b.getTime());
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="text-sm text-muted-foreground">
          {selectedWeeks.length} / {maxWeeks} weeks selected
        </span>
      </div>
      
      {/* Selected weeks display */}
      {selectedWeeks.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortedSelectedWeeks.map((week, index) => {
            const weekEnd = startOfDay(addDays(week, 6));
            return (
              <Badge 
                key={index}
                variant="secondary"
                className="pl-3 pr-2 py-1.5 gap-2"
                data-testid={`selected-week-${format(week, 'yyyy-MM-dd')}`}
              >
                <span className="text-sm">
                  {format(week, 'MMM d')} - {format(weekEnd, 'MMM d')}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveWeek(week)}
                  disabled={disabled}
                  className="hover-elevate active-elevate-2 rounded-full p-0.5"
                  data-testid={`remove-week-${format(week, 'yyyy-MM-dd')}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
      
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
            const isSelected = isWeekSelected(week.start);
            const canSelect = selectedWeeks.length < maxWeeks || isSelected;
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleWeekToggle(week.start)}
                disabled={disabled || !canSelect}
                className={`
                  w-full min-h-[56px] px-4 py-3 rounded-md text-left transition-colors
                  ${isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : canSelect 
                      ? 'bg-muted hover-elevate active-elevate-2'
                      : 'bg-muted opacity-50 cursor-not-allowed'}
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
