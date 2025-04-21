"use client";

import {
  CashSession,
  Member,
  POYData,
  SeasonCashStats,
  Week,
} from "@/utils/types";
import useEmblaCarousel from "embla-carousel-react";
import React, { useCallback, useEffect, useState } from "react";
import { EmblaOptionsType } from "embla-carousel";
import { Card, CardTitle } from "@/components/ui/card";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
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
import Link from "next/link";

interface Props {
  seasonStats: SeasonCashStats[];
  poyData: POYData[];
  members: Member[];
}
const OPTIONS: EmblaOptionsType = {};

function OverviewMobile({ seasonStats, poyData, members }: Props) {
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

  const poyPointsLeaders = [...seasonStats].sort(
    (a, b) => b.poy_points - a.poy_points
  );
  const netProfitLeaders = [...seasonStats].sort(
    (a, b) => b.net_profit - a.net_profit
  );
  const winsLeaders = [...seasonStats].sort((a, b) => b.wins - a.wins);
  const grossProfitLeaders = [...seasonStats].sort(
    (a, b) => b.gross_profit - a.gross_profit
  );
  const winPercentageLeaders = [...seasonStats].sort(
    (a, b) => b.win_percentage - a.win_percentage
  );
  const sessionAverageLeaders = [...seasonStats].sort(
    (a, b) => b.session_avg - a.session_avg
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
                    <br />
                    <span className="text-muted font-normal text-lg">
                      (cash only)
                    </span>
                  </SheetTitle>
                  <div className="grid mt-4 w-full grid-cols-3">
                    <span className="pb-2 border-b text-sm md:text-base border-neutral-600 w-full text-muted">
                      Name
                    </span>
                    <span className="pb-2 border-b text-sm md:text-base border-neutral-600 w-full text-muted">
                      Total
                    </span>
                    <span className="pb-2 border-b text-sm md:text-base border-neutral-600 w-full text-muted">
                      Points Behind
                    </span>
                    {poyData
                      .sort((a, b) => b.cash_points - a.cash_points)
                      .map((data) => {
                        const leaderPoints = poyData[0].cash_points;
                        return (
                          <React.Fragment
                            key={data.member_id + data.cash_points}>
                            <h3 className="text-sm font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                              <Link href={`/members/${data.member_id}`}>
                                {data.first_name}
                              </Link>
                            </h3>
                            <p className="font-semibold text-sm md:text-lg py-2 border-b border-neutral-600 w-full">
                              {data.cash_points.toFixed(2)}
                            </p>
                            <p className="font-semibold text-sm md:text-lg py-2 border-b border-neutral-600 w-full">
                              {leaderPoints - data.cash_points === 0
                                ? "-"
                                : (leaderPoints - data.cash_points).toFixed(2)}
                            </p>
                          </React.Fragment>
                        );
                      })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
              <div className="flex flex-col gap-4">
                {poyData
                  .sort((a, b) => b.cash_points - a.cash_points)
                  .slice(0, 3)
                  .map((data, index) => {
                    const memberData = members.find(
                      (member) => member.id === data.member_id
                    );
                    return (
                      <div
                        className="flex items-center justify-between"
                        key={data.member_id + data.cash_points + index + "poy"}>
                        <Link
                          href={`/members/${data.member_id}`}
                          className="flex items-center gap-4">
                          <MemberImage
                            className="w-10 h-10"
                            src={memberData?.portrait_url || ""}
                            alt={data.first_name}
                          />
                          <h3 className="text-base md:text-xl font-medium">
                            {data.first_name}
                          </h3>
                        </Link>

                        <p className="font-semibold text-lg md:text-xl">
                          {data.cash_points.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
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
                    {winsLeaders.map((data) => {
                      return (
                        <React.Fragment key={data.member_id + data.wins}>
                          <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                            <Link href={`/members/${data.member_id}`}>
                              {data.first_name}
                            </Link>
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
                {winsLeaders.slice(0, 3).map((data, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={data.wins + data.member_id + index + "wins"}>
                    <Link
                      href={`/members/${data.member_id}`}
                      className="flex items-center gap-4">
                      <MemberImage
                        loading="lazy"
                        className="w-10 h-10"
                        src={data.portrait_url}
                        alt={data.first_name}
                      />
                      <h3 className="text-base md:text-xl font-medium">
                        {data.first_name}
                      </h3>
                    </Link>

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
                    {netProfitLeaders.map((data) => {
                      return (
                        <React.Fragment key={data.member_id + data.net_profit}>
                          <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                            <Link href={`/members/${data.member_id}`}>
                              {data.first_name}
                            </Link>
                          </h3>
                          <p
                            className={cn(
                              "font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full",
                              getProfitTextColor(data.net_profit)
                            )}>
                            {formatMoney(data.net_profit)}
                          </p>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
              <div className="flex flex-col gap-4">
                {netProfitLeaders.slice(0, 3).map((data, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={data.member_id + data.net_profit + index + "net"}>
                    <Link
                      href={`/members/${data.member_id}`}
                      className="flex items-center gap-4">
                      <MemberImage
                        loading="lazy"
                        className="w-10 h-10"
                        src={data.portrait_url}
                        alt={data.first_name}
                      />
                      <h3 className="text-base md:text-xl font-medium">
                        {data.first_name}
                      </h3>
                    </Link>

                    <p
                      className={cn(
                        getProfitTextColor(data.net_profit),
                        "font-semibold text-lg md:text-xl"
                      )}>
                      {formatMoney(data.net_profit)}
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
                    {grossProfitLeaders.map((data) => {
                      return (
                        <React.Fragment
                          key={data.member_id + data.gross_profit}>
                          <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                            <Link href={`/members/${data.member_id}`}>
                              {data.first_name}
                            </Link>
                          </h3>
                          <p
                            className={cn(
                              "font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full",
                              getProfitTextColor(data.gross_profit)
                            )}>
                            {formatMoney(data.gross_profit)}
                          </p>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
              <div className="flex flex-col gap-4">
                {grossProfitLeaders.slice(0, 3).map((data, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={data.gross_profit + data.member_id + index + "gross"}>
                    <Link
                      href={`/members/${data.member_id}`}
                      className="flex items-center gap-4">
                      <MemberImage
                        loading="lazy"
                        className="w-10 h-10"
                        src={data.portrait_url}
                        alt={data.first_name}
                      />
                      <h3 className="text-base md:text-xl font-medium">
                        {data.first_name}
                      </h3>
                    </Link>

                    <p
                      className={cn(
                        "font-semibold text-lg md:text-xl",
                        getProfitTextColor(data.gross_profit)
                      )}>
                      {formatMoney(data.gross_profit)}
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
                    {winPercentageLeaders.map((data) => {
                      return (
                        <React.Fragment
                          key={data.member_id + data.win_percentage}>
                          <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                            <Link href={`/members/${data.member_id}`}>
                              {data.first_name}
                            </Link>
                          </h3>
                          <p
                            className={cn(
                              "font-semibold text-base md:text-lg py-2 border-b border-neutral-600 w-full"
                            )}>
                            {data.sessions_played}
                          </p>
                          <p
                            className={cn(
                              "font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full"
                            )}>
                            {data.win_percentage.toFixed(2)}%
                          </p>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
              <div className="flex flex-col gap-4">
                {winPercentageLeaders.slice(0, 3).map((data, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={data.win_percentage + data.member_id + index + "win%"}>
                    <Link
                      href={`/members/${data.member_id}`}
                      className="flex items-center gap-4">
                      <MemberImage
                        loading="lazy"
                        className="w-10 h-10"
                        src={data.portrait_url}
                        alt={data.first_name}
                      />
                      <h3 className="text-base md:text-xl font-medium">
                        {data.first_name}
                      </h3>
                    </Link>

                    <p className={cn("font-semibold text-lg md:text-xl")}>
                      {data.win_percentage.toFixed(2)}%
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
                    {sessionAverageLeaders.map((data) => {
                      return (
                        <React.Fragment key={data.session_avg + data.member_id}>
                          <h3 className="text-base font-semibold md:text-xl py-2 border-b border-neutral-600 w-full">
                            <Link href={`/members/${data.member_id}`}>
                              {data.first_name}
                            </Link>
                          </h3>
                          <p
                            className={cn(
                              "font-semibold text-base md:text-lg py-2 border-b border-neutral-600 w-full"
                            )}>
                            {data.avg_rebuys.toFixed(2)}
                          </p>
                          <p
                            className={cn(
                              "font-semibold flex items-center justify-end text-base md:text-lg py-2 border-b border-neutral-600 w-full",
                              getProfitTextColor(data.session_avg)
                            )}>
                            {formatMoney(data.session_avg)}
                          </p>
                        </React.Fragment>
                      );
                    })}
                  </div>
                </SheetContent>
                <SheetOverlay />
              </Sheet>
              <div className="flex flex-col gap-4">
                {sessionAverageLeaders.slice(0, 3).map((data, index) => (
                  <div
                    className="flex items-center justify-between"
                    key={data.session_avg + data.member_id + index + "avg_win"}>
                    <Link
                      href={`/members/${data.member_id}`}
                      className="flex items-center gap-4">
                      <MemberImage
                        loading="lazy"
                        className="w-10 h-10"
                        src={data.portrait_url}
                        alt={data.first_name}
                      />
                      <h3 className="text-base md:text-xl font-medium">
                        {data.first_name}
                      </h3>
                    </Link>

                    <p
                      className={cn(
                        "font-semibold text-lg md:text-xl",
                        getProfitTextColor(data.session_avg)
                      )}>
                      {formatMoney(data.session_avg)}
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
