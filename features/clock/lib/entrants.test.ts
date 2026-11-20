import { describe, expect, it } from "vitest";
import {
  planBust,
  planFinish,
  planRebuy,
  planUndoBust,
  playersLeft,
} from "@/features/clock/lib/entrants";
import { makeClock, makeEntrant } from "@/features/clock/lib/test-fixtures";
import type { ClockEntrant } from "@/features/clock/types";

const NOW_MS = Date.parse("2026-11-27T20:00:00.000Z");
const runningClock = makeClock({
  status: "running",
  level_started_at: "2026-11-27T19:00:00.000Z",
});

function field(count: number): ClockEntrant[] {
  return Array.from({ length: count }, () => makeEntrant());
}

// Busts the players in order, applying each planned update.
function bust(entrants: ClockEntrant[], ...ids: string[]): ClockEntrant[] {
  return ids.reduce((current, id) => {
    const result = planBust(current, id, NOW_MS);
    if (!result.ok) throw new Error(`refused: ${result.reason}`);
    return current.map((entrant) =>
      entrant.id === id ? { ...entrant, ...result.value } : entrant,
    );
  }, entrants);
}

describe("playersLeft", () => {
  it("leaves out busted players", () => {
    const players = field(3);
    expect(playersLeft(bust(players, players[0].id))).toHaveLength(2);
  });
});

describe("planBust", () => {
  it("places the player by how many were left", () => {
    const players = field(10);
    expect(planBust(players, players[3].id, NOW_MS)).toEqual({
      ok: true,
      value: {
        busted_at: new Date(NOW_MS).toISOString(),
        finish_place: 10,
      },
    });
    const afterOne = bust(players, players[3].id);
    expect(planBust(afterOne, players[7].id, NOW_MS)).toMatchObject({
      ok: true,
      value: { finish_place: 9 },
    });
  });

  it("refuses an unknown player", () => {
    expect(planBust(field(3), "nobody", NOW_MS)).toEqual({
      ok: false,
      reason: "not_found",
    });
  });

  it("refuses a player who is already out", () => {
    const players = field(3);
    const after = bust(players, players[0].id);
    expect(planBust(after, players[0].id, NOW_MS)).toEqual({
      ok: false,
      reason: "already_busted",
    });
  });

  it("refuses the last player, who wins at the finish", () => {
    const players = field(2);
    const after = bust(players, players[0].id);
    expect(planBust(after, players[1].id, NOW_MS)).toEqual({
      ok: false,
      reason: "last_player",
    });
  });
});

describe("planUndoBust", () => {
  it("brings back the most recent bust", () => {
    const players = field(5);
    const after = bust(players, players[0].id, players[1].id);
    expect(planUndoBust(after, players[1].id)).toEqual({
      ok: true,
      value: { busted_at: null, finish_place: null },
    });
  });

  it("refuses an earlier bust, so places stay in order", () => {
    const players = field(5);
    const after = bust(players, players[0].id, players[1].id);
    expect(planUndoBust(after, players[0].id)).toEqual({
      ok: false,
      reason: "not_most_recent",
    });
  });

  it("refuses a player who is still in, or unknown", () => {
    const players = field(3);
    expect(planUndoBust(players, players[0].id)).toEqual({
      ok: false,
      reason: "not_busted",
    });
    expect(planUndoBust(players, "nobody")).toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("planRebuy", () => {
  it("adds a rebuy for a player who is still in", () => {
    const players = field(6);
    expect(planRebuy(runningClock, players, players[0].id)).toEqual({
      ok: true,
      value: { rebuys: 1, busted_at: null, finish_place: null },
    });
  });

  it("lets the most recent bust back in", () => {
    const players = field(8);
    const after = bust(players, players[0].id, players[1].id);
    expect(planRebuy(runningClock, after, players[1].id)).toEqual({
      ok: true,
      value: { rebuys: 1, busted_at: null, finish_place: null },
    });
  });

  it("refuses an earlier bust", () => {
    const players = field(8);
    const after = bust(players, players[0].id, players[1].id);
    expect(planRebuy(runningClock, after, players[0].id)).toEqual({
      ok: false,
      reason: "not_most_recent",
    });
  });

  it("refuses past the rebuy limit", () => {
    const players = [makeEntrant({ rebuys: 2 }), ...field(6)];
    expect(planRebuy(runningClock, players, players[0].id)).toEqual({
      ok: false,
      reason: "max_rebuys",
    });
  });

  it("allows rebuys while more players are left than places paid", () => {
    const players = field(5);
    expect(planRebuy(runningClock, players, players[0].id).ok).toBe(true);
  });

  it("refuses once everyone left is in the money", () => {
    const players = field(4);
    expect(planRebuy(runningClock, players, players[0].id)).toEqual({
      ok: false,
      reason: "in_the_money",
    });
  });

  it("refuses the bubble player once the money is reached", () => {
    const players = field(5);
    const after = bust(players, players[4].id);
    expect(planRebuy(runningClock, after, players[4].id)).toEqual({
      ok: false,
      reason: "in_the_money",
    });
  });

  it("allows rebuys while paused", () => {
    const paused = makeClock({ status: "paused", paused_remaining_ms: 1000 });
    const players = field(6);
    expect(planRebuy(paused, players, players[0].id).ok).toBe(true);
  });

  it.each(["setup", "finished"] as const)(
    "refuses when the clock is in %s",
    (status) => {
      const players = field(6);
      expect(planRebuy(makeClock({ status }), players, players[0].id)).toEqual({
        ok: false,
        reason: "wrong_status",
      });
    },
  );

  it("refuses an unknown player", () => {
    expect(planRebuy(runningClock, field(6), "nobody")).toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("planFinish", () => {
  it("places the last player 1st", () => {
    const players = field(3);
    const after = bust(players, players[0].id, players[2].id);
    expect(planFinish(after)).toEqual({
      ok: true,
      value: { entrantId: players[1].id, finish_place: 1 },
    });
  });

  it("refuses while more than one player is left", () => {
    expect(planFinish(field(2))).toEqual({
      ok: false,
      reason: "players_remaining",
    });
  });

  it("refuses with nobody left", () => {
    expect(planFinish([])).toEqual({ ok: false, reason: "no_players" });
  });
});
