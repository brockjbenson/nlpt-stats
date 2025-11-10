import { cn } from "@/lib/utils";
import { Member } from "@/utils/types";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { X } from "lucide-react";
import React from "react";

interface SessionNoPointsOrId {
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  tournament_id: string;
  member_id: string;
  place: number;
}

interface Props {
  sessions: SessionNoPointsOrId[];
  members: Member[];
  setSessions: React.Dispatch<React.SetStateAction<SessionNoPointsOrId[]>>;
}

function TournamentSessionsList({ sessions, members, setSessions }: Props) {
  if (sessions.length > 0) {
    return (
      <div className="flex px-2 py-4 flex-col">
        {sessions.map((session) => {
          const member = members.find((m) => m.id === session.member_id);
          return (
            <div
              key={session.member_id}
              className="flex flex-col border-b py-2 md:py-6 border-neutral-600 first:border-t items-center gap-4 w-full relative">
              <p className="text-lg md:text-2xl font-semibold">
                {member?.first_name} {member?.last_name}
              </p>
              <div className="flex justify-between gap-4 w-full">
                <span className="flex items-center gap-2 justify-center flex-col">
                  <p className="text-xs md:text-sm text-muted">Buy-In</p>
                  <p className="text-base md:text-lg font-medium">
                    {session.buy_in}
                  </p>
                </span>
                <span className="flex items-center gap-2 justify-center flex-col">
                  <p className="text-xs md:text-sm text-muted">Cash Out</p>
                  <p className="text-base md:text-lg font-medium">
                    {session.cash_out}
                  </p>
                </span>
                <span className="flex items-center gap-2 justify-center flex-col">
                  <p className="text-xs md:text-sm text-muted">Net Profit</p>
                  <p
                    className={cn(
                      "text-base md:text-lg font-medium",
                      getProfitTextColor(session.net_profit)
                    )}>
                    {formatMoney(session.net_profit)}
                  </p>
                </span>
                <span className="flex items-center gap-2 justify-center flex-col">
                  <p className="text-xs md:text-sm text-muted">Rebuys</p>
                  <p className="text-base md:text-lg font-medium">
                    {session.rebuys}
                  </p>
                </span>
                <span className="flex items-center gap-2 justify-center flex-col">
                  <p className="text-xs md:text-sm text-muted">Place</p>
                  <p className="text-base md:text-lg font-medium">
                    {session.place}
                  </p>
                </span>
              </div>
              <button
                onClick={() => {
                  setSessions(
                    sessions.filter((s) => s.member_id !== session.member_id)
                  );
                }}
                className="absolute top-2 right-2 md:top-4 md:right-4">
                <X size={24} />
              </button>
            </div>
          );
        })}
      </div>
    );
  }
}

export default TournamentSessionsList;
