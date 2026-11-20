"use client";

import { Season, Week } from "@/utils/types";
import { refreshLeagueData } from "@/lib/data/actions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircleIcon, CalendarIcon } from "lucide-react";
import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { formatMoney } from "@/utils/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@radix-ui/react-alert-dialog";
import Link from "next/link";

const DEFAULT_BUY_IN = 40;

interface Props {
  seasons: Season[];
  // Newest week first.
  weeks: Week[];
}

type FormData = {
  name: string;
  season_id: string;
  week_id: string;
  buy_in_amount: number;
  rebuy_amount: number;
  player_count: number;
  total_rebuys: number;
  places_paid: number;
};

type NumberField = Exclude<keyof FormData, "name" | "season_id" | "week_id">;

const emptyForm: FormData = {
  name: "",
  season_id: "",
  week_id: "",
  buy_in_amount: DEFAULT_BUY_IN,
  rebuy_amount: DEFAULT_BUY_IN,
  player_count: 0,
  total_rebuys: 0,
  places_paid: 3,
};

// Players and rebuys include guests, so the prize pool matches what was
// actually in play even though guests don't get sessions.
function NewTournamentForm({ seasons, weeks }: Props) {
  const db = createClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [newTournamentId, setNewTournamentId] = useState<string | null>(null);
  const [addSessionsDialogOpen, setAddSessionsDialogOpen] = useState(false);

  const seasonWeeks = weeks.filter(
    (week) => week.season_id === formData.season_id,
  );
  const prizePool =
    formData.player_count * formData.buy_in_amount +
    formData.total_rebuys * formData.rebuy_amount;
  const canSave =
    !saving &&
    formData.name.trim() !== "" &&
    formData.week_id !== "" &&
    date !== undefined &&
    formData.places_paid >= 1;

  const setNumber = (field: NumberField, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: Number(value) }));
  };

  // Picking a season leaves the week to choose. Seasons are created with
  // all 52 weeks and weeks have no dates, so the "latest" week was always
  // week 52, never the week the tournament was played.
  const selectSeason = (seasonId: string) => {
    setFormData((prev) => ({ ...prev, season_id: seasonId, week_id: "" }));
  };

  const weekPlaceholder = ((): string => {
    if (!formData.season_id) return "Select a season first";
    if (seasonWeeks.length === 0) return "No weeks yet";
    return "Select a week";
  })();

  const addTournament = async () => {
    if (!canSave || !date) return;
    setSaving(true);
    setSaveError(null);

    const { data, error } = await db
      .from("_tournaments")
      .insert({
        name: formData.name.trim(),
        // A plain calendar date: a Date object would be sent in UTC and can
        // land on the next day for an evening entry.
        date: format(date, "yyyy-MM-dd"),
        week_id: formData.week_id,
        buy_in_amount: formData.buy_in_amount,
        rebuy_amount: formData.rebuy_amount,
        player_count: formData.player_count,
        total_rebuys: formData.total_rebuys,
        places_paid: formData.places_paid,
      })
      .select("id")
      .single();

    setSaving(false);
    if (error) {
      setSaveError(error.message);
      return;
    }

    await refreshLeagueData();
    setNewTournamentId(data.id);
    setAddSessionsDialogOpen(true);
    setDate(new Date());
    setFormData(emptyForm);
  };

  return (
    <>
      <div className="grid grid-cols-2 px-2 gap-4 mt-4 mb-8">
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="season">
            Season
          </Label>
          <Select value={formData.season_id} onValueChange={selectSeason}>
            <SelectTrigger id="season">
              <SelectValue placeholder="Select a season" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {seasons.map((season) => (
                  <SelectItem key={season.id} value={season.id}>
                    {season.year}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </fieldset>
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="week">
            Week
          </Label>
          <Select
            value={formData.week_id}
            disabled={seasonWeeks.length === 0}
            onValueChange={(value: string) =>
              setFormData((prev) => ({ ...prev, week_id: value }))
            }
          >
            <SelectTrigger id="week">
              <SelectValue placeholder={weekPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {seasonWeeks.map((week) => (
                  <SelectItem key={week.id} value={week.id}>
                    Week {week.week_number}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </fieldset>
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="name">
            Name
          </Label>
          <Input
            id="name"
            className="w-full h-12 px-3"
            placeholder="Tournament Name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="date">
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-full border border-neutral-500 py-2 h-12 px-3 justify-start text-left font-normal",
                  !date && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </fieldset>
        <NumberInput
          id="buyInAmount"
          label="Buy-In ($)"
          value={formData.buy_in_amount}
          onChange={(value) => setNumber("buy_in_amount", value)}
        />
        <NumberInput
          id="rebuyAmount"
          label="Rebuy ($)"
          value={formData.rebuy_amount}
          onChange={(value) => setNumber("rebuy_amount", value)}
        />
        <NumberInput
          id="players"
          label="Players (incl. guests)"
          value={formData.player_count}
          onChange={(value) => setNumber("player_count", value)}
        />
        <NumberInput
          id="rebuys"
          label="Rebuys (incl. guests)"
          value={formData.total_rebuys}
          onChange={(value) => setNumber("total_rebuys", value)}
        />
        <NumberInput
          id="placesPaid"
          label="Places Paid"
          value={formData.places_paid}
          onChange={(value) => setNumber("places_paid", value)}
        />
        <div className="flex flex-col gap-2 grow">
          <p className="text-xs md:text-base">Prize Pool</p>
          <p className="h-12 flex items-center text-lg font-semibold">
            ${formatMoney(prizePool)}
          </p>
        </div>
        {saveError && (
          <p className="col-span-2 text-sm text-red-500">
            Couldn&apos;t add the tournament: {saveError}
          </p>
        )}
        <button
          onClick={addTournament}
          disabled={!canSave}
          className="col-span-2 w-full mt-auto border-primary bg-primary text-white h-12 rounded disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add"}
        </button>
      </div>
      <AlertDialog
        open={addSessionsDialogOpen}
        onOpenChange={() => setAddSessionsDialogOpen(!addSessionsDialogOpen)}
      >
        <AlertDialogContent className="max-w-[calc(100vw-32px)]">
          <AlertCircleIcon className="w-16 h-16  mx-auto text-primary" />
          <AlertDialogTitle>
            Do you want to add sessions to this tournament?
          </AlertDialogTitle>
          <AlertDialogFooter className="grid grid-cols-2 gap-4">
            <AlertDialogCancel asChild>
              <Link
                className="bg-neutral-600 whitespace-nowrap w-full rounded flex items-center justify-center h-12 px-12 mx-auto text-white"
                href={"/admin/stats/tournaments"}
              >
                Not Now
              </Link>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link
                className="bg-primary w-full rounded flex items-center h-12 justify-center px-12 mx-auto text-white"
                href={`/admin/stats/tournaments/${newTournamentId}/sessions/add`}
              >
                Yes
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NumberInput({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2 grow">
      <Label className="text-xs md:text-base" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        className="w-full h-12 px-3"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </fieldset>
  );
}

export default NewTournamentForm;
