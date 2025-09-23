import { Card } from "@/components/ui/card";
import { CashSession, Member, Season, Week } from "@/utils/types";
import { PlusCircle } from "lucide-react";
import React from "react";

interface ExtendedCashSession extends CashSession {
  member: Member;
  season: Season;
  week: Week;
}

interface Props {
  session: ExtendedCashSession;
  setEditingSessions: React.Dispatch<
    React.SetStateAction<ExtendedCashSession[]>
  >;
}

function EmptySession({ session, setEditingSessions }: Props) {
  return (
    <li className="grid grid-cols-[min-content_1fr] pb-4 gap-6">
      <Card className="p-0 w-full h-16 col-span-2">
        <button
          onClick={(e) => {
            e.preventDefault();
            setEditingSessions((prev) =>
              prev.map((s) =>
                s.id === session.id
                  ? {
                      ...s,
                      buy_in: 25,
                      cash_out: 0,
                      rebuys: 1,
                      net_profit: 0,
                    }
                  : s
              )
            );
          }}
          className="w-full h-full px-4 aspect-square flex items-center justify-between">
          <h2 className="text-sm md:text-base whitespace-nowrap">
            {session.member.first_name} {session.member.last_name.slice(0, 1)}.
          </h2>

          <PlusCircle className="text-primary pointer-events-none w-6 h-6 hover:text-primary-hover" />
        </button>
      </Card>
    </li>
  );
}

export default EmptySession;
