"use client";

import { useSyncExternalStore } from "react";

// State shared between the tab bar and a page's bottom accessory:
//   - minimized:   the tab bar has collapsed to its small capsule
//   - accessories: how many <BottomTabAccessory>s are mounted
//   - slot:        the element (owned by the tab bar) accessories render into
//   - accessoryClassName: extra classes for that element (e.g. border color)
type BottomTabsState = {
  minimized: boolean;
  accessories: number;
  slot: HTMLElement | null;
  accessoryClassName: string;
};

const SERVER_STATE: BottomTabsState = {
  minimized: false,
  accessories: 0,
  slot: null,
  accessoryClassName: "",
};

let state: BottomTabsState = SERVER_STATE;
const listeners = new Set<() => void>();

export function setBottomTabsState(patch: Partial<BottomTabsState>) {
  const next = { ...state, ...patch };
  if (
    next.minimized === state.minimized &&
    next.accessories === state.accessories &&
    next.slot === state.slot &&
    next.accessoryClassName === state.accessoryClassName
  ) {
    return;
  }
  state = next;
  listeners.forEach((listener) => listener());
}

export function addAccessory() {
  setBottomTabsState({ accessories: state.accessories + 1 });
}

export function removeAccessory() {
  setBottomTabsState({ accessories: Math.max(0, state.accessories - 1) });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Select one value; components re-render only when it changes.
export function useBottomTabsState<T>(select: (s: BottomTabsState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => select(state),
    () => select(SERVER_STATE),
  );
}
