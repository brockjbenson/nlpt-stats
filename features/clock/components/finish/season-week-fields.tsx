"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CompactField from "@/features/clock/components/structures/compact-field";
import type { Season, Week } from "@/utils/types";

type Props = {
  seasonId: string;
  weekId: string;
  seasons: Season[];
  // Every season's weeks; the week list shows the chosen season's.
  weeks: Week[];
  onChange: (change: { season_id?: string; week_id?: string }) => void;
};

// The week the tournament counts for, picked by season then week. Picking
// a season clears the week: seasons are created with all their weeks and
// weeks have no dates, so there's no safe guess.
function SeasonWeekFields({
  seasonId,
  weekId,
  seasons,
  weeks,
  onChange,
}: Props) {
  const seasonWeeks = weeks.filter(({ season_id }) => season_id === seasonId);

  return (
    <>
      <CompactField htmlFor="finish-season" label="Season">
        <Select
          value={seasonId}
          onValueChange={(id) => onChange({ season_id: id, week_id: "" })}
        >
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
          value={weekId}
          disabled={seasonWeeks.length === 0}
          onValueChange={(id) => onChange({ week_id: id })}
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
    </>
  );
}

export default SeasonWeekFields;
