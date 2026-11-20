# Tournament Clock Phase 6 (TV Mode & Sounds) Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use executing-plans to implement this plan task-by-task.

**Ticket:** none

**Goal:** The display chimes at the one-minute warning and when the level changes, and a TV mode button makes it fullscreen and keeps the screen awake.

**Architecture:** Sounds are decided by a pure function that compares the display's previous tick with the current one (`planSoundCue`), so a chime plays once, on the screen that's watching, when a level really changes or the last minute starts. It never plays for a jump caused by loading, waking or a refetch. Chimes are synthesized with the Web Audio API from short note lists, so there are no audio files. Browsers only allow sound after a tap, so the display shows a sound button and a one-time "Tap to enable sound" prompt; entering TV mode counts as that tap. TV mode is the Fullscreen API plus a Screen Wake Lock (taken again whenever the tab becomes visible). Both degrade quietly where the browser doesn't support them.

**Tech Stack:** React 19 hooks, Web Audio API (`AudioContext`, oscillators), Fullscreen API, Screen Wake Lock API, Vitest.

**Standards:** Scheels tech-standards-devs as general guidance (strict TS, explicit types, early returns, single responsibility). TDD for pure logic. Repo conventions: thin `app/` routes over `features/clock/{components,hooks,lib}`; browser-only code stays out of `lib/` (pure); no ticket prefix and no AI attribution in commits.

**Design:** `docs/plans/2026-11-18-tournament-clock-design.md` (Sounds & TV mode). Earlier phases: `...-phase-4-clock-core.md`, `...-phase-5-entrants.md`. Branch: `feat/tournament-shot-clock`.

**Status (2026-11-20):** Tasks 1–7 and the R1–R5 refinement pass are done on dev. Only R2 changed anything (the wake lock moved into `useWakeLock`); R4 left the four `.catch(() => undefined)` calls as they are, since a helper for a one-liner wouldn't read better.

**Changes from this plan:**
- **`useSound` reads the saved choice with `useSyncExternalStore`** (server snapshot: off) instead of setting state in an effect, which React's lint rule flags. It also follows changes from other tabs, and keeps the choice in memory where storage is blocked.
- **The page's tap-to-unlock listens for `click`**, not `pointerdown`: on touch screens browsers only count a tap as permission for audio once the finger lifts.
- **Removing a minute across the one-minute mark warns** (it really is under a minute now).
- **Task 6 drove the clock with SQL updates** (70-second levels, jumping to a few seconds before each moment) instead of the control screen, and read the chimes from the console. Every case matched: start silent, warning once per level and break, `level` when a level ends and on Next while running, `break` at a break, pause / change while paused / resume silent.
- **Not checked:** fullscreen (it didn't go fullscreen when the TV mode button was clicked under automation, though the browser reports it as available; testing it was stopped at the user's request), the wake lock that comes with it, silence after a sleeping tab (unit tested only), and how the chimes sound.

---

## Decisions made in this plan (confirm before starting)

1. **Three chimes, all synthesized:** a short two-note **warning** at one minute left, a rising three-note **level up** when a new playing level starts, and a softer, lower **break** chime when a break starts. No sound files to source or license; they're note lists in code.
2. **The warning plays on breaks too** (one minute until play resumes). Nothing plays when the last level runs out (the clock just sits at 0:00).
3. **Chimes only play while the clock is running**, including when the admin presses Next or Previous while running. Pausing, resuming, starting, and pressing Next while paused stay silent.
4. **No chime for jumps:** if more than 2 seconds passed between the two ticks being compared (a sleeping tab, a refetch after reconnecting, the first tick after loading), the change is applied silently. A TV that slept through three levels doesn't play three chimes when it wakes.
5. **Sound only on the display** (`/clock/[id]`), not on the admin control screen, as the design says.
6. **Sound controls:** a speaker button in the display's top-right corner turns sound on and off. The choice is remembered in the browser (localStorage). Browsers still need a tap on each page load, so with sound on, the display shows a "Tap to enable sound" prompt until it's tapped (any tap on the page counts).
7. **TV mode button** next to the speaker: fullscreen, keep awake, and turn sound on, in one tap. Pressing it again (or Esc) leaves fullscreen and releases the wake lock. In TV mode the corner buttons and the cursor hide after 3 seconds without mouse movement or touch, and come back when the mouse moves or the screen is tapped.
8. **Where the browser can't do something, it's skipped quietly:** an iPhone can't make a web page fullscreen, so there TV mode just keeps the screen awake and turns sound on; a browser without Wake Lock just goes fullscreen. No error messages.

## Ground rules

- No database changes in this phase.
- Pure logic in `features/clock/lib/` (no React, no browser APIs), tests next to it. Browser code in `features/clock/hooks/` and `features/clock/sounds/`.
- Pull before starting each session (the other computer may have pushed).

