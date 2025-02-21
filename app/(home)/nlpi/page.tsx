import NLPIInfo from "@/components/nlpi/nlpi-info";
import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { CashSession, CashSessionNLPI, NLPIData } from "@/utils/types";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import React from "react";

async function NLPI() {
  const db = await createClient();
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", currentYear)
    .single();

  if (seasonError) {
    return <p>Error fetching season: {seasonError.message}</p>;
  }

  const { data: nlpiData, error: nlpiError } = await db.rpc("get_nlpi_data", {
    target_season_id: season.id,
  });

  if (nlpiError) {
    return <p>Error fetching NLPI data: {nlpiError.message}</p>;
  }
  const currentData = nlpiData.map((data: NLPIData) => {
    const lastCashSession = data.used_cash_sessions.slice(-1)[0];

    return {
      ...data,
      total_points: data.total_points - lastCashSession.nlpi_points,
      cash_points: data.cash_points - lastCashSession.nlpi_points,
    };
  });

  const ineligibleMembers = currentData.filter(
    (data: NLPIData) => data.total_points === 0
  );

  const lastWeekData = nlpiData.map((data: NLPIData) => {
    const mostRecentSession = data.used_cash_sessions.slice(0)[0];
    return {
      ...data,
      total_points: data.total_points - mostRecentSession.nlpi_points,
      cash_points: data.cash_points - mostRecentSession.nlpi_points,
    };
  });

  const lastWeekRank = lastWeekData.sort(
    (a: NLPIData, b: NLPIData) => b.total_points - a.total_points
  );

  const getRankChangeInfo = (
    currentRank: number,
    lastWeekRank: number | null
  ) => {
    if (lastWeekRank === null) {
      return {
        positive: false,
        change: 0,
        color: "text-green-500",
        icon: <ArrowUp size={16} />,
      };
    }
    if (currentRank === lastWeekRank) {
      return {
        positive: false,
        change: 0,
        color: "text-foreground",
        icon: <Minus className="text-foreground" size={14} />,
      };
    } else if (currentRank < lastWeekRank) {
      return {
        positive: true,
        change: lastWeekRank - currentRank,
        color: "text-green-500",
        icon: <ArrowUp className="text-green-500" size={16} />,
      };
    } else {
      return {
        positive: false,
        change: currentRank - lastWeekRank,
        color: "text-red-500",
        icon: <ArrowDown className="text-red-500" size={16} />,
      };
    }
  };

  const displayRankChange = (lastWeek: number | null, current: number) => {
    if (lastWeek === null) {
      return;
    }
    const change = lastWeek - current;

    if (change === 0) {
      return;
    }

    if (change > 0) {
      return change;
    }

    if (change < 0) {
      return change * -1;
    }
  };

  return (
    <>
      <PageHeader>
        <NLPIInfo />
      </PageHeader>
      <div className="w-full animate-in px-2 mt-4 max-w-screen-xl mx-auto">
        <Card className="w-full  mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>
                  Last <br /> Week
                </TableHead>
                <TableHead>
                  End <br /> {previousYear}
                </TableHead>
                <TableHead>Member</TableHead>
                <TableHead>
                  Avg <br /> Points
                </TableHead>
                <TableHead>
                  Total <br /> Points
                </TableHead>
                <TableHead>
                  Total <br /> Cash
                </TableHead>
                <TableHead>
                  Total <br /> Major
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((data: NLPIData) => {
                if (data.total_points === 0) {
                  return null;
                }
                const lastWeek: any = lastWeekRank.findIndex(
                  (member: NLPIData) => member.member_id === data.member_id
                );
                const changeData = getRankChangeInfo(
                  data.current_rank,
                  lastWeek + 1
                );
                return (
                  <TableRow key={data.member_id}>
                    <TableCell className="flex items-center gap-2">
                      {data.current_rank}
                      <span
                        className={cn(
                          changeData.color,
                          "flex items-center gap-1"
                        )}>
                        {changeData.icon}
                        <span className="text-sm md:text-base">
                          {displayRankChange(lastWeek + 1, data.current_rank)}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {lastWeek + 1 || (
                        <Minus className="text-foreground" size={14} />
                      )}
                    </TableCell>
                    <TableCell>
                      {data.end_last_year || (
                        <Minus className="text-foreground" size={14} />
                      )}
                    </TableCell>
                    <TableCell>{data.first_name}</TableCell>
                    <TableCell>{(data.total_points / 24).toFixed(3)}</TableCell>
                    <TableCell>{data.total_points.toFixed(3)}</TableCell>
                    <TableCell>{data.cash_points.toFixed(3)}</TableCell>
                    <TableCell>{data.tournament_points.toFixed(3)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        <h2 className="mt-12 w-full text-base pb-2 border-b border-muted mr-auto">
          Ineligible Members
          <span className="text-sm text-muted">
            (no data for most recent 20 cash sessions or last 4 tournaments)
          </span>
        </h2>
        {ineligibleMembers.length === 0 ? (
          <p className="mt-4">No members are ineligible for NLPI points.</p>
        ) : (
          ineligibleMembers.map((data: NLPIData) => {
            return (
              <div
                key={data.member_id}
                className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{data.first_name}</h3>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}

export default NLPI;
