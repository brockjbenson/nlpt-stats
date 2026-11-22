import { describe, expect, it } from "vitest";
import {
  addPlayersBlocked,
  canRemoveEntrant,
  cleanGuestName,
  entrantNames,
  GUEST_NAME_MAX_LENGTH,
  knockerChoices,
  latestKnockouts,
  listPlayers,
  type MemberName,
  planAddEntrants,
  planBustPlayer,
  planChangeKnocker,
  planTakeAwayRebuy,
  planUndoPlayer,
} from "@/features/clock/lib/players";
import { makeClock, makeEntrant } from "@/features/clock/lib/test-fixtures";
import type { ClockEntrant, ClockKnockout } from "@/features/clock/types";

const ALEX_SMITH: MemberName = {
  id: "m-alex-smith",
  first_name: "Alex",
  last_name: "Smith",
};
const ALEX_STONE: MemberName = {
  id: "m-alex-stone",
  first_name: "Alex",
  last_name: "Stone",
};
const SAM_JONES: MemberName = {
  id: "m-sam-jones",
  first_name: "Sam",
  last_name: "Jones",
};
const MEMBERS = [ALEX_SMITH, ALEX_STONE, SAM_JONES];

function member(memberId: string, change: Partial<ClockEntrant> = {}) {
  return makeEntrant({ member_id: memberId, guest_name: null, ...change });
}

function guest(name: string, change: Partial<ClockEntrant> = {}) {
  return makeEntrant({ member_id: null, guest_name: name, ...change });
}

function busted(place: number): Partial<ClockEntrant> {
  return { busted_at: "2026-11-27T01:00:00.000Z", finish_place: place };
}

function knockout(
  entrantId: string,
  knockedOutBy: string | null,
): ClockKnockout {
  return {
    id: `ko-${entrantId}`,
    clock_id: "clock",
    entrant_id: entrantId,
    knocked_out_by: knockedOutBy,
    busted_at: "2026-11-27T01:00:00.000Z",
    created_at: "2026-11-27T01:00:00.000Z",
  };
}

describe("entrantNames", () => {
  it("shows members as first name and last initial", () => {
    const smith = member(ALEX_SMITH.id);
    const jones = member(SAM_JONES.id);
    const names = entrantNames([smith, jones], MEMBERS);
    expect(names.get(smith.id)).toBe("Alex S.");
    expect(names.get(jones.id)).toBe("Sam J.");
  });

  it("uses full names for members who would look the same", () => {
    const smith = member(ALEX_SMITH.id);
    const stone = member(ALEX_STONE.id);
    const jones = member(SAM_JONES.id);
    const names = entrantNames([smith, stone, jones], MEMBERS);
    expect(names.get(smith.id)).toBe("Alex Smith");
    expect(names.get(stone.id)).toBe("Alex Stone");
    expect(names.get(jones.id)).toBe("Sam J.");
  });

  it("shows a guest's name as typed", () => {
    const rob = guest("Uncle Rob");
    expect(entrantNames([rob], MEMBERS).get(rob.id)).toBe("Uncle Rob");
  });

  it("uses a full name when a guest has the short name", () => {
    const smith = member(ALEX_SMITH.id);
    const alex = guest("Alex S.");
    const names = entrantNames([smith, alex], MEMBERS);
    expect(names.get(smith.id)).toBe("Alex Smith");
    expect(names.get(alex.id)).toBe("Alex S.");
  });

  it("shows a first name alone when there's no last name", () => {
    const solo = member("m-solo");
    const names = entrantNames(
      [solo],
      [{ id: "m-solo", first_name: "Cher", last_name: " " }],
    );
    expect(names.get(solo.id)).toBe("Cher");
  });

  it("falls back to 'Member' for an unknown member", () => {
    const missing = member("m-missing");
    expect(entrantNames([missing], MEMBERS).get(missing.id)).toBe("Member");
  });
});

