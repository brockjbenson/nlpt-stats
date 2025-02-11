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
import { CashSession, CashSessionNLPI } from "@/utils/types";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import React from "react";
import PageHeader from "@/components/page-header/page-header";

async function NLPI() {
  const db = await createClient();
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const [
    { data: sessions, error: sessionError },
    { data: members, error: memberError },
  ] = await Promise.all([
    db.rpc("get_nlpi_sessions"),
    db.from("members").select("*"),
  ]);

  if (memberError) {
    return <p>Error fetching Member data: {memberError.message}</p>;
  }
  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  const memberIds = members.map((member) => member.id);

  const previousYearSessions = [...sessions].filter(
    (session: CashSessionNLPI) => {
      return session.year === previousYear;
    }
  );

  const sessionsByMember = memberIds.reduce((acc, memberId) => {
    acc[memberId] = [...sessions]
      .filter((session: CashSessionNLPI) => session.member_id === memberId)
      .slice(0, 20);
    return acc;
  }, {});

  const previousSessionsByMember = memberIds.reduce((acc, memberId) => {
    acc[memberId] = [...previousYearSessions]
      .filter((session: CashSessionNLPI) => session.member_id === memberId)
      .slice(0, 20);
    return acc;
  }, {});

  const memberRanks = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];
    const totalPoints = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.nlpi_points,
      0
    );

    const lastWeekSessions = allSessions.slice(1);
    const lastWeekPoints = lastWeekSessions.reduce(
      (sum: number, session: CashSession) => sum + session.nlpi_points,
      0
    );

    return {
      id: member.id,
      name: member.first_name,
      totalPoints,
      lastWeekPoints,
    };
  });

  const previousYearMemberRanks = members.map((member) => {
    const allSessions = previousSessionsByMember[member.id] || [];
    const totalPoints = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.nlpi_points,
      0
    );

    return {
      id: member.id,
      name: member.first_name,
      totalPoints,
    };
  });

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

  const filteredMembers = memberRanks.filter(
    (member) => member.totalPoints > 0
  );

  const ineligibleMembers = memberRanks.filter(
    (member) => member.totalPoints === 0
  );

  const currentYearRankedMembers = [...filteredMembers]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((member, index) => ({
      ...member,
      currentRank: index + 1,
    }));

  const currentYearRankedLastWeek = [...filteredMembers]
    .sort((a, b) => b.lastWeekPoints - a.lastWeekPoints)
    .map((member, index) => ({
      ...member,
      lastWeekRank: index + 1,
    }));

  const previousYearRankedMembers = [...previousYearMemberRanks]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((member, index) => ({
      ...member,
      previousYearRank: member.totalPoints === 0 ? "-" : index + 1,
    }));

  const finalRanks = currentYearRankedMembers.map((member) => {
    const lastWeek = currentYearRankedLastWeek.find((m) => m.id === member.id);
    const previousYear = previousYearRankedMembers.find(
      (m) => m.id === member.id
    );
    return {
      ...member,
      lastWeekRank: lastWeek ? lastWeek.lastWeekRank : null,
      previousYearRank: previousYear ? previousYear.previousYearRank : null,
    };
  });

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
      <PageHeader title="NLPI Rankings" />
      <div className="w-full px-2 mt-4 max-w-screen-xl mx-auto">
        <Card className="w-full  mb-8">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Last Week</TableHead>
                <TableHead>End {previousYear}</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Avg Points</TableHead>
                <TableHead>Total Points</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {finalRanks.map((member) => {
                const changeData = getRankChangeInfo(
                  member.currentRank,
                  member.lastWeekRank
                );
                return (
                  <TableRow key={member.id}>
                    <TableCell className="flex items-center gap-2">
                      {member.currentRank}
                      <span
                        className={cn(
                          changeData.color,
                          "flex items-center gap-1"
                        )}>
                        {changeData.icon}
                        <span className="text-base md:text-xl">
                          {displayRankChange(
                            member.lastWeekRank,
                            member.currentRank
                          )}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{member.lastWeekRank || "-"}</TableCell>
                    <TableCell>{member.previousYearRank || "-"}</TableCell>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>
                      {(
                        member.totalPoints /
                        (sessionsByMember[member.id]?.length || 1)
                      ).toFixed(3)}
                    </TableCell>
                    <TableCell>{member.totalPoints.toFixed(3)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
        <h2 className="mt-12 w-full text-base pb-2 border-b border-muted mr-auto">
          Ineligible Members{" "}
          <span className="text-sm text-muted">
            (no data for most recent 20 sessions)
          </span>
        </h2>
        <ul className="flex flex-col mb-4 mt-4 mr-auto">
          {ineligibleMembers.map((member) => (
            <li key={member.id}>{member.name}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default NLPI;
