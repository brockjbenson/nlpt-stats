import { describe, expect, it } from "vitest";
import {
  canReopen,
  finishRefusalMessage,
  type FinishRefusal,
  planFinishClock,
} from "@/features/clock/lib/finish";
import { makeClock, makeEntrant } from "@/features/clock/lib/test-fixtures";

const MINUTE = 60_000;
const START_MS = Date.parse("2026-11-27T19:00:00.000Z");

function out(place: number) {
  return makeEntrant({
    busted_at: "2026-11-27T20:00:00.000Z",
    finish_place: place,
  });
}

const winner = makeEntrant();
const field = [winner, out(2), out(3)];

describe("planFinishClock", () => {
  it("names the winner and saves where a running clock got to", () => {
    // 25 minutes in: level 2 with 15 minutes left.
    const clock = makeClock({
      status: "running",
      level_started_at: new Date(START_MS).toISOString(),
    });
    const nowMs = START_MS + 25 * MINUTE;
    expect(planFinishClock(clock, field, nowMs)).toEqual({
      ok: true,
      value: {
        winnerId: winner.id,
        finishedAt: new Date(nowMs).toISOString(),
        levelIndex: 1,
        remainingMs: 15 * MINUTE,
      },
    });
  });

  it("keeps a paused clock's time left", () => {
    const clock = makeClock({
      status: "paused",
      level_index: 6,
      paused_remaining_ms: 90_000,
    });
    const plan = planFinishClock(clock, field, START_MS);
    expect(plan.ok && plan.value).toMatchObject({
      levelIndex: 6,
      remainingMs: 90_000,
    });
  });

  it.each<[string, Parameters<typeof planFinishClock>, FinishRefusal]>([
    [
      "with two players still in",
      [
        makeClock({
          status: "running",
          level_started_at: new Date(START_MS).toISOString(),
        }),
        [winner, makeEntrant(), out(3)],
        START_MS,
      ],
      "players_remaining",
    ],
    [
      "with no players",
      [
        makeClock({ status: "paused", paused_remaining_ms: 1000 }),
        [],
        START_MS,
      ],
      "no_players",
    ],
    ["before the clock starts", [makeClock(), field, START_MS], "wrong_status"],
    [
      "once it's finished",
      [
        makeClock({ status: "finished", paused_remaining_ms: 0 }),
        field,
        START_MS,
      ],
      "wrong_status",
    ],
  ])("refuses %s", (_name, args, reason) => {
    expect(planFinishClock(...args)).toEqual({ ok: false, reason });
  });
});

describe("canReopen", () => {
  it("allows a finished clock without saved results", () => {
    expect(canReopen(makeClock({ status: "finished" }))).toBe(true);
  });

  it("refuses once results are saved", () => {
    expect(
      canReopen(makeClock({ status: "finished", tournament_id: "t-1" })),
    ).toBe(false);
  });

  it("refuses a clock that isn't finished", () => {
    expect(canReopen(makeClock({ status: "paused" }))).toBe(false);
  });
});

describe("finishRefusalMessage", () => {
  it.each<FinishRefusal>(["wrong_status", "players_remaining", "no_players"])(
    "has a sentence for %s",
    (reason) => {
      expect(finishRefusalMessage(reason)).toMatch(/^[A-Z].*\.$/);
    },
  );

  it("says to bust players down to one", () => {
    expect(finishRefusalMessage("players_remaining")).toBe(
      "Bust players until one is left.",
    );
  });
});