## Facts (checked 2026-11-20)

- The display (`features/clock/components/display/clock-display.tsx`) gets a `ClockView` every 250 ms from `useClock`, with `status`, `position.levelIndex`, `position.remainingMs`, `isBreak` and `isOutOfTime`, and the server-corrected `nowMs`.
- The display's top-left corner holds `ClockBadges` (status, Reconnecting…); the top-right corner is free.
- `useOnVisible` (`features/clock/hooks/use-on-visible.ts`) calls back when the tab becomes visible.
- `public/` has no audio files. lucide-react is installed (`Volume2`, `VolumeX`, `Maximize`, `Minimize`, `Tv` icons).
- Next.js 16 / React 19; the display page is a client component tree under the root layout only (no header or tab bar).

---

### Task 1: When to chime (pure)

**Files:**
- Create: `features/clock/lib/sounds.ts`, `features/clock/lib/sounds.test.ts`

**Contract:**
- `type SoundCue = "warning" | "level" | "break"`.
- `type SoundTick = { status: ClockStatus; levelIndex: number; remainingMs: number; isBreak: boolean; nowMs: number }` and `soundTickOf(view: ClockView, nowMs): SoundTick`.
- `planSoundCue(previous: SoundTick | null, current: SoundTick): SoundCue | null`:
  - null with no previous tick, when either tick isn't running, or when more than `MAX_TICK_GAP_MS` (2,000) passed between them;
  - the level index changed → `"break"` if the new row is a break, else `"level"`;
  - same level, the time left crossed one minute (previous > 60,000, current ≤ 60,000) and isn't 0 → `"warning"`;
  - otherwise null.
- `WARNING_MS = 60_000`.

**Test scenarios** (NLPT Standard fixture):
- Level 1 running, 61.0 s → 60.75 s left → nothing; 60.25 → 59.75 s → `"warning"`; 59.75 → 59.5 → nothing (once only).
- Level 4 ends into the first break (index 3 → 4) → `"break"`; the break ends into level 5 → `"level"`.
- The admin presses Next while running (index 0 → 1, time jumps to 20:00) → `"level"`; Previous → `"level"`.
- Paused → running at the same level (resume) → nothing; running → paused → nothing; setup → running (start) → nothing.
- Next pressed while paused (index changes, both ticks paused) → nothing.
- A 5-second gap between ticks with a level change in between → nothing.
- No previous tick → nothing.
- Warning on a break (61 → 59 s left) → `"warning"`.
- +1 minute pushes 30 s back to 90 s, then it counts down past 60 s again → `"warning"` again.

**Commit:** `feat: decide when the clock display chimes`

### Task 2: The chimes (note lists and a player)

**Files:**
- Create: `features/clock/sounds/chimes.ts` (data), `features/clock/sounds/chimes.test.ts`
- Create: `features/clock/sounds/chime-player.ts` (browser)

**Contract:**
- `type ChimeNote = { frequencyHz: number; startS: number; durationS: number; gain: number }`.
- `CHIMES: Record<SoundCue, ChimeNote[]>`: warning two notes (for example E5 then E5, 0.25 s apart), level three rising notes (C5, E5, G5), break two falling, softer notes (G4, C4). Exact pitches are a judgement call; tune by ear.
- `chimeLengthS(cue): number`.
- `createChimePlayer(): { unlock(): Promise<boolean>; play(cue: SoundCue): void; isUnlocked(): boolean }`. It makes one `AudioContext` lazily; `unlock` resumes it (call from a tap) and reports whether it's running; `play` schedules each note as a sine oscillator with a quick attack and exponential release through a gain node, and does nothing if the context isn't running or Web Audio is missing.

**Tests (data only):** every chime has notes; every note has a positive frequency and duration, gain between 0 and 1, and starts at or after 0; each chime is under 2 seconds long (it mustn't overlap the next tick's chime).

**Commit:** `feat: synthesize the clock chimes`

### Task 3: Sound on the display (hooks)

**Files:**
- Create: `features/clock/hooks/use-sound.ts`
- Create: `features/clock/hooks/use-sound-cues.ts`

**`useSound()`** → `{ isOn; needsTap; turnOn(); turnOff(); unlockFromTap() }`:
- `isOn` is the viewer's choice, remembered in localStorage (`nlpt-clock-sound`), read and written inside try/catch, and off when it can't be read.
- `needsTap` is true while sound is on but the audio context hasn't been unlocked yet (every fresh page load).
- `turnOn()` (from a tap) unlocks and saves on; `turnOff()` saves off.
- `unlockFromTap()` is called from any tap on the page while `needsTap`.

