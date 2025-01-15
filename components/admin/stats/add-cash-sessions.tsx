"use client";

import { cn } from "@/lib/utils";
import { CashSessionNoId, Member, Season, Week } from "@/utils/types";
import { User2, X } from "lucide-react";
import Image from "next/image";
import React, { useEffect } from "react";
import AddSessionForm from "./add-session-form";

interface Props {
  members: Member[] | null;
  seasons: Season[] | null;
  weeks: Week[] | null;
}

function AddCashSessions({ members, seasons, weeks }: Props) {
  const [sessionsToAdd, setSessionsToAdd] = React.useState<CashSessionNoId[]>(
    () => {
      // Retrieve and parse data from localStorage on initial load
      const savedSessions = localStorage.getItem("sessionsToAdd");
      return savedSessions ? JSON.parse(savedSessions) : [];
    }
  );
  const [buyIn, setBuyIn] = React.useState<number>(0);
  const [cashOut, setCashOut] = React.useState<number>(0);
  const [netProfit, setNetProfit] = React.useState<number>(0);
  const [rebuys, setRebuys] = React.useState<number>(0);
  const [weekId, setWeekId] = React.useState<string>("");
  const [memberId, setMemberId] = React.useState<string>("");
  const [seasonId, setSeasonId] = React.useState<string>("");

  useEffect(() => {
    if (buyIn !== 0 && cashOut) {
      calculateNetProfit();
    }
  }, [buyIn, cashOut]);

  React.useEffect(() => {
    localStorage.setItem("sessionsToAdd", JSON.stringify(sessionsToAdd));
  }, [sessionsToAdd]);

  const calculateNetProfit = () => {
    const calculatedNetProfit = parseFloat((cashOut - buyIn).toFixed(2));

    setNetProfit(calculatedNetProfit);
  };

  const getMemberInfo = (id: string) => {
    return members?.find((member) => member.id === id);
  };

  const getSeasonInfo = (id: string) => {
    return seasons?.find((season) => season.id === id);
  };

  const getWeekInfo = (id: string) => {
    return weeks?.find((week) => week.id === id);
  };

  const addSessionToList = () => {
    if (!memberId || !seasonId || !buyIn || !rebuys) {
      return;
    }
    const newSession: CashSessionNoId = {
      buyIn,
      cashOut,
      netProfit,
      rebuys,
      weekId,
      memberId,
      seasonId,
    };

    setSessionsToAdd([...sessionsToAdd, newSession]);
    setMemberId("");
    setBuyIn(0);
    setCashOut(0);
    setNetProfit(0);
    setRebuys(0);
  };

  const removeSessionFromList = (index: number) => {
    const updatedSessions = sessionsToAdd.filter((_, i) => i !== index);
    setSessionsToAdd(updatedSessions);
  };

  return (
    <div className="w-full mt-8 max-w-screen-lg mx-auto">
      {sessionsToAdd.length > 0 && (
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
                          session.netProfit > 0
                            ? "text-green-600"
                            : "text-red-500"
                        )}>
                        ${session.netProfit.toFixed(2)}
                      </span>
                    </li>
                    <li className="flex flex-col gap-2 items-center">
                      <span className="text-neutral-400">Rebuys</span>
                      <span className="font-medium">{session.rebuys}</span>
                    </li>
                    <li className="flex flex-col gap-2 items-center">
                      <span className="text-neutral-400">Week</span>
                      <span className="font-medium">{week?.weekNumber}</span>
                    </li>
                    <li className="flex flex-col gap-2 items-center">
                      <span className="text-neutral-400">Season</span>
                      <span className="font-medium">{season?.year}</span>
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
      )}

      <AddSessionForm
        members={members}
        seasons={seasons}
        weeks={weeks}
        addSessionToList={addSessionToList}
        buyIn={buyIn}
        cashOut={cashOut}
        netProfit={netProfit}
        rebuys={rebuys}
        setBuyIn={setBuyIn}
        setCashOut={setCashOut}
        setNetProfit={setNetProfit}
        setRebuys={setRebuys}
        setMemberId={setMemberId}
        setWeekId={setWeekId}
        setSeasonId={setSeasonId}
        weekId={weekId}
        seasonId={seasonId}
      />
    </div>
  );
}

export default AddCashSessions;
