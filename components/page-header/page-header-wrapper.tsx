"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

function PageHeaderWrapper({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const mainContainer = useRef<HTMLElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollUpDistance, setScrollUpDistance] = useState(0);

  useEffect(() => {
    mainContainer.current = document.getElementById("main-wrapper");
  }, []);

  const handleScroll = () => {
    if (!mainContainer.current) return;
    const currentScrollY = mainContainer.current.scrollTop;
    const scrollDifference = lastScrollY - currentScrollY;

    if (currentScrollY < 10) {
      setIsScrolled(false);
      setScrollUpDistance(0); // Reset the scroll-up distance
      return;
    } else if (currentScrollY > lastScrollY && currentScrollY > 50) {
      // Scrolling down, hide the nav
      setIsScrolled(true);
      setScrollUpDistance(0); // Reset the scroll-up distance
    } else {
      // Scrolling up, track distance
      setScrollUpDistance((prev) => prev + scrollDifference);
      if (scrollUpDistance > 100) {
        setIsScrolled(false); // Show nav only after scrolling up 100px
      }
    }

    setLastScrollY(currentScrollY);
  };

  useEffect(() => {
    if (!mainContainer.current) return;
    mainContainer.current.addEventListener("scroll", handleScroll);

    return () => {
      if (!mainContainer.current) return;
      mainContainer.current.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]); // Depend on lastScrollY to track changes

  return (
    <div
      data-hidden={isScrolled}
      id="page-header-wrapper"
      className={cn(
        "w-full border-b backdrop-blur-md bg-background/40 md:bg-background z-[304958] sticky md:relative top-0 border-neutral-500 mb-4 px-2 pb-4 flex md:hidden items-center transition-all duration-300 justify-between",
        className
      )}
      style={{
        transform: isScrolled ? "translateY(-100%)" : "translateY(0)",
        opacity: isScrolled ? 0.2 : 1,
      }}>
      {children}
    </div>
  );
}

export default PageHeaderWrapper;
