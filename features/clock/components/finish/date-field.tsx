"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import CompactField from "@/features/clock/components/structures/compact-field";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const ISO_DATE = "yyyy-MM-dd";

// yyyy-mm-dd as a local date for the calendar.
function toLocalDate(date: string): Date | undefined {
  const [year, month, day] = date.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

// The tournament's date, picked from a calendar. value and onChange use
// yyyy-mm-dd, the date column's format.
function DateField({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (date: string) => void;
  className?: string;
}) {
  const date = toLocalDate(value);
  return (
    <CompactField htmlFor="finish-date" label="Date" className={className}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="finish-date"
            variant="outline"
            className="h-9 justify-start px-2 text-left text-sm font-normal"
          >
            <CalendarIcon className="size-4" />
            {date ? format(date, "PPP") : "Pick a date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(picked) => picked && onChange(format(picked, ISO_DATE))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </CompactField>
  );
}

export default DateField;
