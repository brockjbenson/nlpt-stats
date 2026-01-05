"use client";

import React, { useEffect, useRef } from "react";
import { FaTrophy, FaMoneyBill, FaUsers } from "react-icons/fa";
import { FaRankingStar } from "react-icons/fa6";
import { usePathname } from "next/navigation";
import { TbWorldStar } from "react-icons/tb";
import { cn } from "@/lib/utils";
import BottomTab from "./tab";

function BottomTabs() {
  const pathname = usePathname();
  const [active, setActive] = React.useState<string>("");

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
      if (!mainContainer.current || !navRef.current) return;

      const currentScrollY = mainContainer.current.scrollTop;
      const scrollHeight = mainContainer.current.scrollHeight;
      const clientHeight = mainContainer.current.clientHeight;
      const scrollDifference = currentScrollY - lastScrollY.current;

      // Check if at bottom
      const isAtBottom = currentScrollY + clientHeight >= scrollHeight - 5;

      if (currentScrollY < 10) {
        // At top of page - smoothly show nav
        navRef.current.style.transition = "transform 0.2s ease-out";
        currentTranslateY.current = 0;
      } else if (isAtBottom) {
        // At bottom - smoothly hide nav completely
        navRef.current.style.transition = "transform 0.2s ease-out";
        currentTranslateY.current = navHeight.current;
      } else {
        // Normal scrolling - no transition for immediate response
        navRef.current.style.transition = "transform 0.1s";

        // Calculate new translateY based on scroll difference (2x slower)
        const dampedScroll = scrollDifference / 1.25;
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
        "px-2 pb-2 pt-1 md:hidden block fixed bottom-0 z-10 bg-background/70 backdrop-blur-sm left-0 w-screen border-t border-t-neutral-700"
      )}
      style={{
        willChange: "transform",
      }}>
      <ul className="w-full grid gap-4 grid-cols-5">
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab
            onClick={() => {
              setActive("cash+stats");
            }}
            id="cash+stats"
            active={active}
            href="/stats/cash">
            <FaMoneyBill className="w-5 h-5 mt-1" />
            Cash
          </BottomTab>
        </li>
        <li className="w-full aspect-square h-14 flex justify-center items-center max-w-16 mx-auto">
          <BottomTab
            onClick={() => {
              setActive("tournament+stats");
            }}
            id="tournament+stats"
            active={active}
            href="/tournaments">
            <FaTrophy className="w-5 h-5 mt-1" />
            {"Tourney's"}
          </BottomTab>
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
