import { useScrollState } from "@/app/providers/scroll-context";
import { CashSession } from "@/utils/types";
import React from "react";
import { createPortal } from "react-dom";

export default function FloatingAddButton({
  sessions,
  onClick,
}: {
  sessions: Omit<CashSession, "id">[];
  onClick: () => void;
}) {
  const [mounted, setMounted] = React.useState(false);
  const { navTranslateY, navHeight } = useScrollState();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") return null;

  return (
    <>
      {document.body &&
        createPortal(
          <div
            className="bg-background/80 border-t flex items-center justify-center border-t-muted backdrop-blur-md fixed bottom-0 left-0 right-0 w-full px-4 pt-4 z-9"
            style={{
              paddingBottom: `calc(${navHeight}px + 1rem)`,
              transform: `translateY(max(0px, calc(${navTranslateY}px - env(safe-area-inset-bottom))))`,

              willChange: "transform",
            }}>
            <button
              onClick={onClick}
              className="flex w-full max-w-(--breakpoint-lg) text-sm md:text-base items-center justify-center px-3 h-10 text-white bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors">
              Add Sessions ({sessions.length})
            </button>
          </div>,
          document.body
        )}
    </>
  );
}
