"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { MdRefresh } from "react-icons/md";
import { CgSpinner } from "react-icons/cg";

function PageHeaderWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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
    setTimeout(() => {
      document
        .getElementById("page-header-wrapper")
        ?.classList.remove("animate-in");
    }, 500);
  });

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window?.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY]); // Depend on lastScrollY to track changes

  return (
    <div
      id="page-header-wrapper"
      className={cn(
        "w-full border-b animate-in backdrop-blur-md bg-background/40 md:bg-background z-[304958] sticky md:relative top-0 border-neutral-500 mb-4 px-2 pb-4 flex md:hidden items-center transition-all duration-300 justify-between"
      )}
      style={{
        transform: isScrolled ? "translateY(-100%)" : "translateY(0)",
        opacity: isScrolled ? 0.2 : 1,
      }}>
      {children}
      <button
        onClick={() => {
          setLoading(true);
          window.location.reload();
        }}
        className="absolute right-12">
        {loading ? (
          <CgSpinner className="animate-spin w-8 h-8" />
        ) : (
          <MdRefresh className="w-8 h-8" />
        )}
      </button>
    </div>
  );
}

export default PageHeaderWrapper;
