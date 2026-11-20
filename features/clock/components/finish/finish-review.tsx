"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { saveClockResultsAction } from "@/features/clock/actions/results";
import SessionRows from "@/features/clock/components/finish/session-rows";
import TournamentFields from "@/features/clock/components/finish/tournament-fields";
import {
  type FinishForm,
  type FinishFormError,
  type FinishGuest,
  type FinishSessionRow,
  validateFinishForm,
} from "@/features/clock/lib/finish-form";
import { clockControlPath, tournamentPath } from "@/features/clock/lib/paths";
import { useToast } from "@/hooks/use-toast";
import type { Season, Week } from "@/utils/types";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

type Props = {
  clockId: string;
  initialForm: FinishForm;
  guests: FinishGuest[];
  seasons: Season[];
  weeks: Week[];
  // The tournament saved from this clock before, if any.
  savedTournamentId: string | null;
};

// Links once the results are saved: the tournament, and back to the clock.
function SavedLinks({
  clockId,
  tournamentId,
  year,
}: {
  clockId: string;
  tournamentId: string;
  year: number | null;
}) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-wrap items-center gap-3">
        <p className="flex items-center gap-2 font-semibold">
          <CheckCircle2 size={18} className="text-primary" /> Results saved
        </p>
        <div className="ml-auto flex gap-2">
          {year !== null && (
            <Button size="sm" asChild>
              <Link href={tournamentPath(year, tournamentId)}>
                View tournament
              </Link>
            </Button>
          )}
          <Button size="sm" variant="outline" asChild>
            <Link href={clockControlPath(clockId)}>Back to clock</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// The review screen: the results prefilled from the finished clock (or as
// saved before), editable, and saved as a tournament with its members'
// sessions.
function FinishReview({
  clockId,
  initialForm,
  guests,
  seasons,
  weeks,
  savedTournamentId,
}: Props) {
  const { toast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState<FinishFormError[]>([]);
  const [tournamentId, setTournamentId] = useState(savedTournamentId);
  const [isPending, startTransition] = useTransition();
  const year = seasons.find(({ id }) => id === form.season_id)?.year ?? null;

  const change = (update: Partial<FinishForm>): void =>
    setForm((current) => ({ ...current, ...update }));
  const changeSession = (
    index: number,
    update: Partial<FinishSessionRow>,
  ): void =>
    setForm((current) => ({
      ...current,
      sessions: current.sessions.map((session, i) =>
        i === index ? { ...session, ...update } : session,
      ),
    }));

  const save = (): void => {
    const problems = validateFinishForm(form);
    setErrors(problems);
    if (problems.length > 0) return;

    startTransition(async () => {
      const result = await saveClockResultsAction(clockId, form);
      if (result.errors) setErrors(result.errors);
      if (result.success && result.tournamentId) {
        setTournamentId(result.tournamentId);
        toast({ title: result.message });
        return;
      }
      toast({
        title: "Couldn't save the results",
        description: result.message,
        variant: "destructive",
      });
    });
  };

  return (
    <div className="flex w-full flex-col gap-3 px-2 pb-28">
      {tournamentId && (
        <SavedLinks clockId={clockId} tournamentId={tournamentId} year={year} />
      )}
      <TournamentFields
        form={form}
        seasons={seasons}
        weeks={weeks}
        errors={errors}
        onChange={change}
      />
      <SessionRows
        sessions={form.sessions}
        guests={guests}
        errors={errors}
        onChange={changeSession}
      />
      <Button className="h-12" disabled={isPending} onClick={save}>
        {isPending ? (
          <Spinner />
        ) : tournamentId ? (
          "Save changes"
        ) : (
          "Save results"
        )}
      </Button>
    </div>
  );
}

export default FinishReview;
