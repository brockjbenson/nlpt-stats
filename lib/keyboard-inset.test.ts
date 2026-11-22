import { describe, expect, it } from "vitest";
import {
  isKeyboardOpen,
  KEYBOARD_MIN_HEIGHT,
  keyboardInset,
} from "@/lib/keyboard-inset";

describe("keyboardInset", () => {
  it("is 0 when the whole layout viewport is visible", () => {
    expect(
      keyboardInset({
        layoutHeight: 844,
        visibleHeight: 844,
        visibleOffsetTop: 0,
      }),
    ).toBe(0);
  });

  it("is the keyboard's height when the visible area shrinks from the bottom", () => {
    expect(
      keyboardInset({
        layoutHeight: 844,
        visibleHeight: 508,
        visibleOffsetTop: 0,
      }),
    ).toBe(336);
  });

  it("takes off how far the browser scrolled the page to show the input", () => {
    // iOS scrolled the visible area 120px down; its bottom edge is now 216px
    // above the layout viewport's.
    expect(
      keyboardInset({
        layoutHeight: 844,
        visibleHeight: 508,
        visibleOffsetTop: 120,
      }),
    ).toBe(216);
  });

  it("never goes below 0", () => {
    expect(
      keyboardInset({
        layoutHeight: 800,
        visibleHeight: 820,
        visibleOffsetTop: 0,
      }),
    ).toBe(0);
  });

  it("rounds to whole pixels", () => {
    expect(
      keyboardInset({
        layoutHeight: 844,
        visibleHeight: 507.6,
        visibleOffsetTop: 0,
      }),
    ).toBe(336);
  });
});

describe("isKeyboardOpen", () => {
  it("treats a small change as browser chrome", () => {
    expect(isKeyboardOpen(0)).toBe(false);
    expect(isKeyboardOpen(KEYBOARD_MIN_HEIGHT - 1)).toBe(false);
  });

  it("treats a large change as a keyboard", () => {
    expect(isKeyboardOpen(KEYBOARD_MIN_HEIGHT)).toBe(true);
    expect(isKeyboardOpen(336)).toBe(true);
  });
});