describe("listPlayers", () => {
  const smith = member(ALEX_SMITH.id);
  const jones = member(SAM_JONES.id, busted(5));
  const rob = guest("Uncle Rob");
  const stone = member(ALEX_STONE.id, busted(4));
  const bea = guest("Bea");
  const entrants = [smith, jones, rob, stone, bea];
  const knockouts = [
    knockout(jones.id, smith.id),
    knockout(stone.id, smith.id),
  ];
  const { left, out } = listPlayers(
    entrants,
    knockouts,
    entrantNames(entrants, MEMBERS),
  );

  it("lists players still in by name", () => {
    expect(left.map(({ name }) => name)).toEqual([
      "Alex Smith",
      "Bea",
      "Uncle Rob",
    ]);
  });

  it("lists players out by finishing place, best first", () => {
    expect(out.map(({ entrant }) => entrant.finish_place)).toEqual([4, 5]);
  });

  it("counts each player's knockouts", () => {
    expect(left.find(({ entrant }) => entrant === smith)?.knockouts).toBe(2);
    expect(out.every(({ knockouts }) => knockouts === 0)).toBe(true);
  });

  it("marks guests", () => {
    expect(left.map(({ isGuest }) => isGuest)).toEqual([false, true, true]);
  });
});

describe("cleanGuestName", () => {
  it("trims the name", () => {
    expect(cleanGuestName("  Uncle Rob ")).toBe("Uncle Rob");
  });

  it("is null for a blank name", () => {
    expect(cleanGuestName("   ")).toBeNull();
  });
});

describe("planAddEntrants", () => {
  const setup = makeClock();

  it("adds members and guests", () => {
    const plan = planAddEntrants(
      setup,
      [],
      [ALEX_SMITH.id, SAM_JONES.id],
      [" Uncle Rob "],
    );
    expect(plan).toEqual({
      ok: true,
      value: [
        { member_id: ALEX_SMITH.id, guest_name: null },
        { member_id: SAM_JONES.id, guest_name: null },
        { member_id: null, guest_name: "Uncle Rob" },
      ],
    });
  });

  it("adds a member picked twice once", () => {
    const plan = planAddEntrants(setup, [], [SAM_JONES.id, SAM_JONES.id], []);
    expect(plan.ok && plan.value).toHaveLength(1);
  });

  it("works while the clock is running or paused", () => {
    for (const status of ["running", "paused"] as const) {
      const clock = makeClock({ status });
      expect(planAddEntrants(clock, [], [SAM_JONES.id], []).ok).toBe(true);
    }
  });

  it.each<[string, Parameters<typeof planAddEntrants>, string]>([
    [
      "a finished clock",
      [makeClock({ status: "finished" }), [], [SAM_JONES.id], []],
      "finished",
    ],
    [
      "adding while a player is out",
      [
        setup,
        [member(ALEX_SMITH.id, busted(2)), guest("Bea")],
        [SAM_JONES.id],
        [],
      ],
      "player_out",
    ],
    ["nobody to add", [setup, [], [], []], "nothing_to_add"],
    [
      "a member already playing",
      [setup, [member(SAM_JONES.id)], [SAM_JONES.id], []],
      "already_playing",
    ],
    ["a blank guest name", [setup, [], [], ["  "]], "bad_guest_name"],
    [
      "a guest name that's too long",
      [setup, [], [], ["x".repeat(GUEST_NAME_MAX_LENGTH + 1)]],
      "bad_guest_name",
    ],
    [
      "a guest already playing, in another case",
      [setup, [guest("Rob")], [], ["rob"]],
      "duplicate_guest",
    ],
    [
      "the same guest twice",
      [setup, [], [], ["Bea", " BEA "]],
      "duplicate_guest",
    ],
  ])("refuses %s", (_name, args, reason) => {
    expect(planAddEntrants(...args)).toEqual({ ok: false, reason });
  });

  it("accepts a guest name at the length limit", () => {
    const name = "x".repeat(GUEST_NAME_MAX_LENGTH);
    expect(planAddEntrants(setup, [], [], [name]).ok).toBe(true);
  });
});

