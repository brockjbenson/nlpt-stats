"use client";

import { BackButton } from "@/components/ui/back-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CashSession, Member, Season, Week } from "@/utils/types";
import { SelectItem } from "@radix-ui/react-select";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

interface Props {
  session: CashSession & {
    week: Week;
    member: Member;
    season: Season;
  };
  weeks: Week[];
  members: Member[];
  seasons: Season[];
}

function EditSessionForm({ session, weeks, members, seasons }: Props) {
  const router = useRouter();
  const [id, setId] = useState(session.id);
  const [seasonId, setSeasonId] = useState(session.seasonId);
  const [weekId, setWeekId] = useState(session.weekId);
  const [memberId, setMemberId] = useState(session.memberId);
  const [buyIn, setBuyIn] = useState(session.buyIn);
  const [cashOut, setCashOut] = useState(session.cashOut);
  const [netProfit, setNetProfit] = useState(session.netProfit);
  const [rebuys, setRebuys] = useState(session.rebuys);
  const [selectWeeks, setSelectWeeks] = useState<Week[]>(
    weeks.filter((week) => week.seasonId === seasonId)
  );

  console.log(router);

  const getSeasonWeeks = async (seasonId: string) => {
    const seasonWeeks = weeks?.filter((week) => week.seasonId === seasonId);

    if (seasonWeeks) {
      setSelectWeeks(seasonWeeks);
    }
  };

  const getSeasonYear = (seasonId: string) => {
    const season = seasons.find((season) => season.id === seasonId);
    return season?.year;
  };

  const getWeekNumber = (weekId: string) => {
    const week = selectWeeks.find((week) => week.id === weekId);
    return week?.weekNumber;
  };

  const getMemberName = (memberId: string) => {
    const member = members.find((member) => member.id === memberId);
    return member?.firstName;
  };

  return (
    <div className="grid grid-cols-2 w-full px-4 max-w-2xl mx-auto gap-4 items-center">
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="buyIn">Buy In</Label>
        <span className="relative flex items-center">
          <span className="absolute left-2">$</span>
          <Input
            className="pl-6"
            type="number"
            id="buyIn"
            step={0.05}
            value={buyIn}
            onChange={(e) => setBuyIn(Number(e.target.value))}
          />
        </span>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="cashOut">Cash Out</Label>
        <span className="relative flex items-center">
          <span className="absolute left-2">$ </span>
          <Input
            className="pl-6"
            type="number"
            id="cashOut"
            step={0.05}
            value={cashOut}
            onChange={(e) => setCashOut(Number(e.target.value))}
          />
        </span>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="netProfit">Net Profit</Label>
        <span className="relative flex items-center">
          <span className="absolute left-2">$ </span>
          <Input
            className="pl-6"
            type="number"
            id="netProfit"
            value={netProfit.toFixed(2)}
            readOnly
            onChange={(e) => setNetProfit(Number(e.target.value))}
          />
        </span>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="rebuys">Rebuys</Label>
        <Input
          type="number"
          id="rebuys"
          value={rebuys}
          onChange={(e) => setRebuys(Number(e.target.value))}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="member">Member</Label>
        <Select value={memberId} onValueChange={(value) => setMemberId(value)}>
          <SelectTrigger id="member">
            <SelectValue>{getMemberName(memberId)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {members.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.firstName}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="season">Season</Label>
        <Select
          value={seasonId}
          onValueChange={(value) => {
            setSeasonId(value);
            getSeasonWeeks(value);
          }}>
          <SelectTrigger id="season">
            <SelectValue>{getSeasonYear(seasonId)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {seasons?.map((season) => (
                <SelectItem key={season.id} value={season.id}>
                  {season.year}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="week">Week</Label>
        <Select value={weekId} onValueChange={(value) => setWeekId(value)}>
          <SelectTrigger id="week">
            <SelectValue>{getWeekNumber(weekId)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {selectWeeks.map((week) => (
                <SelectItem key={week.id} value={week.id}>
                  {week.weekNumber}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </fieldset>
      <Button className="h-12 col-start-1 row-start-5">Update</Button>
      <BackButton variant={"neutral"} className="h-12 col-start-2 row-start-5">
        Cancel
      </BackButton>
    </div>
  );
}

export default EditSessionForm;
