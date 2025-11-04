"use client";

import { Member, Season } from "@/utils/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertCircleIcon, CalendarIcon, ChevronDown } from "lucide-react";
import React, { useEffect, useState } from "react";
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

interface Props {
  seasons: Season[];
  members: Member[];
}

function NewTournamentForm({ seasons, members }: Props) {
  const db = createClient();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [newTournamentId, setNewTournamentId] = useState<string | null>(null);
  const [addSessionsDialogOpen, setAddSessionsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    date: date,
    season_id: "",
    money_in_play: 0,
    buy_ins: 0,
    rebuys: 0,
    player_count: 0,
    places_payed: 0,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      date: date,
    }));
  }, [date]);

  const addTournament = async () => {
    const { data, error } = await db
      .from("tournaments")
      .upsert({
        name: formData.name,
        date: formData.date,
        season_id: formData.season_id,
        money_in_play: formData.money_in_play,
        buy_ins: formData.buy_ins,
        rebuys: formData.rebuys,
        player_count: formData.player_count,
        places_payed: formData.places_payed,
      })
      .select("id");

    if (error) {
      console.error("Error adding tournament:", error);
    } else {
      setNewTournamentId(data[0].id);
      setAddSessionsDialogOpen(true);
    }
    setFormData({
      name: "",
      date: new Date(),
      season_id: "",
      money_in_play: 0,
      buy_ins: 0,
      rebuys: 0,
      player_count: 0,
      places_payed: 0,
    });
  };
  return (
    <>
      <div className="grid grid-cols-2 px-2 gap-4 mt-4 mb-8">
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="season">
            Season
          </Label>
          <Select
            value={formData.season_id || ""}
            onValueChange={(value: string) => {
              setFormData((prev) => ({
                ...prev,
                season_id: value,
              }));
            }}>
            <SelectTrigger
              className="border border-neutral-500 h-12 rounded"
              id="season">
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
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="date">
            Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full border border-neutral-500 py-2 h-12 px-3 justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}>
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
        <fieldset className="flex flex-col col-span-2 gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="name">
            Name
          </Label>
          <Input
            id="name"
            className="w-full h-12 px-3"
            placeholder="Tournament Name"
            value={formData.name}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                name: e.target.value,
              }));
            }}
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="buyIns">
            Buy Ins
          </Label>
          <Input
            id="buyIns"
            className="w-full h-12 px-3"
            type="number"
            value={formData.buy_ins}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                buy_ins: Number(e.target.value),
              }));
            }}
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="rebuys">
            Rebuys
          </Label>
          <Input
            id="rebuys"
            className="w-full h-12 px-3"
            type="number"
            value={formData.rebuys}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                rebuys: Number(e.target.value),
              }));
            }}
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="players">
            Players
          </Label>
          <Input
            id="players"
            className="w-full h-12 px-3"
            type="number"
            value={formData.player_count}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                player_count: Number(e.target.value),
              }));
            }}
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="players">
            Prize Pool
          </Label>
          <Input
            id="players"
            className="w-full h-12 px-3"
            type="number"
            value={formData.money_in_play}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                money_in_play: Number(e.target.value),
              }));
            }}
          />
        </fieldset>
        <fieldset className="flex flex-col gap-2 grow">
          <Label className="text-xs md:text-base" htmlFor="players">
            Places Paid
          </Label>
          <Input
            id="players"
            className="w-full h-12 px-3"
            type="number"
            value={formData.places_payed}
            onChange={(e) => {
              setFormData((prev) => ({
                ...prev,
                places_payed: Number(e.target.value),
              }));
            }}
          />
        </fieldset>
        <button
          onClick={addTournament}
          className="w-full mt-auto border-primary bg-primary text-white h-12 rounded">
          Add
        </button>
      </div>
      <AlertDialog
        open={addSessionsDialogOpen}
        onOpenChange={() => setAddSessionsDialogOpen(!addSessionsDialogOpen)}>
        <AlertDialogContent className="max-w-[calc(100vw-32px)]">
          <AlertCircleIcon className="w-16 h-16  mx-auto text-primary" />
          <AlertDialogTitle>
            Do you want to add sessions to this tournament?
          </AlertDialogTitle>
          <AlertDialogFooter className="grid grid-cols-2 gap-4">
            <AlertDialogCancel asChild>
              <Link
                className="bg-neutral-600 whitespace-nowrap w-full rounded flex items-center justify-center h-12 px-12 mx-auto text-white"
                href={"/admin/stats/tournaments"}>
                Not Now
              </Link>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Link
                className="bg-primary w-full rounded flex items-center h-12 justify-center px-12 mx-auto text-white"
                href={`/admin/stats/tournaments/${newTournamentId}/sessions/add`}>
                Yes
              </Link>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default NewTournamentForm;
