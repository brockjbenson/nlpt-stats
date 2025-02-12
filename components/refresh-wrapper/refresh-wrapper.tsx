"use client";
import { ReactNode, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown } from "lucide-react";

const PullToRefresh = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const [pulling, setPulling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pullHeight, setPullHeight] = useState(0);
  const [loadingHeight, setLoadingHeight] = useState(0); // Smooth height expansion
  const startY = useRef(0);
  const threshold = 50;
  const maxHeight = 60; // Max pull height
  const fixedHeight = 50; // Final height during refresh
  const isAtTop = useRef(false);
  const mainWrapperRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    mainWrapperRef.current = document.getElementById("main-wrapper");
  }, []);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (mainWrapperRef.current && mainWrapperRef.current.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
      isAtTop.current = true; // Allow pull-to-refresh only if at the top
    } else {
      isAtTop.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isAtTop.current || loading) return;

    const touchY = e.touches[0].clientY;
    const pullDistance = touchY - startY.current;

    if (pullDistance > 0) {
      e.preventDefault();
      setPulling(true);
      setPullHeight(Math.min(pullDistance, maxHeight)); // Limit pull height
    }
  };

  const handleTouchEnd = () => {
    if (pullHeight > threshold) {
      setLoading(true);
      setPullHeight(fixedHeight); // Keep indicator at fixed height while loading

      // Smoothly expand height over 300ms to prevent jumpiness
      let currentHeight = 0;
      const expandInterval = setInterval(() => {
        currentHeight += maxHeight;
        if (currentHeight >= fixedHeight) {
          clearInterval(expandInterval);
          setLoadingHeight(fixedHeight);
        } else {
          setLoadingHeight(currentHeight);
        }
      }, 1); // Increases height every 50ms

      router.refresh();
      setTimeout(() => {
        setLoading(false);
        setPullHeight(0);
        setPulling(false);
        setLoadingHeight(0); // Reset height smoothly
      }, 1000);
    } else {
      setPullHeight(0);
      setPulling(false);
    }
  };

  // Smoothly increase opacity from 0 to 1 based on pullHeight
  const arrowOpacity = Math.min(pullHeight / maxHeight, 1);

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative overflow-hidden">
      {/* Pull-to-refresh container (smooth height expansion) */}
      <div
        className="flex fixed w-full left-0 top-[65px] items-center justify-center transition-all duration-75"
        style={{
          height: loading ? maxHeight : pullHeight, // Expands smoothly when loading starts
        }}>
        {loading ? (
          <div className="spinner" />
        ) : pulling ? (
          <ArrowDown
            size={24}
            className="arrow-down"
            style={{ opacity: arrowOpacity }}
          />
        ) : null}
      </div>

      {/* This keeps content pushed down while loading */}
      {loading && (
        <div
          className="transition-all duration-200"
          style={{
            height: loadingHeight, // Expands smoothly
          }}
        />
      )}

      {children}

      {/* Spinner Styles */}
      <style jsx>{`
        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #ddd;
          border-top: 3px solid #333;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default PullToRefresh;
