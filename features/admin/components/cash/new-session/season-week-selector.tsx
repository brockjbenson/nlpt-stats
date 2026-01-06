// season-week-selector.tsx
import { Season, Week } from "@/utils/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeasonWeekSelectorProps {
  seasons: Season[];
  selectWeeks: Week[];
  usedWeekIds: string[];
  selectedSeasonId: string | null;
  selectedWeekId: string | null;
  selectedSeason: Season | null;
  onSeasonChange: (value: string) => void;
  onWeekChange: (value: string) => void;
}

export default function SeasonWeekSelector({
  seasons,
  selectWeeks,
  usedWeekIds,
  selectedSeasonId,
  selectedWeekId,
  selectedSeason,
  onSeasonChange,
  onWeekChange,
}: SeasonWeekSelectorProps) {
  return (
    <form className="grid grid-cols-2 gap-4">
      {/* Season Select */}
      <fieldset className="flex flex-col gap-2">
        <Label htmlFor="season">Season</Label>
        <Select value={selectedSeasonId || ""} onValueChange={onSeasonChange}>
          <SelectTrigger className="border border-border" id="season">
            <SelectValue placeholder="Select a season" />
            <ChevronDown className="ml-auto size-4 opacity-50" />
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

      {/* Week Select */}
      <fieldset className="flex flex-col gap-2">
        <Label htmlFor="week">Week</Label>
        <Select
          value={selectedWeekId || ""}
          onValueChange={onWeekChange}
          disabled={!selectedSeason}>
          <SelectTrigger
            className="border border-border"
            id="week"
            disabled={!selectedSeason}>
            <SelectValue placeholder="Select a week" />
            <ChevronDown className="ml-auto size-4 opacity-50" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {selectWeeks.length === 0 && (
                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                  All weeks have been used
                </div>
              )}
              {selectWeeks.map((week) => {
                const isUsed = usedWeekIds.includes(week.id);
                return (
                  <SelectItem
                    key={week.id}
                    value={week.id}
                    disabled={isUsed}
                    className={cn(isUsed && "text-muted line-through")}>
                    Week {week.week_number}
                    {isUsed && " (Used)"}
                  </SelectItem>
                );
              })}
            </SelectGroup>
          </SelectContent>
        </Select>
      </fieldset>
    </form>
  );
}
