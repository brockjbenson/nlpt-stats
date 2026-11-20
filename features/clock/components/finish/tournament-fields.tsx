"use client";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import CompactField from "@/features/clock/components/structures/compact-field";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import type {
  FinishForm,
  FinishFormError,
} from "@/features/clock/lib/finish-form";
import type { FinishTournament } from "@/features/clock/lib/results";
import type { Season, Week } from "@/utils/types";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const NUMBER_FIELDS: {
  field: keyof FinishTournament;
  label: string;
  step: number;
}[] = [
  { field: "buy_in_amount", label: "Buy-in ($)", step: 1 },
  { field: "rebuy_amount", label: "Rebuy ($)", step: 1 },
  { field: "player_count", label: "Players (incl. guests)", step: 1 },
  { field: "total_rebuys", label: "Rebuys (incl. guests)", step: 1 },
  { field: "places_paid", label: "Places paid", step: 1 },
];

// yyyy-mm-dd as a local date for the calendar, and back.
function toLocalDate(date: string): Date | undefined {
  const [year, month, day] = date.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : undefined;
}

type Props = {
  form: FinishForm;
  seasons: Season[];
  weeks: Week[];
  errors: FinishFormError[];
  onChange: (change: Partial<FinishForm>) => void;
};

// The tournament being saved: name, date, the week it counts for, and its
// numbers (prefilled from the clock).
function TournamentFields({ form, seasons, weeks, errors, onChange }: Props) {
  const seasonWeeks = weeks.filter(
    ({ season_id }) => season_id === form.season_id,
  );
  const errorsFor = (field: FinishFormError["field"]): FinishFormError[] =>
    errors.filter((error) => error.field === field);
  const date = toLocalDate(form.date);

  // A new season defaults to its latest week, as manual entry does.
  const selectSeason = (seasonId: string): void => {
    const latest = weeks
      .filter(({ season_id }) => season_id === seasonId)
      .sort((a, b) => b.week_number - a.week_number)[0];
    onChange({ season_id: seasonId, week_id: latest?.id ?? "" });
  };

  return (
    <Card className="gap-2 py-4">
      <CardHeader>
        <CardTitle className="text-base">Tournament</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-x-3 gap-y-2">
          <CompactField
            htmlFor="finish-name"
            label="Name"
            className="col-span-2"
          >
            <Input
              id="finish-name"
              className="h-9 px-2 text-sm"
              value={form.name}
              onChange={(event) => onChange({ name: event.target.value })}
            />
          </CompactField>
          <CompactField
            htmlFor="finish-date"
            label="Date"
            className="col-span-2"
          >
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
                  onSelect={(picked) =>
                    picked && onChange({ date: format(picked, "yyyy-MM-dd") })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CompactField>
          <CompactField htmlFor="finish-season" label="Season">
            <Select value={form.season_id} onValueChange={selectSeason}>
              <SelectTrigger id="finish-season" className="h-9">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CompactField>
          <CompactField htmlFor="finish-week" label="Week">
            <Select
              value={form.week_id}
              disabled={seasonWeeks.length === 0}
              onValueChange={(weekId) => onChange({ week_id: weekId })}
            >
              <SelectTrigger id="finish-week" className="h-9">
                <SelectValue placeholder="Week" />
              </SelectTrigger>
              <SelectContent>
                {seasonWeeks.map((week) => (
                  <SelectItem key={week.id} value={week.id}>
                    Week {week.week_number}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CompactField>
        </div>
        <ErrorText
          errors={[
            ...errorsFor("name"),
            ...errorsFor("date"),
            ...errorsFor("week_id"),
          ]}
        />
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-5">
          {NUMBER_FIELDS.map(({ field, label, step }) => (
            <CompactField key={field} htmlFor={`finish-${field}`} label={label}>
              <NumberInput
                id={`finish-${field}`}
                min={0}
                step={step}
                value={form.tournament[field]}
                onValueChange={(value) =>
                  onChange({
                    tournament: { ...form.tournament, [field]: value },
                  })
                }
              />
            </CompactField>
          ))}
        </div>
        <ErrorText errors={errorsFor("tournament")} />
      </CardContent>
    </Card>
  );
}

export default TournamentFields;
