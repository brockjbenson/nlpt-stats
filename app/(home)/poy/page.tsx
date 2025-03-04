import ErrorHandler from "@/components/error-handler";
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
import { createClient } from "@/utils/supabase/server";
import { POYData } from "@/utils/types";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import Link from "next/link";
import React from "react";

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
    return (
      <ErrorHandler
        errorMessage={seasonError.message}
        title="Error fetching seasons"
        pageTitle="POY Standings"
      />
    );

  const activeSeason = seasons.find(
    (season) => season.year === Number(currentYear)
  );

  const { data: poyData, error: poyError } = await db.rpc("get_poy_info", {
    current_season_id: activeSeason.id,
  });

  if (poyError) {
    return (
      <ErrorHandler
        errorMessage={poyError.message}
        title="Error fetching POY Data"
        pageTitle="POY Standings"
      />
    );
  }

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
        icon: <Minus className="text-foreground" size={16} />,
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

  return (
    <>
      <PageHeader>
        <POYInfo />
      </PageHeader>
      <YearCarousel seasons={seasons} year={year || currentYear.toString()} />
      <div className="w-full  mt-4 mb-8 max-w-screen-xl mx-auto px-2">
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
                  Avg <br /> Points
                </TableHead>
                <TableHead>
                  Cash <br /> Points
                </TableHead>
                <TableHead>
                  Avg Cash <br /> Points
                </TableHead>
                <TableHead>
                  Major <br /> Points
                </TableHead>
                <TableHead>
                  Avg Major <br /> Points
                </TableHead>
                <TableHead>
                  Cash <br /> Played
                </TableHead>
                <TableHead>
                  Majors <br /> Played
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poyData.map((data: POYData) => {
                if (data.total_points === 0) {
                  return null;
                }
                const changeData = getRankChangeInfo(
                  data.rank,
                  data.last_week_rank
                );
                const leaderPoints = poyData[0].total_points;
                return (
                  <TableRow key={data.member_id}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            changeData.color,
                            "flex items-center gap-1"
                          )}>
                          {changeData.icon}
                        </span>
                        {data.rank}
                      </span>
                    </TableCell>
                    <TableCell>
                      {data.last_week_rank > 0 ? (
                        data.last_week_rank
                      ) : (
                        <Minus size={14} />
                      )}
                    </TableCell>
                    <TableCell>
                      <Link href={`/members/${data.member_id}`}>
                        {data.first_name} {data.last_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {leaderPoints - data.total_points === 0 ? (
                        <Minus size={14} />
                      ) : (
                        (leaderPoints - data.total_points).toFixed(2)
                      )}
                    </TableCell>
                    <TableCell>{data.total_points.toFixed(2)}</TableCell>
                    <TableCell>{(data.avg_points || 0).toFixed(2)}</TableCell>
                    <TableCell>{(data.cash_points || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {(data.avg_cash_points || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{(data.major_points || 0).toFixed(2)}</TableCell>
                    <TableCell>
                      {(data.avg_major_points || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>{data.cash_played || 0}</TableCell>
                    <TableCell>{data.majors_played || 0}</TableCell>
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
