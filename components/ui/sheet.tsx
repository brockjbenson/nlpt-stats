"use client";

import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { CgLoadbar } from "react-icons/cg";

const Sheet = SheetPrimitive.Root;

const SheetTrigger = SheetPrimitive.Trigger;

const SheetClose = SheetPrimitive.Close;

const SheetPortal = SheetPrimitive.Portal;

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Overlay
    className={cn(
      "fixed inset-0 z-[2304598234059] bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
    ref={ref}
  />
));
SheetOverlay.displayName = SheetPrimitive.Overlay.displayName;

const sheetVariants = cva(
  "fixed z-[2304598234058] gap-4 bg-neutral-900 py-6 px-4 pt-16 shadow-lg transition ease-in-out data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-500 data-[state=open]:duration-500",
  {
    variants: {
      side: {
        top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
        bottom:
          "inset-x-0 bottom-0 data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
        left: "inset-y-0 left-0 h-full w-3/4 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left sm:max-w-sm",
        right:
          "inset-y-0 right-0 h-full w-3/4  border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:max-w-sm",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
);

interface SheetContentProps
  extends React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content>,
    VariantProps<typeof sheetVariants> {}

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  SheetContentProps
>(({ side = "right", className, children, ...props }, ref) => {
  const [startX, setStartX] = React.useState<number | null>(null);
  const [startY, setStartY] = React.useState<number | null>(null);
  const [translate, setTranslate] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [startTime, setStartTime] = React.useState<number | null>(null);
  const closeRef = React.useRef<HTMLDivElement>(null);

  const threshold = 100; // Min swipe distance to close
  const maxTranslate = 800; // Max movement distance
  const minCloseDuration = 300; // Minimum close animation duration (fast swipe)
  const maxCloseDuration = 500; // Maximum close animation duration (slow swipe)

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isClosing || !closeRef.current) return;

    if (closeRef.current.contains(e.target as Node)) {
      setStartX(e.touches[0].clientX);
      setStartY(e.touches[0].clientY);
      setStartTime(performance.now()); // Record time when touch starts
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startX === null || startY === null || isClosing) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    let moveAmount = 0;

    if (side === "right") {
      moveAmount = Math.max(-maxTranslate, currentX - startX);
    } else if (side === "left") {
      moveAmount = Math.min(maxTranslate, currentX - startX);
    } else if (side === "bottom") {
      moveAmount = Math.min(maxTranslate, currentY - startY);
      if (moveAmount < 0) moveAmount = 0; // Prevent moving up
    } else if (side === "top") {
      moveAmount = Math.max(-maxTranslate, currentY - startY);
    }

    setTranslate(moveAmount);
  };

  const handleTouchEnd = () => {
    if (startX === null || startY === null || startTime === null) return;

    const endTime = performance.now();
    const timeTaken = endTime - startTime; // Time in milliseconds

    let distance = Math.abs(translate);
    let velocity = distance / timeTaken; // Pixels per millisecond

    // Convert velocity into animation duration (higher velocity = shorter duration)
    let closeDuration = Math.max(
      minCloseDuration,
      Math.min(maxCloseDuration, (1 / velocity) * 150) // Adjust factor for smooth scaling
    );

    if (distance > threshold) {
      setIsClosing(true);

      // Calculate the final close translation
      const closeTranslate =
        side === "right"
          ? -maxTranslate
          : side === "left"
            ? maxTranslate
            : side === "bottom"
              ? maxTranslate
              : -maxTranslate; // for "top"

      setTranslate(closeTranslate);

      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
      setTimeout(() => {
        setTranslate(0); // Reset after close
        setIsClosing(false);
      }, closeDuration);
    } else {
      setTranslate(0);
    }

    setStartX(null);
    setStartY(null);
    setStartTime(null);
    setIsDragging(false);
  };

  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        ref={ref}
        className={cn(sheetVariants({ side }), className)}
        style={{
          transform:
            side === "right" || side === "left"
              ? `translateX(${translate}px)`
              : `translateY(${translate}px)`,
          transition: isDragging
            ? "none"
            : `transform ${isClosing ? "var(--close-duration, 300ms)" : "0.3s"} ease-out`,
          willChange: "transform",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        {...props}>
        <div
          id="sheet-scroll-container"
          className="h-full px-2 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        {/* Drag Handle */}
        <div
          ref={closeRef}
          className="w-full absolute top-0 left-0 py-6 flex items-center justify-center cursor-grab">
          <span className="w-2/5 h-1 bg-muted rounded-full" />
        </div>
      </SheetPrimitive.Content>
    </SheetPortal>
  );
});
SheetContent.displayName = SheetPrimitive.Content.displayName;

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left",
      className
    )}
    {...props}
  />
);
SheetHeader.displayName = "SheetHeader";

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
);
SheetFooter.displayName = "SheetFooter";

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Title>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
SheetTitle.displayName = SheetPrimitive.Title.displayName;

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Description>
>(({ className, ...props }, ref) => (
  <SheetPrimitive.Description
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
SheetDescription.displayName = SheetPrimitive.Description.displayName;

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
