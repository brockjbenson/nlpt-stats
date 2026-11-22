import {
  type BustRefusal,
  planBust,
  planUndoBust,
  playersLeft,
  type UndoBustRefusal,
} from "@/features/clock/lib/entrants";
import { fail, ok, type Result } from "@/features/clock/lib/result";
import type {
  ClockEntrant,
  ClockKnockout,
  TournamentClock,
} from "@/features/clock/types";
import type { Member } from "@/utils/types";

// Same limit as the database's guest name check.
export const GUEST_NAME_MAX_LENGTH = 40;
// Shown for a member whose name couldn't be loaded.
const UNKNOWN_MEMBER = "Member";

export type MemberName = Pick<Member, "id" | "first_name" | "last_name">;

// Case-insensitive key, so "Alex S." and "alex s." count as the same name.
function nameKey(name: string): string {
  return name.toLocaleLowerCase();
}

function fullName(member: MemberName): string {
  return `${member.first_name.trim()} ${member.last_name.trim()}`.trim();
}

// "Alex S.", or just the first name when there's no last name.
function shortName(member: MemberName): string {
  const first = member.first_name.trim();
  const initial = member.last_name.trim().charAt(0);
  return initial ? `${first} ${initial.toLocaleUpperCase()}.` : first;
}

// Each entrant's name on screen. Members show as first name and last
// initial; when that would match another player's name, the full name.
// Guests show their name as typed.
export function entrantNames(
  entrants: ClockEntrant[],
  members: MemberName[],
): Map<string, string> {
  const membersById = new Map(members.map((member) => [member.id, member]));
  const memberOf = (entrant: ClockEntrant): MemberName | undefined =>
    entrant.member_id ? membersById.get(entrant.member_id) : undefined;
  const preferred = (entrant: ClockEntrant): string => {
    if (entrant.member_id === null) return entrant.guest_name ?? "";
    const member = memberOf(entrant);
    return member ? shortName(member) : UNKNOWN_MEMBER;
  };

  const counts = new Map<string, number>();
  entrants.forEach((entrant) => {
    const key = nameKey(preferred(entrant));
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  return new Map(
    entrants.map((entrant) => {
      const name = preferred(entrant);
      const member = memberOf(entrant);
      const isShared = (counts.get(nameKey(name)) ?? 0) > 1;
      return [entrant.id, member && isShared ? fullName(member) : name];
    }),
  );
}

// One player as the control screen lists them.
export type PlayerRow = {
  entrant: ClockEntrant;
  name: string;
  isGuest: boolean;
  // How many players they've knocked out.
  knockouts: number;
};

// Players still in, by name, and players out, by finishing place (best
// first).
export function listPlayers(
  entrants: ClockEntrant[],
  knockouts: ClockKnockout[],
  names: Map<string, string>,
): { left: PlayerRow[]; out: PlayerRow[] } {
  const knockoutCounts = new Map<string, number>();
  knockouts.forEach(({ knocked_out_by: by }) => {
    if (by) knockoutCounts.set(by, (knockoutCounts.get(by) ?? 0) + 1);
  });

  const rows = entrants.map(
    (entrant): PlayerRow => ({
      entrant,
      name: names.get(entrant.id) ?? "",
      isGuest: entrant.member_id === null,
      knockouts: knockoutCounts.get(entrant.id) ?? 0,
    }),
  );
  return {
    left: rows
      .filter(({ entrant }) => entrant.busted_at === null)
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    out: rows
      .filter(({ entrant }) => entrant.busted_at !== null)
      .sort(
        (a, b) => (a.entrant.finish_place ?? 0) - (b.entrant.finish_place ?? 0),
      ),
  };
}

// A guest name with spaces trimmed, or null when it's blank.
export function cleanGuestName(name: string): string | null {
  const trimmed = name.trim();
  return trimmed === "" ? null : trimmed;
}

export type NewEntrant = {
  member_id: string | null;
  guest_name: string | null;
};

export type AddEntrantsRefusal =
  | "finished"
  | "player_out"
  | "nothing_to_add"
  | "already_playing"
  | "bad_guest_name"
  | "duplicate_guest";

function isValidGuestName(name: string | null): name is string {
  return name !== null && name.length <= GUEST_NAME_MAX_LENGTH;
}

// Why the new guest names can't be added, or null when they can. Names
// are compared ignoring case, with the guests already playing.
function guestNameProblem(
  names: (string | null)[],
  entrants: ClockEntrant[],
): AddEntrantsRefusal | null {
  const validNames = names.filter(isValidGuestName);
  if (validNames.length !== names.length) return "bad_guest_name";

  const keys = [
    ...entrants.flatMap(({ guest_name }) =>
      guest_name ? [nameKey(guest_name.trim())] : [],
    ),
    ...validNames.map(nameKey),
  ];
  return new Set(keys).size === keys.length ? null : "duplicate_guest";
}

// Why no players can be added right now, or null when they can: not once
// the clock is finished, or while anyone is out (see planAddEntrants).
export function addPlayersBlocked(
  clock: Pick<TournamentClock, "status">,
  entrants: ClockEntrant[],
): "finished" | "player_out" | null {
  if (clock.status === "finished") return "finished";
  if (playersLeft(entrants).length < entrants.length) return "player_out";
  return null;
}

// The rows to add for the members and guests picked. Players can be added
// in any status but finished, and only while nobody is out: a bust's place
// is the number of players left, so a player added while someone is out
// would give the next bust a place that's already taken. (Once a re-entry
// brings everyone back in, players can be added again.)
export function planAddEntrants(
  clock: Pick<TournamentClock, "status">,
  entrants: ClockEntrant[],
  memberIds: string[],
  guestNames: string[],
): Result<NewEntrant[], AddEntrantsRefusal> {
  const blocked = addPlayersBlocked(clock, entrants);
  if (blocked) return fail(blocked);

  const uniqueMemberIds = Array.from(new Set(memberIds));
  if (uniqueMemberIds.length === 0 && guestNames.length === 0) {
    return fail("nothing_to_add");
  }
  const playing = new Set(entrants.map(({ member_id }) => member_id));
  if (uniqueMemberIds.some((id) => playing.has(id))) {
    return fail("already_playing");
  }

  const cleanNames = guestNames.map(cleanGuestName);
  const guestProblem = guestNameProblem(cleanNames, entrants);
  if (guestProblem) return fail(guestProblem);

  return ok([
    ...uniqueMemberIds.map((id) => ({ member_id: id, guest_name: null })),
    ...cleanNames.map((name) => ({ member_id: null, guest_name: name })),
  ]);
}

// A player can be removed (a sign-up mistake) while they've never busted
// and aren't in any knockout. The database refuses anything else.
export function canRemoveEntrant(
  entrant: ClockEntrant,
  knockouts: ClockKnockout[],
): boolean {
  return (
    entrant.busted_at === null &&
    !knockouts.some(
      ({ entrant_id, knocked_out_by }) =>
        entrant_id === entrant.id || knocked_out_by === entrant.id,
    )
  );
}

// Busts and their undo happen while the clock is in play; before it
// starts nobody can be out, and a finished clock's places are final.
function isInPlay(clock: Pick<TournamentClock, "status">): boolean {
  return clock.status === "running" || clock.status === "paused";
}

export type BustPlayerRefusal = BustRefusal | "wrong_status" | "bad_knocker";

export type PlannedBust = {
  finish_place: number;
  busted_at: string;
  knocked_out_by: string | null;
};

// A bust with who knocked the player out (null: not recorded), which must
// be another player still in this clock.
export function planBustPlayer(
  clock: Pick<TournamentClock, "status">,
  entrants: ClockEntrant[],
  entrantId: string,
  knockedOutBy: string | null,
  nowMs: number,
): Result<PlannedBust, BustPlayerRefusal> {
  if (!isInPlay(clock)) return fail("wrong_status");
  const bust = planBust(entrants, entrantId, nowMs);
  if (!bust.ok) return bust;

  const knockerIsIn = playersLeft(entrants).some(
    ({ id }) => id === knockedOutBy && id !== entrantId,
  );
  if (knockedOutBy !== null && !knockerIsIn) return fail("bad_knocker");
  return ok({ ...bust.value, knocked_out_by: knockedOutBy });
}

export type UndoPlayerRefusal = UndoBustRefusal | "wrong_status";

// Undoing the most recent bust, while the clock is in play.
export function planUndoPlayer(
  clock: Pick<TournamentClock, "status">,
  entrants: ClockEntrant[],
  entrantId: string,
): Result<{ busted_at: null; finish_place: null }, UndoPlayerRefusal> {
  if (!isInPlay(clock)) return fail("wrong_status");
  return planUndoBust(entrants, entrantId);
}

// Each player's newest knockout by bust time, by entrant id: their current
// bust while they're out. A re-entry keeps the old row, so a player can have
// several; on a tie the later row wins.
export function latestKnockouts(
  knockouts: ClockKnockout[],
): Map<string, ClockKnockout> {
  const latest = new Map<string, ClockKnockout>();
  knockouts.forEach((knockout) => {
    const current = latest.get(knockout.entrant_id);
    if (!current || knockout.busted_at >= current.busted_at) {
      latest.set(knockout.entrant_id, knockout);
    }
  });
  return latest;
}

export type TakeAwayRebuyRefusal = "not_found" | "finished" | "no_rebuys";

// Takes one rebuy off a player (a rebuy added by mistake), in any status
// but finished. The player's bust and place stay as they are.
export function planTakeAwayRebuy(
  clock: Pick<TournamentClock, "status">,
  entrants: ClockEntrant[],
  entrantId: string,
): Result<{ rebuys: number }, TakeAwayRebuyRefusal> {
  const entrant = entrants.find(({ id }) => id === entrantId);
  if (!entrant) return fail("not_found");
  if (clock.status === "finished") return fail("finished");
  if (entrant.rebuys <= 0) return fail("no_rebuys");
  return ok({ rebuys: entrant.rebuys - 1 });
}

// Who can be named as this player's knocker: every other player who is
// still in, or who went out later than they did (a better finish place).
// Empty for a player who is still in.
export function knockerChoices(
  entrants: ClockEntrant[],
  entrantId: string,
): ClockEntrant[] {
  const entrant = entrants.find(({ id }) => id === entrantId);
  if (!entrant || entrant.busted_at === null) return [];
  const place = entrant.finish_place ?? Infinity;
  return entrants.filter(
    ({ id, busted_at, finish_place }) =>
      id !== entrantId &&
      (busted_at === null || (finish_place ?? Infinity) < place),
  );
}

export type ChangeKnockerRefusal =
  | "not_found"
  | "finished"
  | "not_busted"
  | "bad_knocker";

export type PlannedKnockerChange = {
  knockoutId: string;
  knocked_out_by: string | null;
};

// Changes who knocked a player out (null: not recorded), on their current
// bust's knockout row. The knocker must be one of knockerChoices.
export function planChangeKnocker(
  clock: Pick<TournamentClock, "status">,
  entrants: ClockEntrant[],
  knockouts: ClockKnockout[],
  entrantId: string,
  knockedOutBy: string | null,
): Result<PlannedKnockerChange, ChangeKnockerRefusal> {
  const entrant = entrants.find(({ id }) => id === entrantId);
  if (!entrant) return fail("not_found");
  if (clock.status === "finished") return fail("finished");
  if (entrant.busted_at === null) return fail("not_busted");

  const knockout = latestKnockouts(knockouts).get(entrantId);
  if (!knockout) return fail("not_found");
  const isChoice = knockerChoices(entrants, entrantId).some(
    ({ id }) => id === knockedOutBy,
  );
  if (knockedOutBy !== null && !isChoice) return fail("bad_knocker");
  return ok({ knockoutId: knockout.id, knocked_out_by: knockedOutBy });
}
