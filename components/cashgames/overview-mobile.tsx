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
import {
  Sheet,
  SheetContent,
  SheetOverlay,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

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
      <div className="mb-4 border-b pb-4 border-neutral-500">
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
              <Sheet>
                <SheetTrigger className="absolute underline top-2 mt-2 right-4 text-muted text-sm">
                  Full List
                </SheetTrigger>
                <SheetContent className="h-4/5 rounded-t-[20px]" side="bottom">
                  <SheetTitle className="w-full sticky top-0 bg-neutral-900 text-center text-2xl mb-2 font-bold">
                    POY Points
                  </SheetTitle>
                  <div className="grid mt-4 w-full grid-cols-3">
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Name
                    </span>
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Total
                    </span>
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Points Behind
                    </span>
                    {[...rankedPOYMembers].map((member) => {
                      const leaderPoints = rankedPOYMembers[0].totalPOYPoints;
                      return (
                        <React.Fragment key={member.id + member.totalPOYPoints}>
                          <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                            {member.name}
                          </h3>
                          <p className="font-semibold text-base md:text-lg py-2 border-b border-neutral-600 w-full">
                            {member.totalPOYPoints.toFixed(2)}
                          </p>
                          <p className="font-semibold text-base md:text-lg py-2 border-b border-neutral-600 w-full">
                            {member.totalPOYPoints - leaderPoints === 0
                              ? "-"
                              : (
                                  (member.totalPOYPoints - leaderPoints) *
                                  -1
                                ).toFixed(2)}
                          </p>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
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
              <Sheet>
                <SheetTrigger className="absolute underline top-2 mt-2 right-4 text-muted text-sm">
                  Full List
                </SheetTrigger>
                <SheetContent className="h-4/5 rounded-t-[20px]" side="bottom">
                  <SheetTitle className="w-full sticky top-0 bg-neutral-900 text-center text-2xl mb-2 font-bold">
                    Wins
                  </SheetTitle>
                  <div className="grid mt-4 w-full grid-cols-2">
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Name
                    </span>
                    <span className="pb-2 flex items-center justify-end border-b border-neutral-600 w-full text-muted">
                      Wins
                    </span>
                    {[...cumulativeCashStats]
                      .sort((a, b) => b.wins - a.wins)
                      .map((data) => {
                        if (data.totalRebuys === 0) return null;
                        return (
                          <React.Fragment key={data.member.id + data.wins}>
                            <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                              {data.member.first_name}
                            </h3>
                            <p className="font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full">
                              {data.wins}
                            </p>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
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
              <Sheet>
                <SheetTrigger className="absolute underline top-2 mt-2 right-4 text-muted text-sm">
                  Full List
                </SheetTrigger>
                <SheetContent className="h-4/5 rounded-t-[20px]" side="bottom">
                  <SheetTitle className="w-full sticky top-0 bg-neutral-900 text-center text-2xl mb-2 font-bold">
                    Net Profit
                  </SheetTitle>
                  <div className="grid mt-4 w-full grid-cols-2">
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Name
                    </span>
                    <span className="pb-2 flex items-center justify-end border-b border-neutral-600 w-full text-muted">
                      Net
                    </span>
                    {[...cumulativeCashStats]
                      .sort((a, b) => b.netProfit - a.netProfit)
                      .map((data) => {
                        if (data.totalRebuys === 0) return null;
                        return (
                          <React.Fragment key={data.member.id + data.netProfit}>
                            <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                              {data.member.first_name}
                            </h3>
                            <p
                              className={cn(
                                "font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full",
                                getProfitTextColor(data.netProfit)
                              )}>
                              {formatMoney(data.netProfit)}
                            </p>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
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
              <Sheet>
                <SheetTrigger className="absolute underline top-2 mt-2 right-4 text-muted text-sm">
                  Full List
                </SheetTrigger>
                <SheetContent className="h-4/5 rounded-t-[20px]" side="bottom">
                  <SheetTitle className="w-full sticky top-0 bg-neutral-900 text-center text-2xl mb-2 font-bold">
                    Gross Profit
                  </SheetTitle>
                  <div className="grid mt-4 w-full grid-cols-2">
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Name
                    </span>
                    <span className="pb-2 flex items-center justify-end border-b border-neutral-600 w-full text-muted">
                      Gross
                    </span>
                    {[...cumulativeCashStats]
                      .sort((a, b) => b.grossProfit - a.grossProfit)
                      .map((data) => {
                        if (data.totalRebuys === 0) return null;
                        return (
                          <React.Fragment
                            key={data.member.id + data.grossProfit}>
                            <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                              {data.member.first_name}
                            </h3>
                            <p
                              className={cn(
                                "font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full",
                                getProfitTextColor(data.grossProfit)
                              )}>
                              {formatMoney(data.grossProfit)}
                            </p>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
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
              <Sheet>
                <SheetTrigger className="absolute underline top-2 mt-2 right-4 text-muted text-sm">
                  Full List
                </SheetTrigger>
                <SheetContent className="h-4/5 rounded-t-[20px]" side="bottom">
                  <SheetTitle className="w-full sticky top-0 bg-neutral-900 text-center text-2xl mb-2 font-bold">
                    Win Percentage
                  </SheetTitle>
                  <div className="grid mt-4 w-full grid-cols-[3fr_2fr_2fr]">
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Name
                    </span>
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Sessions
                    </span>
                    <span className="pb-2 border-b flex items-center justify-end border-neutral-600 w-full text-muted">
                      Value
                    </span>
                    {[...cumulativeCashStats]
                      .sort((a, b) => b.winPercentage - a.winPercentage)
                      .map((data) => {
                        if (data.totalRebuys === 0) return null;
                        return (
                          <React.Fragment
                            key={data.member.id + data.winPercentage}>
                            <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                              {data.member.first_name}
                            </h3>
                            <p
                              className={cn(
                                "font-semibold text-base md:text-lg py-2 border-b border-neutral-600 w-full"
                              )}>
                              {data.sessionsPlayed}
                            </p>
                            <p
                              className={cn(
                                "font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full"
                              )}>
                              {data.winPercentage.toFixed(2)}%
                            </p>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
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
              <Sheet>
                <SheetTrigger className="absolute underline top-2 mt-2 right-4 text-muted text-sm">
                  Full List
                </SheetTrigger>
                <SheetContent className="h-4/5 rounded-t-[20px]" side="bottom">
                  <SheetTitle className="w-full sticky top-0 bg-neutral-900 text-center text-2xl mb-2 font-bold">
                    Session Average
                  </SheetTitle>
                  <div className="grid mt-4 w-full grid-cols-[3fr_2fr_2fr]">
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Name
                    </span>
                    <span className="pb-2 border-b border-neutral-600 w-full text-muted">
                      Rebuys Per
                    </span>
                    <span className="pb-2 border-b flex items-center justify-end border-neutral-600 w-full text-muted">
                      Avg Net
                    </span>
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
                      .map((data) => {
                        if (data.totalRebuys === 0) return null;
                        return (
                          <React.Fragment
                            key={
                              data.netProfit / data.sessionsPlayed +
                              data.member.id
                            }>
                            <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                              {data.member.first_name}
                            </h3>
                            <p
                              className={cn(
                                "font-semibold text-base md:text-lg py-2 border-b border-neutral-600 w-full"
                              )}>
                              {(data.totalRebuys / data.sessionsPlayed).toFixed(
                                2
                              )}
                            </p>
                            <p
                              className={cn(
                                "font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full",
                                getProfitTextColor(
                                  data.netProfit / data.sessionsPlayed
                                )
                              )}>
                              {formatMoney(
                                data.netProfit / data.sessionsPlayed
                              )}
                            </p>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
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
