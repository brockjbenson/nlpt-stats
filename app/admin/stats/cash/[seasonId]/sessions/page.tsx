import ErrorHandler from "@/components/error-handler";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { Week } from "@/utils/types";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import React from "react";

interface Params {
  params: Promise<{ seasonId: string }>;
}

type WeekSummary = {
  week: Week;
  players: number;
  playedAt: string;
};

// A season's cash weeks, newest first, each linking to its edit page.
async function Page({ params }: Params) {
  const { seasonId } = await params;
  const db = await createClient();

  const [
    { data: season, error: seasonError },
    { data: weeks, error: weeksError },
    { data: sessions, error: sessionsError },
  ] = await Promise.all([
    db.from("season").select("*").eq("id", seasonId).maybeSingle(),
    db
      .from("week")
      .select("*")
      .eq("season_id", seasonId)
      .order("week_number", { ascending: false }),
    // Only real sessions: the cash table also has $0 placeholder rows.
    db
      .from("cash_session")
      .select("week_id, created_at")
      .eq("season_id", seasonId)
      .gt("buy_in", 0),
  ]);

  const error = seasonError ?? weeksError ?? sessionsError;
  if (error) {
    return (
      <ErrorHandler
        title="Error fetching cash sessions"
        errorMessage={error.message}
        pageTitle="Cash Sessions"
      />
    );
  }
  if (!season) notFound();

  const summaries = summarizeWeeks((weeks ?? []) as Week[], sessions ?? []);
  const title = `${season.year} Cash Sessions`;

  return (
    <>
      <PageHeader title={title} showBackButton />
      <DesktopPageHeader title={title} />
      {summaries.length === 0 ? (
        <p className="px-2 text-muted">No cash sessions this season yet.</p>
      ) : (
        <ul className="flex flex-col gap-3 px-2 pb-8">
          {summaries.map(({ week, players, playedAt }) => (
            <li key={week.id}>
              <Link
                href={`/admin/stats/cash/${seasonId}/sessions/${week.id}/edit`}
              >
                <Card className="flex-row items-center justify-between px-4 py-4 hover:border-primary transition-colors">
                  <span className="flex flex-col gap-1">
                    <span className="text-lg font-semibold">
                      Week {week.week_number}
                    </span>
                    <span className="text-sm text-muted">
                      {format(new Date(playedAt), "MMM d, yyyy")} · {players}{" "}
                      {players === 1 ? "player" : "players"}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 text-sm text-muted">
                    Edit
                    <ChevronRight className="size-4" />
                  </span>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Weeks that have sessions, with how many played and when (latest session).
function summarizeWeeks(
  weeks: Week[],
  sessions: { week_id: string; created_at: string }[],
): WeekSummary[] {
  const byWeek = new Map<string, { players: number; playedAt: string }>();
  for (const session of sessions) {
    const current = byWeek.get(session.week_id);
    byWeek.set(session.week_id, {
      players: (current?.players ?? 0) + 1,
      playedAt:
        current && current.playedAt > session.created_at
          ? current.playedAt
          : session.created_at,
    });
  }

  return weeks.flatMap((week) => {
    const summary = byWeek.get(week.id);
    return summary ? [{ week, ...summary }] : [];
  });
}

export default Page;
