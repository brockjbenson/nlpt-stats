"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import {
  addAccessory,
  removeAccessory,
  setBottomTabsState,
  useBottomTabsState,
} from "./store";

// "expanded": its own capsule above the full tab bar.
// "inline":   beside the small capsule while the tab bar is minimized.
export type AccessoryPlacement = "expanded" | "inline";

// A page's bottom tab accessory, like iOS 26's tabViewBottomAccessory: a
// slim capsule (styled like the tab bar) that floats above it, and slides down
// beside the small capsule when the tab bar minimizes on scroll. On desktop
// (no tab bar) it floats at the bottom of the screen on its own.
//
// Pass a function to adapt the content to where it's shown:
//   <BottomTabAccessory>
//     {(placement) => placement === "inline" ? <Short /> : <Full />}
//   </BottomTabAccessory>
//
// The content is portaled into the tab bar but stays in the page's React
// tree, so it keeps the page's state, context and handlers.
//
// `className` styles the capsule itself (merged over the tab bar's surface),
// e.g. "border-primary" to match a full-size button inside it.
export function BottomTabAccessory({
  children,
  className = "",
}: {
  children:
    | React.ReactNode
    | ((placement: AccessoryPlacement) => React.ReactNode);
  className?: string;
}) {
  const slot = useBottomTabsState((s) => s.slot);
  const minimized = useBottomTabsState((s) => s.minimized);

  useEffect(() => {
    addAccessory();
    return removeAccessory;
  }, []);

  useEffect(() => {
    setBottomTabsState({ accessoryClassName: className });
    return () => setBottomTabsState({ accessoryClassName: "" });
  }, [className]);

  if (!slot) return null;
  const placement: AccessoryPlacement = minimized ? "inline" : "expanded";
  return createPortal(
    // Re-keyed per placement so the content fades in as it changes shape.
    <div
      key={placement}
      className="animate-in fade-in flex size-full items-center duration-300"
    >
      {typeof children === "function" ? children(placement) : children}
    </div>,
    slot,
  );
}