describe("canRemoveEntrant", () => {
  const smith = member(ALEX_SMITH.id);
  const jones = member(SAM_JONES.id, busted(3));

  it("allows a player who never busted or knocked anyone out", () => {
    expect(canRemoveEntrant(guest("Bea"), [knockout(jones.id, smith.id)])).toBe(
      true,
    );
  });

  it("refuses a player who is out", () => {
    expect(canRemoveEntrant(jones, [])).toBe(false);
  });

  it("refuses a player who knocked someone out", () => {
    expect(canRemoveEntrant(smith, [knockout(jones.id, smith.id)])).toBe(false);
  });

  it("refuses a player who rebought after a knockout", () => {
    const back = member(ALEX_STONE.id, { rebuys: 1 });
    expect(canRemoveEntrant(back, [knockout(back.id, null)])).toBe(false);
  });
});

describe("planBustPlayer", () => {
  const NOW_MS = Date.parse("2026-11-27T02:00:00.000Z");
  const running = makeClock({
    status: "running",
    level_started_at: "2026-11-27T01:00:00.000Z",
  });
  const smith = member(ALEX_SMITH.id);
  const jones = member(SAM_JONES.id);
  const rob = guest("Uncle Rob");
  const gone = guest("Bea", busted(4));
  const entrants = [smith, jones, rob, gone];

  it("busts into the next place, with who knocked them out", () => {
    expect(
      planBustPlayer(running, entrants, jones.id, smith.id, NOW_MS),
    ).toEqual({
      ok: true,
      value: {
        finish_place: 3,
        busted_at: "2026-11-27T02:00:00.000Z",
        knocked_out_by: smith.id,
      },
    });
  });

  it("allows no knockout to be recorded", () => {
    const plan = planBustPlayer(running, entrants, jones.id, null, NOW_MS);
    expect(plan.ok && plan.value.knocked_out_by).toBeNull();
  });

  it("works while paused", () => {
    const paused = makeClock({ status: "paused", paused_remaining_ms: 1000 });
    expect(planBustPlayer(paused, entrants, jones.id, null, NOW_MS).ok).toBe(
      true,
    );
  });

  it.each<[string, Parameters<typeof planBustPlayer>, string]>([
    [
      "before the clock starts",
      [makeClock(), entrants, jones.id, null, NOW_MS],
      "wrong_status",
    ],
    [
      "once the clock is finished",
      [
        makeClock({ status: "finished", paused_remaining_ms: 0 }),
        entrants,
        jones.id,
        null,
        NOW_MS,
      ],
      "wrong_status",
    ],
    [
      "a knockout by themselves",
      [running, entrants, jones.id, jones.id, NOW_MS],
      "bad_knocker",
    ],
    [
      "a knockout by a player who is out",
      [running, entrants, jones.id, gone.id, NOW_MS],
      "bad_knocker",
    ],
    [
      "a knockout by someone not in this clock",
      [running, entrants, jones.id, "nobody", NOW_MS],
      "bad_knocker",
    ],
    [
      "a player already out",
      [running, entrants, gone.id, null, NOW_MS],
      "already_busted",
    ],
    [
      "the last player left",
      [running, [smith, gone], smith.id, null, NOW_MS],
      "last_player",
    ],
  ])("refuses %s", (_name, args, reason) => {
    expect(planBustPlayer(...args)).toEqual({ ok: false, reason });
  });
});

