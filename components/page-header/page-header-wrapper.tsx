"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function PageHeaderWrapper({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = () => {
    const mainContainer = document.getElementById("main-wrapper");

    if (mainContainer) {
      const currentScrollY = mainContainer.scrollTop;

      // Check if user is scrolling down
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsScrolled(true); // Make nav transparent
      } else {
        setIsScrolled(false); // Make nav opaque
      }

      setLastScrollY(currentScrollY); // Update last scroll position
    }
  };

  useEffect(() => {
    const mainContainer = document.getElementById("main-wrapper");

    if (mainContainer) {
      mainContainer.addEventListener("scroll", handleScroll);
    }

    return () => {
      mainContainer?.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]); // Depend on lastScrollY to track changes

  return (
    <div
      className={cn(
        "w-full border-b backdrop-blur-md bg-background/40 md:bg-background z-[304958] fixed md:relative top-0 border-neutral-500 mb-4 px-2 py-4 flex md:hidden items-center transition-all duration-300 justify-between",
        isScrolled
          ? "max-md:-translate-y-full max-md:opacity-20"
          : "max-md:translate-y-0 max-md:opacity-100"
      )}>
      {children}
    </div>
  );
}

export default PageHeaderWrapper;
