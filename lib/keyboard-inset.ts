// Below this, a shrunken visible area is browser chrome (a toolbar showing or
// hiding), not an on-screen keyboard.
export const KEYBOARD_MIN_HEIGHT = 100;

export type ViewportSize = {
  // window.innerHeight: the layout viewport fixed elements are placed in.
  layoutHeight: number;
  // visualViewport.height: the part of the page the user can actually see.
  visibleHeight: number;
  // visualViewport.offsetTop: how far the browser has scrolled the visible
  // part down inside the layout viewport (iOS does this to show a focused
  // input).
  visibleOffsetTop: number;
};

// How far above the layout viewport's bottom edge the visible area ends: the
// space an on-screen keyboard covers. A fixed element moved up by this much
// sits right above the keyboard, even when the browser has scrolled the page
// to show the focused input.
export function keyboardInset({
  layoutHeight,
  visibleHeight,
  visibleOffsetTop,
}: ViewportSize): number {
  return Math.max(
    0,
    Math.round(layoutHeight - visibleHeight - visibleOffsetTop),
  );
}

// Whether that space is a keyboard rather than a toolbar.
export function isKeyboardOpen(inset: number): boolean {
  return inset >= KEYBOARD_MIN_HEIGHT;
}
