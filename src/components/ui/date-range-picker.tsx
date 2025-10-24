"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DateRangePickerProps = {
  date: DateRange | undefined;
  onDateChange: (date: DateRange | undefined) => void;
  className?: string;
};

export function DateRangePicker({
  date,
  onDateChange,
  className,
}: DateRangePickerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = React.useState(false);

  // Predefined ranges
  const selectRange = (range: string) => {
    const today = new Date();
    const from = new Date();
    
    switch (range) {
      case "this-month":
        from.setDate(1);
        onDateChange({ from, to: today });
        break;
      case "last-month":
        from.setMonth(today.getMonth() - 1);
        from.setDate(1);
        const to = new Date(today.getFullYear(), today.getMonth(), 0);
        onDateChange({ from, to });
        break;
      case "this-year":
        from.setMonth(0);
        from.setDate(1);
        onDateChange({ from, to: today });
        break;
      case "last-year":
        from.setFullYear(today.getFullYear() - 1);
        from.setMonth(0);
        from.setDate(1);
        const lastYearEnd = new Date(today.getFullYear() - 1, 11, 31);
        onDateChange({ from, to: lastYearEnd });
        break;
      case "clear":
        onDateChange(undefined);
        break;
    }
    setIsPopoverOpen(false);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {date.from.toLocaleDateString()} - {date.to.toLocaleDateString()}
                </>
              ) : (
                date.from.toLocaleDateString()
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Select onValueChange={selectRange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Quick select..." />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
              <SelectItem value="clear">Clear Selection</SelectItem>
            </SelectContent>
          </Select>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={onDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
