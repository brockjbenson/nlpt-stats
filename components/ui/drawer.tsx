"use client";

import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";

import { useKeyboardInset } from "@/hooks/use-keyboard-inset";
import { isKeyboardOpen } from "@/lib/keyboard-inset";
import { cn } from "@/lib/utils";

// Space kept above a sheet when the keyboard squeezes it, so it still reads
// as a sheet over the page.
const KEYBOARD_TOP_GAP = 24;
// Long enough for the keyboard to finish opening when no resize event comes
// (it was already open, or the browser lacks the Visual Viewport API).
const KEYBOARD_SETTLE_MS = 350;

// vaul's own keyboard handling (repositionInputs) misplaces the sheet on iOS,
// which also scrolls the page to show a focused input. DrawerContent handles
// the keyboard instead.
const Drawer = ({
  shouldScaleBackground = true,
  repositionInputs = false,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) => (
  <DrawerPrimitive.Root
    shouldScaleBackground={shouldScaleBackground}
    repositionInputs={repositionInputs}
    {...props}
  />
);
Drawer.displayName = "Drawer";

const DrawerTrigger = DrawerPrimitive.Trigger;

const DrawerPortal = DrawerPrimitive.Portal;

const DrawerClose = DrawerPrimitive.Close;

const DrawerOverlay = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

// Field types that don't bring up the on-screen keyboard.
const NO_KEYBOARD_INPUT_TYPES = new Set([
  "checkbox",
  "radio",
  "range",
  "color",
  "file",
  "button",
  "submit",
  "reset",
  "image",
]);

// Text fields bring up the keyboard; checkboxes, buttons and the like don't.
function opensKeyboard(element: EventTarget): element is HTMLElement {
  if (element instanceof HTMLTextAreaElement) return true;
  if (element instanceof HTMLElement && element.isContentEditable) return true;
  if (!(element instanceof HTMLInputElement)) return false;
  return !NO_KEYBOARD_INPUT_TYPES.has(element.type);
}

// Once the keyboard has opened, scrolls a focused field into the middle of
// the sheet's scroll area (clear of the sticky header).
function scrollFieldIntoView(field: HTMLElement): void {
  const scroll = (): void =>
    field.scrollIntoView({ block: "center", behavior: "smooth" });
  window.visualViewport?.addEventListener("resize", scroll, { once: true });
  window.setTimeout(scroll, KEYBOARD_SETTLE_MS);
}

// While the keyboard is open the sheet sits on top of it and shrinks to the
// space left above it, so the field being typed in stays visible.
function keyboardStyle(
  inset: number,
  visibleHeight: number,
): React.CSSProperties {
  if (!isKeyboardOpen(inset)) {
    return { paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" };
  }
  return {
    bottom: inset,
    maxHeight: visibleHeight - KEYBOARD_TOP_GAP,
    minHeight: 0,
    // The keyboard covers the home indicator, so no safe-area padding.
    paddingBottom: 16,
  };
}

const DrawerContent = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, style, ...props }, ref) => {
  const { inset, visibleHeight } = useKeyboardInset();
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed inset-x-0 bottom-0 max-h-[85%] min-h-[60%] z-50 mt-24 flex h-auto p-4 flex-col rounded-t-[30px] bg-card",
          className,
        )}
        style={{ ...style, ...keyboardStyle(inset, visibleHeight) }}
        {...props}
      >
        <div className="mx-auto mb-4 h-1.25 w-25 shrink-0 rounded-full bg-muted" />
        <div
          id="drawer-scroll-container"
          className="min-h-0 overflow-y-auto"
          onFocus={(event) => {
            if (opensKeyboard(event.target)) scrollFieldIntoView(event.target);
          }}
        >
          {children}
        </div>
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

const DrawerHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "grid sticky top-0 -translate-y-1 bg-card z-10 gap-1.5 p-3 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DrawerHeader.displayName = "DrawerHeader";

const DrawerFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("mt-auto flex flex-col gap-2 p-3", className)}
    {...props}
  />
);
DrawerFooter.displayName = "DrawerFooter";

const DrawerTitle = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-xl font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

const DrawerDescription = React.forwardRef<
  React.ComponentRef<typeof DrawerPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
DrawerDescription.displayName = DrawerPrimitive.Description.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
