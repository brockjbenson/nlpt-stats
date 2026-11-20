import { formatLeagueIsoDate } from "@/features/clock/lib/format";
import { computePayouts, computePool } from "@/features/clock/lib/money";
import { entrantNames, type MemberName } from "@/features/clock/lib/players";
import { fail, ok, type Result } from "@/features/clock/lib/result";
import {
  buildFinishResults,
  type FinishResultsRefusal,
  type FinishSession,
  type FinishTournament,
} from "@/features/clock/lib/results";
import type { ClockEntrant, TournamentClock } from "@/features/clock/types";
import type { Season, Week } from "@/utils/types";

const CENTS_PER_DOLLAR = 100;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// One member's saved session, with their name for the form.
export type FinishSessionRow = FinishSession & { name: string };

// The review screen's form: the tournament to save and its members'
// sessions, in saved place order.
export type FinishForm = {
  name: string;
  // yyyy-mm-dd
  date: string;
  season_id: string;
  week_id: string;
  tournament: FinishTournament;
  sessions: FinishSessionRow[];
};

// A guest, shown for reference: guests aren't saved.
export type FinishGuest = { name: string; place: number; cash_out: number };

export type FinishFormField =
  | "name"
  | "date"
  | "week_id"
  | "tournament"
  | "sessions";

export type FinishFormError = {
  field: FinishFormField;
  // The session row, for a session problem.
  index?: number;
  message: string;
};

function toCents(amount: number): number {
  return Math.round(amount * CENTS_PER_DOLLAR) / CENTS_PER_DOLLAR;
}

// The newest season and its latest week, the usual week for a game that
// just happened. Empty when there are none.
function latestWeek(
  seasons: Season[],
  weeks: Week[],
): { season_id: string; week_id: string } {
  const season = [...seasons].sort((a, b) => b.year - a.year)[0];
  if (!season) return { season_id: "", week_id: "" };
  const week = weeks
    .filter(({ season_id }) => season_id === season.id)
    .sort((a, b) => b.week_number - a.week_number)[0];
  return { season_id: season.id, week_id: week?.id ?? "" };
}

// The guests, by finishing place, with what their place paid.
function guestResults(
  clock: Pick<TournamentClock, "buy_in" | "rebuy" | "payout_pcts">,
  entrants: ClockEntrant[],
): FinishGuest[] {
  const payouts = computePayouts(
    computePool(clock, entrants),
    clock.payout_pcts,
    entrants.length,
  );
  return entrants
    .filter(({ member_id }) => member_id === null)
    .map((entrant) => {
      const place = entrant.finish_place ?? 0;
      return {
        name: entrant.guest_name ?? "",
        place,
        cash_out: toCents(payouts[place - 1] ?? 0),
      };
    })
    .sort((a, b) => a.place - b.place);
}

// The review form prefilled from a finished clock: its name, the day it
// was created in the league's time zone (a game saved the next morning
// keeps the game's date), the newest season's latest week, and the results
// (members re-ranked, each with their true place's payout).
export function finishFormDefaults({
  clock,
  entrants,
  members,
  seasons,
  weeks,
}: {
  clock: TournamentClock;
  entrants: ClockEntrant[];
  members: MemberName[];
  seasons: Season[];
  weeks: Week[];
}): Result<{ form: FinishForm; guests: FinishGuest[] }, FinishResultsRefusal> {
  const results = buildFinishResults(clock, entrants);
  if (!results.ok) return fail(results.reason);

  const names = entrantNames(entrants, members);
  const nameOfMember = new Map(
    entrants.flatMap(({ id, member_id }) =>
      member_id ? [[member_id, names.get(id) ?? ""] as const] : [],
    ),
  );

  return ok({
    form: {
      name: clock.name,
      date: formatLeagueIsoDate(Date.parse(clock.created_at)),
      ...latestWeek(seasons, weeks),
      tournament: results.value.tournament,
      sessions: results.value.sessions.map((session) => ({
        ...session,
        cash_out: toCents(session.cash_out),
        name: nameOfMember.get(session.member_id) ?? "",
      })),
    },
    guests: guestResults(clock, entrants),
  });
}

function isWholeAtLeast(value: number, min: number): boolean {
  return Number.isInteger(value) && value >= min;
}

function isMoney(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function isValidDate(date: string): boolean {
  if (!ISO_DATE_PATTERN.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(date)
  );
}

function tournamentError(tournament: FinishTournament): string | null {
  if (!isMoney(tournament.buy_in_amount) || !isMoney(tournament.rebuy_amount)) {
    return "Buy-in and rebuy must be $0 or more.";
  }
  if (
    !isWholeAtLeast(tournament.player_count, 0) ||
    !isWholeAtLeast(tournament.total_rebuys, 0)
  ) {
    return "Player count and total rebuys must be whole numbers, 0 or more.";
  }
  if (!isWholeAtLeast(tournament.places_paid, 1)) {
    return "Pay at least 1 place.";
  }
  return null;
}

function sessionErrors(sessions: FinishSessionRow[]): FinishFormError[] {
  if (sessions.length === 0) {
    return [{ field: "sessions", message: "Save at least one member." }];
  }
  return sessions.flatMap((session, index): FinishFormError[] => {
    if (!isWholeAtLeast(session.rebuys, 0)) {
      return [
        {
          field: "sessions",
          index,
          message: "Rebuys must be a whole number, 0 or more.",
        },
      ];
    }
    if (!isMoney(session.cash_out)) {
      return [
        { field: "sessions", index, message: "Cash-out must be $0 or more." },
      ];
    }
    return [];
  });
}

// Everything wrong with the form, in form order; empty means it can be
// saved. The rules match the tables' checks.
export function validateFinishForm(form: FinishForm): FinishFormError[] {
  const errors: FinishFormError[] = [];
  const add = (field: FinishFormField, message: string | null): void => {
    if (message) errors.push({ field, message });
  };

  add("name", form.name.trim() === "" ? "Give the tournament a name." : null);
  add("date", isValidDate(form.date) ? null : "Pick the tournament's date.");
  add("week_id", form.week_id === "" ? "Pick the week it counts for." : null);
  add("tournament", tournamentError(form.tournament));
  return [...errors, ...sessionErrors(form.sessions)];
}

// What save_clock_results takes (p_tournament and p_sessions).
export function finishFormToSave(form: FinishForm): {
  tournament: FinishTournament & {
    name: string;
    date: string;
    week_id: string;
  };
  sessions: FinishSession[];
} {
  return {
    tournament: {
      name: form.name.trim(),
      date: form.date,
      week_id: form.week_id,
      ...form.tournament,
    },
    sessions: form.sessions.map(({ member_id, rebuys, cash_out, place }) => ({
      member_id,
      rebuys,
      cash_out,
      place,
    })),
  };
}