**`useSoundCues(view, nowMs, play)`:** keeps the previous `SoundTick` in a ref and calls `planSoundCue` on every tick; when it returns a cue, calls `play(cue)`. Resets the previous tick when the clock is deleted.

No unit tests for the hooks (thin wiring over tested pieces); checked in Task 6.

**Commit:** `feat: play chimes on the clock display`

### Task 4: TV mode (hook)

**Files:**
- Create: `features/clock/hooks/use-tv-mode.ts`
- Create: `features/clock/hooks/use-idle.ts`

**`useTvMode()`** → `{ isTvMode; enter(); exit() }`:
- `enter()` (from a tap): `document.documentElement.requestFullscreen()` if available (ignore a refusal), then a screen wake lock (`navigator.wakeLock.request("screen")`) if available. `isTvMode` is true from then until `exit()`, Esc or leaving fullscreen.
- Listens to `fullscreenchange`: leaving fullscreen (Esc) ends TV mode and releases the lock.
- The wake lock is released by the browser when the tab is hidden; on `useOnVisible`, take it again while in TV mode.
- `exit()` leaves fullscreen if in it and releases the lock. Cleans up on unmount.

**`useIdle(isActive, delayMs = 3000)`** → `isIdle`: true after `delayMs` without `pointermove`, `pointerdown` or `keydown`; always false while `isActive` is false.

**Commit:** `feat: add a TV mode to the clock display`

### Task 5: Display controls

**Files:**
- Create: `features/clock/components/display/display-controls.tsx`
- Modify: `features/clock/components/display/clock-display.tsx`

**Controls (top-right corner, same scaling as the badges):**
- A speaker button: `Volume2` when on, `VolumeX` when off; labelled "Turn sound off" / "Turn sound on".
- A TV mode button: `Maximize` / `Minimize`; labelled "TV mode" / "Leave TV mode". Entering also turns sound on (`turnOn()` in the same tap).
- While `needsTap`: a small pill "Tap to enable sound" under the buttons; any tap on the page (a `pointerdown` listener on the main element) unlocks and hides it.
- In TV mode, when idle: the corner controls fade out (`opacity-0`, pointer events off) and the cursor hides (`cursor-none` on main). The status badges stay (Paused and Reconnecting… matter on a TV).

`clock-display.tsx` wires `useSound`, `useSoundCues(view, nowMs, player.play)`, `useTvMode` and `useIdle(isTvMode)`.

**Commit:** `feat: sound and TV mode buttons on the clock display`

### Task 6: Click-through on dev

Use Browser 1 (confirm with the user). Audio can't be heard from automation, so the player logs each chime it plays with `console.debug("[clock-sound]", cue)` in development only, and the check reads the console.

- Open a display; the speaker and TV buttons show; sound off by default; no prompt.
- Turn sound on → the prompt doesn't show (the tap unlocked it). Reload → "Tap to enable sound" shows; tap anywhere → it hides.
- On a test template with 2-minute levels and a 2-minute break: start the clock from the control screen. `"warning"` logs once at 1:00 left, then `"level"` when level 2 starts, `"break"` when the break starts, and `"level"` after it. Starting the clock itself logs nothing.
- Next while running → `"level"`; pause, Next, resume → nothing.
- TV mode: fullscreen (check `document.fullscreenElement`), wake lock held (`navigator.wakeLock` sentinel not released), controls and cursor hide after 3 s idle and come back on mouse move; Esc leaves TV mode.
- Switch to another tab and back while in TV mode → the wake lock is taken again.
- Delete the test clock and template afterwards.

Fix anything found; commit each fix separately.

### Task 7: Docs

- Design doc: phase 6 done; the chime rules (when they play, when they don't), the sound and TV controls, what's skipped where unsupported.
- This plan: status and any changes.

**Commit:** `docs: record clock phase 6 decisions`

---

## Refinement pass

### Task R1: Lint and format
Prettier and `npm run lint -- --fix` on the changed files; `npx tsc --noEmit` (ignoring `.next/`); `npm test`.
Commit: `style: lint and format clock phase 6`

### Task R2: Reduce complexity
Watch `use-tv-mode.ts` and `display-controls.tsx`.
Commit: `refactor: reduce complexity in the clock TV mode`

### Task R3: Improve readability
Commit: `refactor: clarify the clock sounds and TV mode`

### Task R4: Make it DRY
Look at the browser-API guards (feature checks for fullscreen, wake lock, Web Audio, localStorage).
Commit: `refactor: share <what> between <where>`

### Task R5: Standards alignment
Explicit return types on exported non-component functions, labels on icon-only buttons, no stray `console.log` (the dev-only `console.debug` stays).
Commit: `refactor: align clock phase 6 with standards`

Skip any refinement task that finds nothing; no empty commits.
