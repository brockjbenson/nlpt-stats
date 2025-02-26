import NLPICalculator from "@/components/nlpi/nlpi-calculator";
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
import { NLPIData } from "@/utils/types";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import React from "react";

interface props {
  searchParams: Promise<{ date: string | null }>;
}

async function NLPI({ searchParams }: props) {
  const db = await createClient();
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const { data: seasons, error: seasonError } = await db
    .from("season")
    .select("*");

  if (seasonError) {
    return <p>Error fetching season: {seasonError.message}</p>;
  }

  const activeSeason = seasons.find((season) => season.year === currentYear);

  const { data: nlpiData, error: nlpiError } = await db.rpc("get_nlpi_info", {
    current_season_id: activeSeason.id,
  });

  if (nlpiError) {
    return <p>Error fetching NLPI data: {nlpiError.message}</p>;
  }

  const ineligibleMembers = nlpiData.filter(
    (data: NLPIData) => data.total_points === 0
  );

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
    } else if (currentRank < lastWeekRank) {
      return {
        positive: true,
        change: lastWeekRank - currentRank,
        color: "text-theme-green",
        icon: <ArrowUp className="text-theme-green" size={16} />,
      };
    } else {
      return {
        positive: false,
        change: currentRank - lastWeekRank,
        color: "text-theme-red",
        icon: <ArrowDown className="text-theme-red" size={16} />,
      };
    }
  };

  return (
    <>
      <PageHeader>
        <NLPIInfo />
      </PageHeader>
      <div className="w-full animate-in px-2 mt-4 max-w-screen-xl mx-auto">
        <div className="my-4 grid grid-cols-2">
          <NLPICalculator nlpiData={nlpiData} />
        </div>
        <Card className="w-full mb-8">
          <Table>
            <TableHeader>
              <TableRow className="uppercase">
                <TableHead className="md:pr-0">Ranking</TableHead>
                <TableHead>
                  <span className="flex flex-col items-center">
                    <span>Last</span>
                    <span>Week</span>
                  </span>
                </TableHead>
                <TableHead className="pr-8">
                  <span className="flex flex-col items-center">
                    <span>End</span>
                    <span>{previousYear}</span>
                  </span>
                </TableHead>

                <TableHead className="pr-0">Member</TableHead>
                <TableHead>
                  <span className="flex flex-col items-center">
                    <span>Avg</span>
                    <span>Points</span>
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex flex-col items-center">
                    <span>Total</span>
                    <span>Points</span>
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex flex-col items-center">
                    <span>Total</span>
                    <span>Cash</span>
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex flex-col items-center">
                    <span>Avg</span>
                    <span>Cash</span>
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex flex-col items-center">
                    <span>Total</span>
                    <span>Major</span>
                  </span>
                </TableHead>
                <TableHead>
                  <span className="flex flex-col items-center">
                    <span>Avg</span>
                    <span>Major</span>
                  </span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {nlpiData.map((data: NLPIData) => {
                if (data.total_points === 0) {
                  return null;
                }
                const changeData = getRankChangeInfo(
                  data.rank,
                  data.last_week_rank
                );
                return (
                  <TableRow key={data.member_id}>
                    <TableCell>
                      <span className="flex gap-2 items-center justify-center">
                        <span
                          className={cn(changeData.color, "flex items-center")}>
                          {changeData.icon}
                        </span>
                        {data.rank}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-center">
                        {data.last_week_rank || (
                          <Minus className="text-foreground" size={14} />
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="pr-8">
                      <span className="flex justify-center">
                        {data.last_year_rank || (
                          <Minus className="text-foreground" size={14} />
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="md:pr-0">
                      {data.first_name} {data.last_name}
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-center">
                        {(data.total_points / data.divisor).toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-center">
                        {data.total_points.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-center">
                        {data.cash_points.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-center">
                        {(data.cash_points / data.cash_divisor).toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-center">
                        {data.tournament_points.toFixed(3)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="flex justify-center">
                        {(data.tournament_points / data.major_divisor).toFixed(
                          3
                        )}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        <h2 className="mt-12 mb-2 w-full flex flex-col gap-1 text-base pb-2 border-b border-muted mr-auto">
          Ineligible Members
          <span className="text-xs text-muted">
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
