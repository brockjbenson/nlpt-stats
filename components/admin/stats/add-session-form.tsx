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

interface FormState {
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  member_id: string;
  week_id: string;
  season_id: string;
}

interface DataBaseState {
  members: Member[];
  seasons: Season[];
  weeks: Week[];
}

interface Props {
  formState: FormState;
  handleFormChange: (field: string, value: string | number) => void;
  databaseState: DataBaseState;
  addSessionToList: () => void;
  setSelectWeeks: (value: Week[]) => void;
  selectWeeks: Week[];
  buyInRef: React.RefObject<HTMLInputElement | null>;
  formRef: React.RefObject<HTMLDivElement | null>;
}

function AddSessionForm({
  formState,
  handleFormChange,
  databaseState,
  addSessionToList,
  setSelectWeeks,
  selectWeeks,
  buyInRef,
  formRef,
}: Props) {
  const { members, seasons, weeks } = databaseState;
  const getSeasonWeeks = async (seasonId: string) => {
    const seasonWeeks = weeks?.filter((week) => week.season_id === seasonId);

    if (seasonWeeks) {
      setSelectWeeks(seasonWeeks);
    }
  };
  return (
    <div
      ref={formRef}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 items-center">
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="buyIn">Buy In</Label>
        <span className="relative flex items-center">
          <span className="absolute left-2">$</span>
          <Input
            ref={buyInRef}
            className="pl-6 text-base"
            type="number"
            id="buyIn"
            step={0.05}
            value={formState.buy_in}
            onChange={(e) => handleFormChange("buy_in", Number(e.target.value))}
          />
        </span>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="cashOut">Cash Out</Label>
        <span className="relative flex items-center">
          <span className="absolute left-2">$ </span>
          <Input
            className="pl-6 text-base"
            type="number"
            id="cashOut"
            step={0.05}
            value={formState.cash_out}
            onChange={(e) =>
              handleFormChange("cash_out", Number(e.target.value))
            }
          />
        </span>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="netProfit">Net Profit</Label>
        <span className="relative flex items-center">
          <span className="absolute left-2">$ </span>
          <Input
            className="pl-6 text-base"
            type="number"
            id="netProfit"
            value={formState.net_profit.toFixed(2)}
            readOnly
            onChange={(e) =>
              handleFormChange("net_profit", Number(e.target.value))
            }
          />
        </span>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="rebuys">Rebuys</Label>
        <Input
          className="text-base"
          type="number"
          id="rebuys"
          value={formState.rebuys}
          onChange={(e) => handleFormChange("rebuys", Number(e.target.value))}
        />
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="member">Member</Label>
        <Select onValueChange={(value) => handleFormChange("member_id", value)}>
          <SelectTrigger id="member">
            <SelectValue placeholder="Select member" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {members?.map((member) => (
                <SelectItem key={member.id} value={member.id}>
                  {member.first_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </fieldset>
      <fieldset className="flex flex-col gap-4 grow">
        <Label htmlFor="season">Season</Label>
        <Select
          value={formState.season_id}
          onValueChange={(value) => {
            handleFormChange("season_id", value);
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
        <Select onValueChange={(value) => handleFormChange("week_id", value)}>
          <SelectTrigger disabled={selectWeeks.length === 0} id="week">
            <SelectValue placeholder="Select a week" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {selectWeeks.map((week) => (
                <SelectItem key={week.id} value={week.id}>
                  {week.week_number}
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
