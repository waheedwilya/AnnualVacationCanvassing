import { useState } from "react";
import { format, startOfWeek, addWeeks, addDays, startOfDay, isSameDay } from "date-fns";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, ChevronUp, ChevronDown } from "lucide-react";

interface PriorityWeeksPickerProps {
  selectedWeeks: Date[];
  onWeeksChange: (weeks: Date[]) => void;
  maxWeeks: number;
  disabled?: boolean;
  conflictingWeeks?: string[]; // Weeks with senior worker conflicts (yellow warning)
  departmentLimitWeeks?: string[]; // Weeks where department limit is reached (red warning)
}

export default function PriorityWeeksPicker({ 
  selectedWeeks, 
  onWeeksChange, 
  maxWeeks,
  disabled,
  conflictingWeeks = [],
  departmentLimitWeeks = []
}: PriorityWeeksPickerProps) {
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
  
  const getWeekStatus = (weekStart: Date): 'normal' | 'conflict' | 'limit' => {
    const weekStr = format(weekStart, 'yyyy-MM-dd');
    if (departmentLimitWeeks.includes(weekStr)) return 'limit';
    if (conflictingWeeks.includes(weekStr)) return 'conflict';
    return 'normal';
  };
  
  const handleWeekToggle = (weekStart: Date) => {
    const weekStr = format(weekStart, 'yyyy-MM-dd');
    
    // Check if department limit reached
    if (departmentLimitWeeks.includes(weekStr)) {
      return; // Cannot select
    }
    
    if (isWeekSelected(weekStart)) {
      // Remove the week
      const newWeeks = selectedWeeks.filter(w => !isSameDay(w, weekStart));
      onWeeksChange(newWeeks);
    } else {
      // Add the week if under the limit
      if (selectedWeeks.length < maxWeeks) {
        // Add to end of list (lowest priority)
        const newWeeks = [...selectedWeeks, weekStart];
        onWeeksChange(newWeeks);
      }
    }
  };
  
  const handleRemoveWeek = (weekStart: Date) => {
    onWeeksChange(selectedWeeks.filter(w => !isSameDay(w, weekStart)));
  };
  
  const handleMoveWeek = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === selectedWeeks.length - 1) return;
    
    const newWeeks = [...selectedWeeks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newWeeks[index], newWeeks[targetIndex]] = [newWeeks[targetIndex], newWeeks[index]];
    onWeeksChange(newWeeks);
  };
  
  const sortedSelectedWeeks = [...selectedWeeks]; // Keep order as priority
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Priority Weeks</label>
        <span className="text-sm text-muted-foreground">
          {selectedWeeks.length} / {maxWeeks} weeks selected
        </span>
      </div>
      
      {/* Selected weeks display with priority numbers */}
      {selectedWeeks.length > 0 && (
        <div className="space-y-2">
          {sortedSelectedWeeks.map((week, index) => {
            const weekEnd = startOfDay(addDays(week, 6));
            const weekStr = format(week, 'yyyy-MM-dd');
            const status = getWeekStatus(week);
            const isConflict = conflictingWeeks.includes(weekStr);
            const isLimit = departmentLimitWeeks.includes(weekStr);
            
            return (
              <div 
                key={`${week.getTime()}-${index}`}
                className={`flex items-center gap-2 p-3 rounded-md border ${
                  isConflict ? 'border-yellow-500 bg-yellow-50' : 
                  isLimit ? 'border-red-500 bg-red-50' : 
                  'border-border bg-card'
                }`}
                data-testid={`selected-week-${format(week, 'yyyy-MM-dd')}`}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium">
                    {format(week, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                  </span>
                  {isConflict && (
                    <span className="text-xs text-yellow-700 font-medium">
                      ⚠ Senior worker requested
                    </span>
                  )}
                  {isLimit && (
                    <span className="text-xs text-red-700 font-medium">
                      ✗ Department limit reached
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleMoveWeek(index, 'up')}
                    disabled={disabled || index === 0}
                    title="Move up"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleMoveWeek(index, 'down')}
                    disabled={disabled || index === selectedWeeks.length - 1}
                    title="Move down"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={() => handleRemoveWeek(week)}
                    disabled={disabled}
                    title="Remove"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
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
            const status = getWeekStatus(week.start);
            const weekStr = format(week.start, 'yyyy-MM-dd');
            const isConflict = conflictingWeeks.includes(weekStr);
            const isLimit = departmentLimitWeeks.includes(weekStr);
            
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleWeekToggle(week.start)}
                disabled={disabled || !canSelect || isLimit}
                className={`
                  w-full min-h-[56px] px-4 py-3 rounded-md text-left transition-colors
                  ${isSelected 
                    ? 'bg-primary text-primary-foreground' 
                    : isLimit
                      ? 'bg-red-50 border-2 border-red-300 opacity-60 cursor-not-allowed'
                      : isConflict
                        ? 'bg-yellow-50 border-2 border-yellow-300'
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
                    {!isSelected && isConflict && (
                      <p className="text-xs text-yellow-700 font-medium mt-1">
                        ⚠ Senior worker requested
                      </p>
                    )}
                    {!isSelected && isLimit && (
                      <p className="text-xs text-red-700 font-medium mt-1">
                        ✗ Department limit reached
                      </p>
                    )}
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
