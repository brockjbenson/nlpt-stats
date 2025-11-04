"use client";

import React from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
} from "@/components/ui/select";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  triggerStyles?: string;
  contentStyles?: string;
  itemStyles?: string;
  triggerTitle?: string;
  isAdmin?: boolean;
}

function CareerStatSelector({ triggerStyles, triggerTitle }: Props) {
  const [open, setOpen] = React.useState(false);
  return (
    <Select onOpenChange={setOpen} open={open}>
      <SelectTrigger
        className={cn(
          "bg-transparent mx-auto h-fit p-0 flex items-center gap-1 text-xl font-bold w-fit",
          triggerStyles
        )}>
        {`${triggerTitle} Stats`}
      </SelectTrigger>
      <SelectContent className="!max-w-12">
        <SelectGroup className="flex w-full flex-col">
          <div className="flex w-full flex-col">
            <Link
              onClick={() => setOpen(false)}
              className="w-full py-2 pl-2 pr-4 hover:bg-neutral-800"
              href={`/stats/career?view=all`}>
              All
            </Link>
            <Link
              onClick={() => setOpen(false)}
              className="w-full py-2 pl-2 pr-4 hover:bg-neutral-800"
              href={`/stats/career?view=cash`}>
              Cash
            </Link>
            <Link
              onClick={() => setOpen(false)}
              className="w-full py-2 pl-2 pr-4 hover:bg-neutral-800"
              href={`/stats/career?view=tournament`}>
              Tournament
            </Link>
          </div>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export default CareerStatSelector;
