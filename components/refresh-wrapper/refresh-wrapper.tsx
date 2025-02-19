"use client";
import { ArrowDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CgSpinner } from "react-icons/cg";

const MAXIMUM_PULL_LENGTH = 240;
const REFRESH_THRESHOLD = 180;

export default function PageRefresh() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function usePullToRefresh(callback: () => void) {
    useEffect(() => {
      let startY = 0;
      const handleTouchStart = (e: TouchEvent) => {
        startY = e.touches[0].clientY;
      };
      const handleTouchEnd = (e: TouchEvent) => {
        if (e.changedTouches[0].clientY - startY > 50) {
          if (window.screenTop !== 0) {
            return;
          }
          callback();
        }
      };

      document.addEventListener("touchstart", handleTouchStart);
      document.addEventListener("touchend", handleTouchEnd);

      return () => {
        document.removeEventListener("touchstart", handleTouchStart);
        document.removeEventListener("touchend", handleTouchEnd);
      };
    }, [callback]);
  }

  // usePullToRefresh(() => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     router.refresh();
  //     setLoading(false);
  //   }, 500);
  // });

  return (
    <div className="flex items-center justify-center top-0">
      {loading ? <CgSpinner className="animate-spin w-8 h-8 mt-12" /> : null}
    </div>
  );
}
