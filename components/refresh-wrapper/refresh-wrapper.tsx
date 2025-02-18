"use client";
import { useState, useEffect, useRef } from "react";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CgSpinner } from "react-icons/cg";

const REFRESH_THRESHOLD = 200;

const PullToRefresh = () => {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullAmount, setPullAmount] = useState(0);
  const shouldRefresh = useRef(false);
  const touchStartY = useRef<number | null>(null);
  const currentDeltaY = useRef(0);

  const handleTouchStart = (e: TouchEvent) => {
    if (window.scrollY === 0) {
      touchStartY.current = e.touches[0].clientY;
      setIsPulling(false);
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (window.scrollY > 0 || touchStartY.current === null) return;

    const deltaY = e.touches[0].clientY - touchStartY.current;
    currentDeltaY.current = deltaY;

    if (deltaY > 10) {
      setIsPulling(true);
    }

    setPullAmount(deltaY > 0 ? Math.min(deltaY, REFRESH_THRESHOLD) : 0);
    shouldRefresh.current = deltaY > REFRESH_THRESHOLD;
  };

  const handleTouchEnd = () => {
    if (shouldRefresh.current) {
      setIsRefreshing(true);

      setTimeout(() => {
        setIsRefreshing(false);
        shouldRefresh.current = false;
        currentDeltaY.current = 0;
      }, 1300);
    }

    setIsPulling(false);
    setPullAmount(0);
  };

  useEffect(() => {
    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);

  return (
    <div
      className="h-10 w-full z-50 pb-4 pt-16 left-0 top-0 flex items-center justify-center transition-all duration-1000"
      style={{
        opacity: isPulling || isRefreshing ? 1 : 0,
        position: isRefreshing ? "static" : "fixed",
        height: isRefreshing ? "60px" : "0px",
      }}>
      <ArrowDown
        className={cn(
          "transition-transform duration-300",
          isRefreshing ? "hidden" : "block",
          currentDeltaY.current > REFRESH_THRESHOLD ? "rotate-180" : ""
        )}
      />
      <CgSpinner
        className={cn(
          "animate-spin w-8 h-8",
          isRefreshing ? "block" : "hidden"
        )}
      />
    </div>
  );
};

export default PullToRefresh;
