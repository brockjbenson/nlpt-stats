import { keyboardInset } from "@/lib/keyboard-inset";
import { useSyncExternalStore } from "react";

export type KeyboardInset = {
  // How far above the bottom of the screen the on-screen keyboard reaches.
  inset: number;
  // The height of the part of the page left visible above it.
  visibleHeight: number;
};

// The visible area resizes as the keyboard opens and scrolls when iOS moves
// the page to show a focused input; both change the numbers.
function subscribe(onChange: () => void): () => void {
  const viewport = window.visualViewport;
  if (!viewport) return () => {};
  viewport.addEventListener("resize", onChange);
  viewport.addEventListener("scroll", onChange);
  return () => {
    viewport.removeEventListener("resize", onChange);
    viewport.removeEventListener("scroll", onChange);
  };
}

function currentInset(): number {
  const viewport = window.visualViewport;
  if (!viewport) return 0;
  return keyboardInset({
    layoutHeight: window.innerHeight,
    visibleHeight: viewport.height,
    visibleOffsetTop: viewport.offsetTop,
  });
}

function currentVisibleHeight(): number {
  return Math.round(window.visualViewport?.height ?? window.innerHeight);
}

// Follows the on-screen keyboard through the Visual Viewport API, so a fixed
// bottom sheet can sit above it. 0 on the server and where the API is
// missing.
export function useKeyboardInset(): KeyboardInset {
  const inset = useSyncExternalStore(subscribe, currentInset, () => 0);
  const visibleHeight = useSyncExternalStore(
    subscribe,
    currentVisibleHeight,
    () => 0,
  );
  return { inset, visibleHeight };
}
