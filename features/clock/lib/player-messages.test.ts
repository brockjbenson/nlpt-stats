import { describe, expect, it } from "vitest";
import {
  addRefusalMessage,
  bustRefusalMessage,
  rebuyRefusalMessage,
  undoRefusalMessage,
} from "@/features/clock/lib/player-messages";

describe("player refusal messages", () => {
  it.each([
    [bustRefusalMessage("last_player"), "The last player left can't bust."],
    [
      bustRefusalMessage("bad_knocker"),
      "Pick a player who is still in for the knockout.",
    ],
    [
      undoRefusalMessage("not_most_recent"),
      "Only the most recent bust can be undone.",
    ],
    [
      rebuyRefusalMessage("in_the_money", 2),
      "Everyone left is in the money: no more rebuys.",
    ],
    [
      rebuyRefusalMessage("not_most_recent", 2),
      "Only the most recent bust can rebuy back in.",
    ],
    [
      addRefusalMessage("after_first_bust"),
      "Players can't be added after the first bust.",
    ],
  ])("says %j", (message, expected) => {
    expect(message).toBe(expected);
  });

  it("says how many rebuys are allowed", () => {
    expect(rebuyRefusalMessage("max_rebuys", 2)).toBe(
      "Each player can rebuy 2 times at most.",
    );
    expect(rebuyRefusalMessage("max_rebuys", 1)).toBe(
      "Each player can rebuy 1 time at most.",
    );
    expect(rebuyRefusalMessage("max_rebuys", 0)).toBe(
      "This clock doesn't allow rebuys.",
    );
  });

  it("has a sentence for every refusal", () => {
    const messages = [
      ...(
        [
          "not_found",
          "already_busted",
          "last_player",
          "wrong_status",
          "bad_knocker",
        ] as const
      ).map(bustRefusalMessage),
      ...(
        ["not_found", "not_busted", "not_most_recent", "wrong_status"] as const
      ).map(undoRefusalMessage),
      ...(
        [
          "not_found",
          "wrong_status",
          "max_rebuys",
          "not_most_recent",
          "in_the_money",
        ] as const
      ).map((reason) => rebuyRefusalMessage(reason, 2)),
      ...(
        [
          "finished",
          "after_first_bust",
          "nothing_to_add",
          "already_playing",
          "bad_guest_name",
          "duplicate_guest",
        ] as const
      ).map(addRefusalMessage),
    ];
    for (const message of messages) expect(message).toMatch(/^[A-Z].*\.$/);
  });
});
