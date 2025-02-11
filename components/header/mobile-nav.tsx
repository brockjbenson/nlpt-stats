"use client";

import React, { useEffect, useState } from "react";
import { Home } from "lucide-react";
import Link from "next/link";
import { FaUsers, FaTrophy } from "react-icons/fa";
import { FaRankingStar, FaMedal } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { GoGraph } from "react-icons/go";
import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  excludeAdmin?: boolean;
}

function MobileNav({ excludeAdmin, className }: Props) {
  const currentRoute = usePathname();
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

  console.log(currentRoute);

  return (
    <div
      onClick={() => {
        setIsScrolled(false);
      }}
      ref={containerRef}
      className={cn(
        "px-2 md:hidden block pt-2 z-[2340573245] transition-all duration-300 pb-8 fixed bottom-0 bg-background/70 backdrop-blur-md left-0 w-screen border-t border-t-primary",
        isScrolled ? "opacity-20 translate-y-full" : "opacity-100 translate-y-0"
      )}>
      <ul className="w-full grid gap-4 grid-cols-5">
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/stats/2025">
            <GoGraph className="w-6 h-6" />
            Stats
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/members">
            <FaUsers className="w-6 h-6" />
            Members
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex bg-primary p-4 rounded-full flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/">
            <Home className="w-6 h-6" />
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/poy">
            <FaTrophy className="w-6 h-6" />
            POY
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            className="flex flex-col items-center justify-center gap-1 text-sm font-semibold"
            href="/nlpi">
            <FaRankingStar className="w-6 h-6" />
            NLPI
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default MobileNav;
