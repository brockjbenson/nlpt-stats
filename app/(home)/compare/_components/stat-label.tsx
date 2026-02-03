import React from "react";

function StatLabel({
  children,
  leaderSide,
}: {
  children: React.ReactNode;
  leaderSide: "left" | "right" | "none";
}) {
  return (
    <p className="w-full py-1 text-center flex items-center justify-center text-sm col-start-2 text-muted">
      {children}
      {leaderSide === "left" ? (
        <span className="absolute left-0 h-4/5 bg-primary rounded-tr-md rounded-br-md w-0.75" />
      ) : leaderSide === "right" ? (
        <span className="absolute right-0 h-4/5 bg-primary rounded-tl-md rounded-bl-md w-0.75" />
      ) : null}
    </p>
  );
}

export default StatLabel;
