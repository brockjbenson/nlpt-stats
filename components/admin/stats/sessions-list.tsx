import { cn } from "@/lib/utils";
import { CashSessionNoId, Member, Season, Week } from "@/utils/types";
import { User2, X } from "lucide-react";
import Image from "next/image";
import React from "react";

interface Props {
  sessionsToAdd: CashSessionNoId[];
  removeSessionFromList: (index: number) => void;
  databaseState: DataBaseState;
}

interface DataBaseState {
  members: Member[];
  seasons: Season[];
  weeks: Week[];
}

function SessionsList({
  sessionsToAdd,
  databaseState,
  removeSessionFromList,
}: Props) {
  const { members, seasons, weeks } = databaseState;
  const getMemberInfo = (id: string) => {
    return members?.find((member) => member.id === id);
  };

  const getSeasonInfo = (id: string) => {
    return seasons?.find((season) => season.id === id);
  };

  const getWeekInfo = (id: string) => {
    return weeks?.find((week) => week.id === id);
  };
  return (
    <div className="mb-8">
      {sessionsToAdd.map((session, index) => {
        const member = getMemberInfo(session.memberId);
        const week = getWeekInfo(session.weekId);
        const season = getSeasonInfo(session.seasonId);
        return (
          <div
            className="grid py-8 border-b first:border-t border-neutral-500 grid-cols-[60px_1fr_min-content] gap-4"
            key={`${session.memberId}_${index}`}>
            {member?.portraitUrl ? (
              <div className="rounded-full overflow-hidden w-full aspect-square flex items-center justify-center">
                <Image
                  src={member.portraitUrl}
                  alt={`${member.firstName}_${member.lastName}`}
                  width={100}
                  height={100}
                />
              </div>
            ) : (
              <div className="rounded-full bg-muted overflow-hidden w-full aspect-square flex items-center justify-center">
                <User2
                  className="fill-muted-foreground relative top-2 w-[175%] h-[175%]"
                  stroke="neutral-500"
                />
              </div>
            )}
            <div className="flex items-center justify-between gap-12">
              <h3 className="w-fit whitespace-nowrap font-bold text-2xl">
                {member?.firstName} {member?.lastName}
              </h3>
              <ul className="flex w-fit justify-start gap-8">
                <li className="flex flex-col gap-2 items-center">
                  <span className="text-neutral-400">Buy-In</span>
                  <span className="font-medium">
                    ${session.buyIn.toFixed(2)}
                  </span>
                </li>
                <li className="flex flex-col gap-2 items-center">
                  <span className="text-neutral-400">Cash Out</span>
                  <span className="font-medium">
                    ${session.cashOut.toFixed(2)}
                  </span>
                </li>
                <li className="flex flex-col gap-2 items-center">
                  <span className="text-neutral-400">Net Profit</span>
                  <span
                    className={cn(
                      "font-medium",
                      session.netProfit > 0 ? "text-green-600" : "text-red-500"
                    )}>
                    ${session.netProfit.toFixed(2)}
                  </span>
                </li>
                <li className="flex flex-col gap-2 items-center">
                  <span className="text-neutral-400">Rebuys</span>
                  <span className="font-medium">{session.rebuys}</span>
                </li>
                <li className="flex flex-col gap-2 items-center">
                  <span className="text-neutral-400">Season</span>
                  <span className="font-medium">{season?.year}</span>
                </li>
                <li className="flex flex-col gap-2 items-center">
                  <span className="text-neutral-400">Week</span>
                  <span className="font-medium">{week?.weekNumber}</span>
                </li>
              </ul>
            </div>
            <button
              className="w-8 h-8 flex self-center items-center justify-center rounded-full border border-transparent hover:border-primary group"
              onClick={() => removeSessionFromList(index)}>
              <X className="w-6 h-6 group-hover:fill-primary" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default SessionsList;
