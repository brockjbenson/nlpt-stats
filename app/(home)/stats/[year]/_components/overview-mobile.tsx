"use client";

import { CashSession, Member, Week } from "@/utils/types";
import useEmblaCarousel from "embla-carousel-react";
import React, { useCallback, useEffect, useState } from "react";
import { EmblaOptionsType } from "embla-carousel";
import { Card, CardTitle } from "@/components/ui/card";
import {
  formatMoney,
  getCumulativeCashStats,
  getLargestWins,
  getNetProfitLeaders,
  getPOYPointsLeaders,
  getProfitTextColor,
} from "@/utils/utils";
import MemberImage from "@/components/members/member-image";
import { cn } from "@/lib/utils";
import OverviewThumbs from "./overview-thumbs";

interface ExtendedCashSessions extends CashSession {
  member: Member;
  week: Week;
  session: CashSession;
}

interface Props {
  members: Member[];
  memberIds: string[];
  sessions: ExtendedCashSessions[];
}
const OPTIONS: EmblaOptionsType = {};

function OverviewMobile({ members, memberIds, sessions }: Props) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaMainRef, emblaMainApi] = useEmblaCarousel(OPTIONS);
  const [emblaThumbsRef, emblaThumbsApi] = useEmblaCarousel({
    containScroll: "keepSnaps",
    dragFree: true,
  });

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaMainApi || !emblaThumbsApi) return;
      emblaMainApi.scrollTo(index);
    },
    [emblaMainApi, emblaThumbsApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaMainApi || !emblaThumbsApi) return;
    setSelectedIndex(emblaMainApi.selectedScrollSnap());
    emblaThumbsApi.scrollTo(emblaMainApi.selectedScrollSnap());
  }, [emblaMainApi, emblaThumbsApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaMainApi) return;
    onSelect();

    emblaMainApi.on("select", onSelect).on("reInit", onSelect);
  }, [emblaMainApi, onSelect]);

  const sessionSortedByWeek = sessions.sort(
    (a, b) => a.week.week_number - b.week.week_number
  );

  const rankedPOYMembers = getPOYPointsLeaders(
    sessionSortedByWeek,
    memberIds,
    members
  );
  const rankedNetProfitLeaders = getNetProfitLeaders(
    sessions,
    memberIds,
    members
  );
  const largestWinsLeaders = getLargestWins(sessionSortedByWeek, members);

  const cumulativeCashStats = getCumulativeCashStats(
    sessionSortedByWeek,
    memberIds,
    members
  );
  return (
    <div className="w-full pb-4 mx-auto md:hidden block">
      <div className="mb-4 border-b pt-3.5 pb-4 border-neutral-500">
        <div className="px-2 overflow-hidden" ref={emblaThumbsRef}>
          <div className="flex flex-row -ml-4">
            <OverviewThumbs
              selectedIndex={selectedIndex}
              onClick={onThumbClick}
            />
          </div>
        </div>
      </div>
      <div className="px-2 overflow-hidden" ref={emblaMainRef}>
        <div className="flex touch-pan-y -ml-4">
          <div
            style={{
              transform: "translate3D(0, 0, 0)",
            }}
            className="flex-[0_0_100%] min-w-0 pl-4">
            <Card>
              <CardTitle>POY Points</CardTitle>
              <div className="flex flex-col gap-4">
                {[...rankedPOYMembers].slice(0, 3).map((member, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={member.id + member.totalPOYPoints + index + "poy"}>
                    <div className="flex items-center gap-4">
                      <MemberImage
                        className="w-10 h-10"
                        src={member.image}
                        alt={member.name}
                      />
                      <h3 className="text-base md:text-xl font-medium">
                        {member.name}
                      </h3>
                    </div>

                    <p className="font-semibold text-lg md:text-xl">
                      {member.totalPOYPoints}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div
            style={{
              transform: "translate3D(0, 0, 0)",
            }}
            className="flex-[0_0_100%] min-w-0 pl-4">
            <Card
              style={{
                transform: "translate3D(0, 0, 0)",
              }}>
              <CardTitle>Wins</CardTitle>
              <div className="flex flex-col gap-4">
                {[...cumulativeCashStats]
                  .sort((a, b) => b.wins - a.wins)
                  .slice(0, 3)
                  .map((data, index) => (
                    <div
                      className="flex items-center justify-between"
                      key={data.wins + data.member.id + index + "wins"}>
                      <div className="flex items-center gap-4">
                        <MemberImage
                          className="w-10 h-10"
                          src={data.member.portrait_url}
                          alt={data.member.first_name}
                        />
                        <h3 className="text-base md:text-xl font-medium">
                          {data.member.first_name} {data.member.last_name}
                        </h3>
                      </div>

                      <p className="font-semibold text-lg md:text-xl">
                        {data.wins}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
          <div
            style={{
              transform: "translate3D(0, 0, 0)",
            }}
            className="flex-[0_0_100%] min-w-0 pl-4">
            <Card
              style={{
                transform: "translate3D(0, 0, 0)",
              }}>
              <CardTitle>Net Profit</CardTitle>
              <div className="flex flex-col gap-4">
                {[...rankedNetProfitLeaders]
                  .slice(0, 3)
                  .map((member, index) => (
                    <div
                      className="flex items-center justify-between"
                      key={member.id + member.totalNetProfit + index + "net"}>
                      <div className="flex items-center gap-4">
                        <MemberImage
                          className="w-10 h-10"
                          src={member.image}
                          alt={member.name}
                        />
                        <h3 className="text-base md:text-xl font-medium">
                          {member.name}
                        </h3>
                      </div>

                      <p
                        className={cn(
                          getProfitTextColor(member.totalNetProfit),
                          "font-semibold text-lg md:text-xl"
                        )}>
                        {formatMoney(member.totalNetProfit)}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          </div>

          <div
            style={{
              transform: "translate3D(0, 0, 0)",
            }}
            className="flex-[0_0_100%] min-w-0 pl-4">
            <Card
              style={{
                transform: "translate3D(0, 0, 0)",
              }}>
              <CardTitle>Gross Profit</CardTitle>
              <div className="flex flex-col gap-4">
                {[...cumulativeCashStats]
                  .sort((a, b) => b.grossProfit - a.grossProfit)
                  .slice(0, 3)
                  .map((data, index) => (
                    <div
                      className="flex items-center justify-between"
                      key={data.grossProfit + data.member.id + index + "gross"}>
                      <div className="flex items-center gap-4">
                        <MemberImage
                          className="w-10 h-10"
                          src={data.member.portrait_url}
                          alt={data.member.first_name}
                        />
                        <h3 className="text-base md:text-xl font-medium">
                          {data.member.first_name} {data.member.last_name}
                        </h3>
                      </div>

                      <p
                        className={cn(
                          "font-semibold text-lg md:text-xl",
                          getProfitTextColor(data.grossProfit)
                        )}>
                        {formatMoney(data.grossProfit)}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
          <div
            style={{
              transform: "translate3D(0, 0, 0)",
            }}
            className="flex-[0_0_100%] min-w-0 pl-4">
            <Card
              style={{
                transform: "translate3D(0, 0, 0)",
              }}>
              <CardTitle>Win Percentage</CardTitle>
              <div className="flex flex-col gap-4">
                {[...cumulativeCashStats]
                  .sort((a, b) => b.winPercentage - a.winPercentage)
                  .slice(0, 3)
                  .map((data, index) => (
                    <div
                      className="flex items-center justify-between"
                      key={
                        data.winPercentage + data.member.id + index + "win%"
                      }>
                      <div className="flex items-center gap-4">
                        <MemberImage
                          className="w-10 h-10"
                          src={data.member.portrait_url}
                          alt={data.member.first_name}
                        />
                        <h3 className="text-base md:text-xl font-medium">
                          {data.member.first_name} {data.member.last_name}
                        </h3>
                      </div>

                      <p className={cn("font-semibold text-lg md:text-xl")}>
                        {data.winPercentage.toFixed(2)}%
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
          <div
            style={{
              transform: "translate3D(0, 0, 0)",
            }}
            className="flex-[0_0_100%] min-w-0 pl-4">
            <Card
              style={{
                transform: "translate3D(0, 0, 0)",
              }}>
              <CardTitle>Session Avg</CardTitle>
              <div className="flex flex-col gap-4">
                {[...cumulativeCashStats]
                  .sort((a, b) => {
                    const ratioA = a.sessionsPlayed
                      ? a.netProfit / a.sessionsPlayed
                      : -Infinity;
                    const ratioB = b.sessionsPlayed
                      ? b.netProfit / b.sessionsPlayed
                      : -Infinity;

                    return ratioB - ratioA;
                  })
                  .slice(0, 3)
                  .map((data, index) => (
                    <div
                      className="flex items-center justify-between"
                      key={
                        data.netProfit / data.sessionsPlayed +
                        data.member.id +
                        index +
                        "avg_win"
                      }>
                      <div className="flex items-center gap-4">
                        <MemberImage
                          className="w-10 h-10"
                          src={data.member.portrait_url}
                          alt={data.member.first_name}
                        />
                        <h3 className="text-base md:text-xl font-medium">
                          {data.member.first_name} {data.member.last_name}
                        </h3>
                      </div>

                      <p
                        className={cn(
                          "font-semibold text-lg md:text-xl",
                          getProfitTextColor(
                            data.netProfit / data.sessionsPlayed
                          )
                        )}>
                        {formatMoney(data.netProfit / data.sessionsPlayed)}
                      </p>
                    </div>
                  ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OverviewMobile;
