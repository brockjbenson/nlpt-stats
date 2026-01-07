"use client";

import React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { NLPIData } from "../lib/types";
import { ChevronDown } from "lucide-react";

interface Props {
  nlpiData: NLPIData[];
}

function NLPICalculator({ nlpiData }: Props) {
  const [selectedMemberData, setSelectedMemberData] = React.useState<
    NLPIData["session_coming_off"] | null
  >(null);

  const handleMemberDataChange = (memberId: string) => {
    const memberData = nlpiData.find((data) => data.member_id === memberId);
    setSelectedMemberData(memberData?.session_coming_off || null);
  };

  return (
    <Drawer>
      <DrawerTrigger className="text-sm underline text-muted">
        Session being dropped
      </DrawerTrigger>
      <DrawerContent>
        <DrawerTitle>NLPI Session Coming Off</DrawerTitle>
        <div className="mt-6">
          <Label>Members</Label>
          <Select onValueChange={(value) => handleMemberDataChange(value)}>
            <SelectTrigger className="border mt-2 border-border">
              <SelectValue placeholder="Select a member" />
              <ChevronDown />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {[...nlpiData]
                  .sort((a, b) => a.first_name.localeCompare(b.first_name))
                  .map((data) => (
                    <SelectItem value={data.member_id} key={data.member_id}>
                      {data.first_name} {data.last_name}
                    </SelectItem>
                  ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          {selectedMemberData ? (
            <div className="grid gap-4 mt-8 w-full max-w-75 relative left-4 mx-auto grid-cols-2">
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted">Net Profit</p>
                <p
                  className={cn(
                    "text-2xl font-bold",
                    getProfitTextColor(selectedMemberData.net_profit)
                  )}>
                  {formatMoney(selectedMemberData.net_profit)}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted">NLPI Points</p>
                <p className={cn("text-2xl font-bold")}>
                  {selectedMemberData.nlpi_points}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted">Week</p>
                <p className={cn("text-2xl font-bold")}>
                  {selectedMemberData.week}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2">
                <p className="text-sm text-muted">Year</p>
                <p className={cn("text-2xl font-bold")}>
                  {selectedMemberData.season}
                </p>
              </div>
            </div>
          ) : (
            <p className="w-full mt-12 text-muted text-center">
              Select a member to see session data
            </p>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default NLPICalculator;
