"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import DateField from "@/features/clock/components/finish/date-field";
import SeasonWeekFields from "@/features/clock/components/finish/season-week-fields";
import CompactField from "@/features/clock/components/structures/compact-field";
import ErrorText from "@/features/clock/components/structures/error-text";
import NumberInput from "@/features/clock/components/structures/number-input";
import type {
  FinishForm,
  FinishFormError,
} from "@/features/clock/lib/finish-form";
import type { FinishTournament } from "@/features/clock/lib/results";
import type { Season, Week } from "@/utils/types";

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
  const errorsFor = (field: FinishFormError["field"]): FinishFormError[] =>
    errors.filter((error) => error.field === field);

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
          <DateField
            value={form.date}
            onChange={(date) => onChange({ date })}
            className="col-span-2"
          />
          <SeasonWeekFields
            seasonId={form.season_id}
            weekId={form.week_id}
            seasons={seasons}
            weeks={weeks}
            onChange={onChange}
          />
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
