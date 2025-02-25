import PageHeader from "@/components/page-header/page-header";
import POYInfo from "@/components/poy/poy-info";
import YearCarousel from "@/components/poy/year-carousel";
import { Card, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { getPOYData, ProcessedPOYData } from "@/utils/poy/utils";
import { createClient } from "@/utils/supabase/server";
import {
  CashSession,
  CashSessionWithWeek,
  TournamentSession,
} from "@/utils/types";
import {
  getPOYPointsLeaders,
  getPOYPointsLeadersWithTournaments,
} from "@/utils/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import React from "react";

type POYData = {
  member_id: string;
  first_name: string;
  all_cash_sessions: {
    poy_points: number;
    created_at: string;
    net_profit: number;
  }[];
  all_tournament_sessions: {
    poy_points: number;
    date: string;
  }[];
};

interface Params {
  searchParams: Promise<{ year: string | null }>;
}

async function Page({ searchParams }: Params) {
  const { year } = await searchParams;
  const currentYear = year ? year : new Date().getFullYear();
  const db = await createClient();
  const [{ data: seasons, error: seasonError }] = await Promise.all([
    db.from("season").select("*"),
  ]);

  if (seasonError)
    return <p>Error fetching Season data: {seasonError.message}</p>;

  const activeSeason = seasons.find(
    (season) => season.year === Number(currentYear)
  );

  const { data: poyData, error: poyError } = await db.rpc("get_poy_data", {
    target_season_id: activeSeason.id,
  });

  if (poyError) {
    return <p>Error fetching POY data: {poyError.message}</p>;
  }

  const pointsData: ProcessedPOYData[] = getPOYData(poyData);

  const getRankChangeInfo = (
    currentRank: number,
    lastWeekRank: number | null
  ) => {
    if (lastWeekRank === null) {
      return {
        positive: false,
        change: 0,
        color: "text-theme-green",
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
    }
    return currentRank < lastWeekRank
      ? {
          positive: true,
          change: lastWeekRank - currentRank,
          color: "text-theme-green",
          icon: <ArrowUp className="text-theme-green" size={16} />,
        }
      : {
          positive: false,
          change: currentRank - lastWeekRank,
          color: "text-theme-red",
          icon: <ArrowDown className="text-theme-red" size={16} />,
        };
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
        <POYInfo />
      </PageHeader>
      <YearCarousel seasons={seasons} year={year || currentYear.toString()} />
      <div className="w-full animate-in mt-4 mb-8 max-w-screen-xl mx-auto px-2">
        <Card className="w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>
                  Last <br /> Week
                </TableHead>
                <TableHead>Member</TableHead>
                <TableHead>
                  Points <br /> Behind
                </TableHead>
                <TableHead>
                  Total <br /> Points
                </TableHead>
                <TableHead>
                  Cash <br /> Points
                </TableHead>
                <TableHead>
                  Major <br /> Points
                </TableHead>
                <TableHead>
                  Cash <br /> Played
                </TableHead>
                <TableHead>
                  Avg Cash <br /> Per Week
                </TableHead>
                <TableHead>
                  Majors <br /> Played
                </TableHead>
                <TableHead>
                  Avg Major <br /> Per Tourney
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pointsData.map((data) => {
                if (data.total === 0) {
                  return null;
                }
                const changeData = getRankChangeInfo(
                  data.rank,
                  data.lastWeekRank
                );
                return (
                  <TableRow key={data.member_id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {data.rank}
                        <span
                          className={cn(
                            changeData.color,
                            "flex items-center gap-1"
                          )}>
                          {changeData.icon}
                          <span className="text-sm md:text-base">
                            {displayRankChange(data.lastWeekRank, data.rank)}
                          </span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      {data.lastWeekRank > 0 ? (
                        data.lastWeekRank
                      ) : (
                        <Minus size={14} />
                      )}
                    </TableCell>
                    <TableCell>{data.first_name}</TableCell>
                    <TableCell>
                      {data.pointsBehind === 0 ? (
                        <Minus size={14} />
                      ) : (
                        data.pointsBehind.toFixed(2)
                      )}
                    </TableCell>
                    <TableCell>{data.total.toFixed(2)}</TableCell>
                    <TableCell>{data.cash_points.toFixed(2)}</TableCell>
                    <TableCell>{data.tournament_points.toFixed(2)}</TableCell>
                    <TableCell>{data.cashSessionsPlayed}</TableCell>
                    <TableCell>
                      {(
                        data.cash_points / data.cashSessionsPlayed || 0
                      ).toFixed(2)}
                    </TableCell>
                    <TableCell>{data.tournamentSessionsPlayed}</TableCell>
                    <TableCell>
                      {(
                        data.tournament_points /
                          data.tournamentSessionsPlayed || 0
                      ).toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      </div>
    </>
  );
}

export default Page;
