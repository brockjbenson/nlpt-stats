"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { FaTrophy, FaMoneyBill, FaChartArea } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { TbWorldStar } from "react-icons/tb";
import { GoHomeFill } from "react-icons/go";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
  excludeAdmin?: boolean;
}

function MobileNav({ excludeAdmin, className }: Props) {
  const pathname = usePathname();
  const [clicked, setClicked] = useState("");

  const containerRef = React.useRef<HTMLDivElement>(null);

  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollUpDistance, setScrollUpDistance] = useState(0);

  const handleScroll = () => {
    const currentScrollY = window.scrollY;
    const scrollDifference = lastScrollY - currentScrollY;

    if (currentScrollY > lastScrollY && currentScrollY > 50) {
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
    window.addEventListener("scroll", handleScroll);

    return () => {
      window?.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]); // Depend on lastScrollY to track changes

  return (
    <div
      onClick={() => {
        setIsScrolled(false);
      }}
      id="mobile-nav"
      ref={containerRef}
      className={cn(
        "px-2 md:hidden block pt-2 z-[2340573245] transition-all duration-300 fixed bottom-0 bg-background/70 backdrop-blur-md left-0 w-screen border-t border-t-primary",
        isScrolled ? "opacity-20 translate-y-full" : "opacity-100 translate-y-0"
      )}>
      <ul className="w-full grid gap-4 grid-cols-5">
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setClicked("cash");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              (pathname.includes("cash") || clicked === "cash") &&
                "text-primary"
            )}
            href="/stats/cash?year=2025">
            <FaMoneyBill className="w-6 h-6" />
            Cash
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setClicked("tournament");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              (pathname.includes("tournament") || clicked === "tournament") &&
                "text-primary"
            )}
            href="/stats/tournaments">
            <FaTrophy className="w-6 h-6" />
            Tourney's
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setClicked("career");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              (pathname.includes("career") || clicked === "career") &&
                "text-primary"
            )}
            href="/stats/career">
            <FaChartArea className="w-6 h-6" />
            Career
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setClicked("poy");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              (pathname.includes("poy") || clicked === "poy") && "text-primary"
            )}
            href="/poy">
            <FaRankingStar className="w-6 h-6" />
            POY
          </Link>
        </li>
        <li className="w-full aspect-square h-auto flex justify-center items-center max-w-16 mx-auto">
          <Link
            onClick={() => {
              setClicked("nlpi");
            }}
            className={cn(
              "flex flex-col items-center justify-center gap-1 text-sm font-semibold",
              (pathname.includes("nlpi") || clicked === "nlpi") &&
                "text-primary"
            )}
            href="/nlpi">
            <TbWorldStar className="w-6 h-6" />
            NLPI
          </Link>
        </li>
      </ul>
    </div>
  );
}

export default MobileNav;
