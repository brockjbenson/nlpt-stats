"use client";

import { Season } from "@/utils/types";
import React, { useEffect } from "react";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { GiBackwardTime } from "react-icons/gi";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { LuListFilter } from "react-icons/lu";

interface Props {
  seasons: Season[];
}

function NLPIDatePicker({ seasons }: Props) {
  const currentDate = new Date();
  const router = useRouter();
  const [selectedDate, setSelectedDate] = React.useState<Date>();

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    router.push(`/nlpi?date=${date.toISOString()}`);
  };

  const handleRemoveDate = () => {
    setSelectedDate(undefined);
    router.push("/nlpi");
  };

  useEffect(() => {
    if (selectedDate) {
      handleDateChange(selectedDate);
    }
  }, [selectedDate]);
  return (
    <>
      <Popover>
        <div className="flex flex-col items-end">
          <PopoverTrigger asChild>
            <button className="bg-background border border-neutral-600 rounded px-4 py-2 flex items-center gap-2">
              Filter
              <LuListFilter />
            </button>
          </PopoverTrigger>
        </div>
        <PopoverContent className="w-auto p-0">
          <Calendar
            defaultMonth={selectedDate ? selectedDate : currentDate}
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
          />
        </PopoverContent>
      </Popover>
      {selectedDate && (
        <div className=" col-span-2 mt-4 justify-center flex items-center gap-3">
          <p className="text-white text-lg font-medium">Rankings for</p>
          <div className="flex bg-neutral-800 rounded p-2 items-center gap-2">
            <p className="font-semibold">
              {new Date(selectedDate).toLocaleDateString()}
            </p>
            <button
              className="bg-neutral-600 rounded-full p-1"
              onClick={handleRemoveDate}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default NLPIDatePicker;
