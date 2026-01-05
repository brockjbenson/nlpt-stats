"use client";

import React, { useEffect, useRef } from "react";
import { FaTrophy, FaMoneyBill, FaUsers, FaHome } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { TbWorldStar } from "react-icons/tb";
import { FaChartLine } from "react-icons/fa6";
import { cn } from "@/lib/utils";
import BottomTab from "./tab";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

function BottomTabs() {
  const pathname = usePathname();
  const [active, setActive] = React.useState<string>("");
  const [statsTabOpen, setStatsTabOpen] = React.useState<boolean>(false);

  // Scroll-based hiding refs
  const mainContainer = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const currentTranslateY = useRef(0);
  const navHeight = useRef(0);
  const ticking = useRef(false);

  React.useEffect(() => {
    if (pathname.includes("cash")) {
      setActive("cash+stats");
    } else if (pathname.includes("tournament")) {
      setActive("tournament+stats");
    } else if (pathname.includes("members")) {
      setActive("members");
    } else if (pathname.includes("poy")) {
      setActive("poy");
    } else if (pathname.includes("nlpi")) {
      setActive("nlpi");
    } else if (pathname === "/") {
      setActive("home");
    } else if (pathname.includes("stats")) {
      setActive("stats");
    }
  }, [pathname]);

  // Scroll-based hiding logic
  useEffect(() => {
    mainContainer.current = document.getElementById("main-wrapper");

    // Get nav height
    if (navRef.current) {
      navHeight.current = navRef.current.offsetHeight;
    }
  }, []);

  useEffect(() => {
    if (!mainContainer.current || !navRef.current) return;

    const updateNavPosition = () => {
      if (!navRef.current) return;

      navRef.current.style.transform = `translateY(${currentTranslateY.current}px)`;
      ticking.current = false;
    };

    const handleScroll = () => {
      if (!mainContainer.current) return;

      const currentScrollY = mainContainer.current.scrollTop;
      const scrollHeight = mainContainer.current.scrollHeight;
      const clientHeight = mainContainer.current.clientHeight;
      const scrollDifference = currentScrollY - lastScrollY.current;

      // Check if at bottom
      const isAtBottom = currentScrollY + clientHeight >= scrollHeight - 5;

      if (currentScrollY < 10) {
        // At top of page - fully show nav
        currentTranslateY.current = 0;
      } else if (isAtBottom && scrollDifference < 0) {
        // At bottom and trying to scroll up (overscroll) - don't show nav
        currentTranslateY.current = Math.min(
          navHeight.current,
          currentTranslateY.current
        );
      } else {
        // Calculate new translateY based on scroll difference (2x slower)
        const dampedScroll = scrollDifference / 2;
        const newTranslateY = currentTranslateY.current + dampedScroll;

        // Clamp between 0 (fully visible) and navHeight (fully hidden below screen)
        currentTranslateY.current = Math.max(
          0,
          Math.min(navHeight.current, newTranslateY)
        );
      }

      lastScrollY.current = currentScrollY;

      // Use requestAnimationFrame for smooth updates
      if (!ticking.current) {
        requestAnimationFrame(updateNavPosition);
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
      ref={navRef}
      id="mobile-nav"
      className={cn(
        "p-2 md:hidden block fixed bottom-0 z-10 bg-background left-0 w-screen border-t border-t-primary"
      )}
      style={{
        willChange: "transform",
      }}>
      <ul className="w-full grid gap-4 grid-cols-5">
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <DropdownMenu open={statsTabOpen} onOpenChange={setStatsTabOpen}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "flex flex-col items-center justify-between gap-1 h-12 text-xs",
                  statsTabOpen
                    ? "text-primary font-semibold"
                    : active === "cash+stats" || active === "tournament+stats"
                      ? "text-primary font-semibold"
                      : "text-neutral-600 font-medium"
                )}>
                <FaChartLine className="w-5 h-5 mt-[0.1rem]" />
                Stats
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="mb-1" align="start">
              <DropdownMenuGroup>
                <BottomTab
                  onClick={() => {
                    setActive("cash+stats");
                    setStatsTabOpen(false);
                  }}
                  id="cash+stats"
                  active={active}
                  className="flex-row justify-start gap-2 h-fit p-2"
                  href="/stats/cash?year=2025">
                  <FaMoneyBill className="w-5 h-5 " />
                  Cash
                </BottomTab>

                <BottomTab
                  onClick={() => {
                    setActive("tournament+stats");
                    setStatsTabOpen(false);
                  }}
                  id="tournament+stats"
                  active={active}
                  className="flex-row justify-start gap-2 h-fit p-2"
                  href="/stats/tournaments">
                  <FaTrophy className="w-5 h-5 " />
                  {"Tourney's"}
                </BottomTab>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab
            onClick={() => {
              setActive("members");
            }}
            id="members"
            active={active}
            href="/members">
            <FaUsers className="w-6 h-6" />
            Members
          </BottomTab>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab
            onClick={() => {
              setActive("home");
            }}
            id="home"
            active={active}
            href="/">
            <FaHome className="w-6 h-6" />
            Home
          </BottomTab>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab
            onClick={() => {
              setActive("poy");
            }}
            id="poy"
            active={active}
            href="/poy">
            <FaRankingStar className="w-6 h-6" />
            POY
          </BottomTab>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab
            onClick={() => {
              setActive("nlpi");
            }}
            id="nlpi"
            active={active}
            href="/nlpi">
            <TbWorldStar className="w-5 h-5 mt-[0.1rem]" />
            NLPI
          </BottomTab>
        </li>
      </ul>
    </div>
  );
}

export default BottomTabs;
