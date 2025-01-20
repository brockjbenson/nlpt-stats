import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from "@/components/ui/select";
import { Member, Season, Week } from "@/utils/types";
import React from "react";

interface Props {
  buyIn: number;
  setBuyIn: (value: number) => void;
  cashOut: number;
  setCashOut: (value: number) => void;
  netProfit: number;
  setNetProfit: (value: number) => void;
  rebuys: number;
  setRebuys: (value: number) => void;
  setMemberId: (value: string) => void;
  weekId: string;
  setWeekId: (value: string) => void;
  seasonId: string;
  setSeasonId: (value: string) => void;
  members: Member[] | null;
  weeks: Week[] | null;
  seasons: Season[] | null;
  addSessionToList: () => void;
  setSelectWeeks: (value: Week[]) => void;
  selectWeeks: Week[];
}

function AddSessionForm({
  buyIn,
  setBuyIn,
  cashOut,
  setCashOut,
  netProfit,
  setNetProfit,
  rebuys,
  setRebuys,
  setMemberId,
  setWeekId,
  seasonId,
  setSeasonId,
  members,
  weeks,
  seasons,
  addSessionToList,
  setSelectWeeks,
  selectWeeks,
}: Props) {
  const getSeasonWeeks = async (seasonId: string) => {
    const seasonWeeks = weeks?.filter((week) => week.seasonId === seasonId);

    if (seasonWeeks) {
      setSelectWeeks(seasonWeeks);
    }
  };
  return (
    <div className="grid grid-cols-4 gap-4 items-center">
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
        <Select onValueChange={(value) => setMemberId(value)}>
          <SelectTrigger id="member">
            <SelectValue placeholder="Select member" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {members?.map((member) => (
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
            <SelectValue placeholder="Select a season" />
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
        <Select onValueChange={(value) => setWeekId(value)}>
          <SelectTrigger disabled={selectWeeks.length === 0} id="week">
            <SelectValue placeholder="Select a week" />
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
      <button
        onClick={addSessionToList}
        className="h-12 w-full rounded bg-primary text-sm self-end text-white border border-primary">
        Add
      </button>
    </div>
  );
}

export default AddSessionForm;
