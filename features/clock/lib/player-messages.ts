import type { RebuyRefusal } from "@/features/clock/lib/entrants";
import { plural } from "@/features/clock/lib/format";
import {
  type AddEntrantsRefusal,
  type BustPlayerRefusal,
  GUEST_NAME_MAX_LENGTH,
  type UndoPlayerRefusal,
} from "@/features/clock/lib/players";

// What the control screen says when a player change is refused.

const PLAYER_GONE = "This player is no longer in this clock.";
const NOT_IN_PLAY = "Only while the clock is running or paused.";

const BUST_MESSAGES: Record<BustPlayerRefusal, string> = {
  not_found: PLAYER_GONE,
  already_busted: "This player is already out.",
  last_player: "The last player left can't bust.",
  wrong_status: `Players can bust ${NOT_IN_PLAY.toLowerCase()}`,
  bad_knocker: "Pick a player who is still in for the knockout.",
};

const UNDO_MESSAGES: Record<UndoPlayerRefusal, string> = {
  not_found: PLAYER_GONE,
  not_busted: "This player isn't out.",
  not_most_recent: "Only the most recent bust can be undone.",
  wrong_status: `Busts can be undone ${NOT_IN_PLAY.toLowerCase()}`,
};

const ADD_MESSAGES: Record<AddEntrantsRefusal, string> = {
  finished: "This clock is finished.",
  after_first_bust: "Players can't be added after the first bust.",
  nothing_to_add: "Pick a member or type a guest's name.",
  already_playing: "A member you picked is already playing.",
  bad_guest_name: `Guest names need 1 to ${GUEST_NAME_MAX_LENGTH} characters.`,
  duplicate_guest: "A guest with that name is already playing.",
};

export function bustRefusalMessage(reason: BustPlayerRefusal): string {
  return BUST_MESSAGES[reason];
}

export function undoRefusalMessage(reason: UndoPlayerRefusal): string {
  return UNDO_MESSAGES[reason];
}

export function addRefusalMessage(reason: AddEntrantsRefusal): string {
  return ADD_MESSAGES[reason];
}

export function rebuyRefusalMessage(
  reason: RebuyRefusal,
  maxRebuys: number,
): string {
  switch (reason) {
    case "not_found":
      return PLAYER_GONE;
    case "wrong_status":
      return `Rebuys happen ${NOT_IN_PLAY.toLowerCase()}`;
    case "max_rebuys":
      return maxRebuys === 0
        ? "This clock doesn't allow rebuys."
        : `Each player can rebuy ${plural(maxRebuys, "time")} at most.`;
    case "not_most_recent":
      return "Only the most recent bust can rebuy back in.";
    case "in_the_money":
      return "Everyone left is in the money: no more rebuys.";
  }
}