describe("planUndoPlayer", () => {
  const running = makeClock({
    status: "running",
    level_started_at: "2026-11-27T01:00:00.000Z",
  });
  const fourth = guest("Bea", busted(4));
  const fifth = guest("Cy", busted(5));
  const entrants = [
    member(ALEX_SMITH.id),
    member(SAM_JONES.id),
    guest("Rob"),
    fourth,
    fifth,
  ];

  it("undoes the most recent bust", () => {
    expect(planUndoPlayer(running, entrants, fourth.id).ok).toBe(true);
  });

  it("refuses an earlier bust", () => {
    expect(planUndoPlayer(running, entrants, fifth.id)).toEqual({
      ok: false,
      reason: "not_most_recent",
    });
  });

  it("refuses once the clock is finished", () => {
    const finished = makeClock({ status: "finished", paused_remaining_ms: 0 });
    expect(planUndoPlayer(finished, entrants, fourth.id)).toEqual({
      ok: false,
      reason: "wrong_status",
    });
  });
});

describe("addPlayersBlocked", () => {
  it("allows adding again once a re-entry brings everyone back", () => {
    expect(
      addPlayersBlocked(makeClock({ status: "running" }), [
        guest("Bea", { rebuys: 1 }),
        guest("Cy"),
      ]),
    ).toBeNull();
  });

  it("is null before anyone busts", () => {
    expect(addPlayersBlocked(makeClock(), [guest("Bea")])).toBeNull();
  });

  it("blocks while a player is out", () => {
    expect(
      addPlayersBlocked(makeClock({ status: "running" }), [
        guest("Bea", busted(2)),
        guest("Cy"),
      ]),
    ).toBe("player_out");
  });

  it("blocks once finished", () => {
    expect(addPlayersBlocked(makeClock({ status: "finished" }), [])).toBe(
      "finished",
    );
  });
});

