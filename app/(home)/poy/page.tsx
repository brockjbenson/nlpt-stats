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
import { getPOYPointsLeaders } from "@/utils/utils";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import React from "react";

interface Params {
  params: Promise<{ year: string | null }>;
}

async function Page({ params }: Params) {
  const { year } = await params;
  const currentYear = new Date().getFullYear();
  const db = await createClient();
  const { data: season, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", year ? year : currentYear);

  if (seasonError) {
    return <p>Error fetching Season data: {seasonError.message}</p>;
  }

  const { data: sessions, error: sessionError } = await db
    .from("cash_session")
    .select(`*, week:week_id(*)`)
    .eq("season_id", season[0].id);

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  const sessionsSortedByWeek = sessions.sort(
    (a, b) => a.week.week_number - b.week.week_number
  );

  const { data: members, error: memberError } = await db
    .from("members")
    .select("*");

  if (memberError) {
    return <p>Error fetching Member data: {memberError.message}</p>;
  }

  const memberIds = members.map((member) => member.id);

  const rankedPOYMembers = getPOYPointsLeaders(
    sessionsSortedByWeek,
    memberIds,
    members
  );

  const maxWeekNumber = Math.max(
    ...sessionsSortedByWeek.map((session) => session.week.week_number)
  );

  const filteredSessions = sessionsSortedByWeek.filter(
    (session) => session.week.week_number !== maxWeekNumber
  );

  const lastWeekRankedPOYMembers = getPOYPointsLeaders(
    filteredSessions,
    memberIds,
    members
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
      <h1 className="mb-12">Player of the Year Standings</h1>
      <Card className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Last Week</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Points Behind</TableHead>
              <TableHead>Avg Points Per Week</TableHead>
              <TableHead>Total Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankedPOYMembers.map((member) => {
              const pointsBehind =
                rankedPOYMembers[0].totalPOYPoints - member.totalPOYPoints;
              const lastWeekRank = lastWeekRankedPOYMembers.filter(
                (lastWeekMember) => lastWeekMember.id === member.id
              )[0].currentRank;
              const changeData = getRankChangeInfo(
                member.currentRank,
                lastWeekRank
              );
              return (
                <TableRow key={member.id}>
                  <TableCell className="flex items-center gap-2">
                    {member.currentRank}
                    <span
                      className={cn(
                        changeData.color,
                        "flex items-center gap-1"
                      )}
                    >
                      {changeData.icon}
                      <span className="text-base md:text-xl">
                        {displayRankChange(lastWeekRank, member.currentRank)}
                      </span>
                    </span>
                  </TableCell>
                  <TableCell>{lastWeekRank}</TableCell>
                  <TableCell>{member.name}</TableCell>
                  <TableCell>
                    {pointsBehind === 0 ? (
                      <Minus size={14} />
                    ) : (
                      pointsBehind.toFixed(2)
                    )}
                  </TableCell>
                  <TableCell>
                    {(member.totalPOYPoints / maxWeekNumber).toFixed(2)}
                  </TableCell>
                  <TableCell>{member.totalPOYPoints.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}

export default Page;
