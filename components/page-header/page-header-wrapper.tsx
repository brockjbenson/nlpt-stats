"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

function PageHeaderWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const mainContainer = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const currentTranslateY = useRef(0);
  const headerHeight = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    mainContainer.current = document.getElementById("main-wrapper");

    // Get header height
    if (headerRef.current) {
      headerHeight.current = headerRef.current.offsetHeight;
    }
  }, []);

  useEffect(() => {
    if (!mainContainer.current || !headerRef.current) return;

    const updateHeaderPosition = () => {
      if (!headerRef.current) return;

      headerRef.current.style.transform = `translateY(${currentTranslateY.current}px)`;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!mainContainer.current || !headerRef.current) return;

      const currentScrollY = mainContainer.current.scrollTop;
      const scrollHeight = mainContainer.current.scrollHeight;
      const clientHeight = mainContainer.current.clientHeight;
      const scrollDifference = currentScrollY - lastScrollY.current;

      // Check if at bottom
      const isAtBottom = currentScrollY + clientHeight >= scrollHeight - 5;

      if (currentScrollY < 10) {
        // At top of page - fully show header
        headerRef.current.style.transition = "transform 0.2s ease-out";
        currentTranslateY.current = 0;
      } else if (isAtBottom) {
        // At bottom - smoothly hide header completely
        headerRef.current.style.transition = "transform 0.2s ease-out";
        currentTranslateY.current = -headerHeight.current;
      } else {
        // Normal scrolling - no transition for immediate response
        headerRef.current.style.transition = "transform 0.1s";

        // Calculate new translateY based on scroll difference (2x slower)
        const dampedScroll = scrollDifference / 1.25;
        const newTranslateY = currentTranslateY.current - dampedScroll;

        // Clamp between 0 (fully visible) and -headerHeight (fully hidden)
        currentTranslateY.current = Math.max(
          -headerHeight.current,
          Math.min(0, newTranslateY)
        );
      }

      lastScrollY.current = currentScrollY;

      // Use requestAnimationFrame for smooth updates
      if (!ticking.current) {
        requestAnimationFrame(updateHeaderPosition);
        ticking.current = true;
      }
    };

    mainContainer.current.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      if (mainContainer.current) {
        mainContainer.current.removeEventListener("scroll", handleScroll);
      }
    };
  }, []);

  return (
    <div
      ref={headerRef}
      id="page-header-wrapper"
      className={cn(
        "w-full border-b bg-background z-304958 sticky md:relative top-0 border-neutral-700 mb-4 px-2 pb-4 flex md:hidden items-center justify-between",
        className
      )}
      style={{
        willChange: "transform",
      }}>
      {children}
    </div>
  );
}

export default PageHeaderWrapper;
