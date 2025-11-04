"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
} from "@/components/ui/select";
import { Season } from "@/utils/types";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  activeSeason: Season;
  seasons: Season[];
  triggerStyles?: string;
  contentStyles?: string;
  itemStyles?: string;
  triggerTitle?: string;
  isAdmin?: boolean;
}

function CashYearSelector({
  activeSeason,
  seasons,
  triggerStyles,
  triggerTitle,
  isAdmin = false,
}: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <Select onOpenChange={setOpen} open={open}>
      <SelectTrigger
        className={cn(
          "bg-transparent mx-auto h-fit p-0 flex items-center gap-1 text-xl font-bold w-fit",
          triggerStyles
        )}>
        {triggerTitle ? triggerTitle : `${activeSeason.year} Cash Stats`}
      </SelectTrigger>
      <SelectContent>
        <SelectGroup className="flex w-full flex-col">
          <div key={activeSeason.id} className="flex w-full flex-col">
            {seasons.map((season) => (
              <Link
                onClick={() => setOpen(false)}
                key={season.id + season.year}
                className="w-full py-2 pl-2 pr-4 hover:bg-neutral-800"
                href={
                  isAdmin
                    ? `/admin/stats/cash?year=${season.year}`
                    : `/stats/cash?year=${season.year}`
                }>
                {season.year}
              </Link>
            ))}
          </div>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default CashYearSelector;
