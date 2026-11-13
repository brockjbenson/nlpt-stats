// Web haptics — best-effort across platforms. Only fires in standalone PWA
// to avoid surprising users in regular browser tabs.
//
//   Android (Chrome/Firefox/Edge): Vibration API
//   iOS Safari: WebKit switch-toggle hack (clicking the label of a hidden
//     `<input type="checkbox" switch>` triggers a light system haptic)
//   Anything else: silent no-op
//
// Ported from the oxbros web app.

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  return (window.navigator as { standalone?: boolean }).standalone === true;
}

function vibrate(pattern: number | number[]): boolean {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function"
  ) {
    return false;
  }
  try {
    return navigator.vibrate(pattern);
  } catch {
    return false;
  }
}

// One persistent switch element kept in the DOM. Toggling its label fires
// a system haptic in WebKit (PWA mode). Persistent because creating +
// clicking on every haptic call is unreliable inside touch handlers — iOS
// often hasn't laid out the freshly-appended element yet, so the click
// silently no-ops.
let switchLabelEl: HTMLLabelElement | null = null;

function ensureSwitchEl(): HTMLLabelElement | null {
  if (switchLabelEl && document.body.contains(switchLabelEl)) {
    return switchLabelEl;
  }
  if (typeof document === "undefined" || !document.body) return null;
  try {
    const wrapper = document.createElement("div");
    const id = `haptic-${Math.random().toString(36).slice(2)}`;
    wrapper.innerHTML = `<input type="checkbox" id="${id}" switch /><label for="${id}"></label>`;
    wrapper.setAttribute("aria-hidden", "true");
    // Real layout box so iOS treats the element as "live" — but zero-sized
    // and clipped so it never affects the page.
    wrapper.setAttribute(
      "style",
      "position:fixed;left:0;top:0;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);pointer-events:none;opacity:0;",
    );
    document.body.appendChild(wrapper);
    switchLabelEl = wrapper.querySelector("label");
    return switchLabelEl;
  } catch {
    return null;
  }
}

function iosSwitchHaptic(): void {
  const el = ensureSwitchEl();
  if (!el) return;
  try {
    el.click();
  } catch {
    // ignore
  }
}

export function haptic(pattern: number | number[] = 10): void {
  if (typeof navigator === "undefined") return;
  if (!isStandalone()) return;

  if (vibrate(pattern)) return; // Android path
  iosSwitchHaptic(); // iOS fallback
}