describe("planTakeAwayRebuy", () => {
  const running = makeClock({ status: "running" });

  it("takes one rebuy off", () => {
    const entrants = [member("a", { rebuys: 2 })];
    expect(planTakeAwayRebuy(running, entrants, entrants[0].id)).toEqual({
      ok: true,
      value: { rebuys: 1 },
    });
  });

  it("works for a player who is out", () => {
    const entrants = [member("a", { rebuys: 1, ...busted(3) })];
    expect(planTakeAwayRebuy(running, entrants, entrants[0].id)).toEqual({
      ok: true,
      value: { rebuys: 0 },
    });
  });

  it("refuses a player with no rebuys", () => {
    const entrants = [member("a", { rebuys: 0 })];
    expect(planTakeAwayRebuy(running, entrants, entrants[0].id)).toEqual({
      ok: false,
      reason: "no_rebuys",
    });
  });

  it("refuses once the clock is finished", () => {
    const entrants = [member("a", { rebuys: 1 })];
    const finished = makeClock({ status: "finished" });
    expect(planTakeAwayRebuy(finished, entrants, entrants[0].id)).toEqual({
      ok: false,
      reason: "finished",
    });
  });

  it("refuses an unknown player", () => {
    expect(planTakeAwayRebuy(running, [], "nobody")).toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});

describe("knockerChoices", () => {
  const stillIn = member("in");
  const outThird = member("third", busted(3));
  const outFifth = member("fifth", busted(5));
  const outSixth = member("sixth", busted(6));
  const all = [stillIn, outThird, outFifth, outSixth];
  const ids = (entrants: ClockEntrant[]) => entrants.map(({ id }) => id);

  it("offers players still in and players who went out later", () => {
    expect(ids(knockerChoices(all, outFifth.id))).toEqual([
      stillIn.id,
      outThird.id,
    ]);
  });

  it("leaves out players who went out earlier", () => {
    expect(ids(knockerChoices(all, outFifth.id))).not.toContain(outSixth.id);
  });

  it("never offers the player themselves", () => {
    expect(ids(knockerChoices(all, outThird.id))).not.toContain(outThird.id);
  });

  it("is empty for a player still in", () => {
    expect(knockerChoices(all, stillIn.id)).toEqual([]);
  });
});

function ko(
  id: string,
  entrantId: string,
  bustedAt: string,
  by: string | null = null,
): ClockKnockout {
  return { ...knockout(entrantId, by), id, busted_at: bustedAt };
}

describe("latestKnockouts", () => {
  const early = "2026-11-27T01:00:00.000Z";
  const late = "2026-11-27T02:00:00.000Z";

  it("keeps the newest row whatever order the rows come in", () => {
    const oldRow = ko("old", "a", early);
    const newRow = ko("new", "a", late);
    expect(latestKnockouts([oldRow, newRow]).get("a")?.id).toBe("new");
    expect(latestKnockouts([newRow, oldRow]).get("a")?.id).toBe("new");
  });

  it("lets the later row win a tie on bust time", () => {
    const knockouts = [ko("first", "a", early), ko("second", "a", early)];
    expect(latestKnockouts(knockouts).get("a")?.id).toBe("second");
  });

  it("keeps different players apart", () => {
    const latest = latestKnockouts([ko("a1", "a", late), ko("b1", "b", early)]);
    expect(latest.get("a")?.id).toBe("a1");
    expect(latest.get("b")?.id).toBe("b1");
    expect(latest.size).toBe(2);
  });
});

describe("planChangeKnocker", () => {
  const running = makeClock({ status: "running" });
  const winner = member("winner");
  const fifth = member("fifth", busted(5));
  const sixth = member("sixth", busted(6));
  const entrants = [winner, fifth, sixth];

  it("picks the newest knockout after a re-entry", () => {
    const knockouts = [
      ko("old", fifth.id, "2026-11-27T01:00:00.000Z"),
      ko("new", fifth.id, "2026-11-27T02:00:00.000Z"),
    ];
    expect(
      planChangeKnocker(running, entrants, knockouts, fifth.id, winner.id),
    ).toEqual({
      ok: true,
      value: { knockoutId: "new", knocked_out_by: winner.id },
    });
  });

  it("allows clearing the knocker", () => {
    const knockouts = [
      ko("k", fifth.id, "2026-11-27T01:00:00.000Z", winner.id),
    ];
    expect(
      planChangeKnocker(running, entrants, knockouts, fifth.id, null),
    ).toEqual({ ok: true, value: { knockoutId: "k", knocked_out_by: null } });
  });

  it("refuses a player who went out earlier", () => {
    const knockouts = [ko("k", fifth.id, "2026-11-27T01:00:00.000Z")];
    expect(
      planChangeKnocker(running, entrants, knockouts, fifth.id, sixth.id),
    ).toEqual({ ok: false, reason: "bad_knocker" });
  });

  it("accepts a player who went out after", () => {
    const knockouts = [ko("k", sixth.id, "2026-11-27T01:00:00.000Z")];
    expect(
      planChangeKnocker(running, entrants, knockouts, sixth.id, fifth.id),
    ).toEqual({
      ok: true,
      value: { knockoutId: "k", knocked_out_by: fifth.id },
    });
  });

  it("refuses naming the player as their own knocker", () => {
    const knockouts = [ko("k", fifth.id, "2026-11-27T01:00:00.000Z")];
    expect(
      planChangeKnocker(running, entrants, knockouts, fifth.id, fifth.id),
    ).toEqual({ ok: false, reason: "bad_knocker" });
  });

  it("refuses a player who is still in", () => {
    expect(planChangeKnocker(running, entrants, [], winner.id, null)).toEqual({
      ok: false,
      reason: "not_busted",
    });
  });

  it("refuses once the clock is finished", () => {
    const finished = makeClock({ status: "finished" });
    expect(planChangeKnocker(finished, entrants, [], fifth.id, null)).toEqual({
      ok: false,
      reason: "finished",
    });
  });

  it("refuses an unknown player, or one with no knockout row", () => {
    expect(planChangeKnocker(running, entrants, [], "nobody", null)).toEqual({
      ok: false,
      reason: "not_found",
    });
    expect(planChangeKnocker(running, entrants, [], fifth.id, null)).toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});
