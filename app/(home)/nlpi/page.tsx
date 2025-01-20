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
import { CashSession } from "@/utils/types";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import React from "react";

async function NLPI() {
  const db = await createClient();

  // Fetch all members
  const { data: members, error: memberError } = await db
    .from("members")
    .select("*");

  if (memberError) {
    return <p>Error fetching Member data: {memberError.message}</p>;
  }

  // Fetch all sessions for members in one query
  const memberIds = members.map((member) => member.id);
  const { data: sessions, error: sessionError } = await db
    .from("cashSession")
    .select("memberId, nlpiPoints, createdAt")
    .in("memberId", memberIds)
    .order("createdAt", { ascending: false });

  if (sessionError) {
    return <p>Error fetching Session data: {sessionError.message}</p>;
  }

  // Group sessions by memberId
  const sessionsByMember = memberIds.reduce((acc, memberId) => {
    acc[memberId] = sessions
      .filter((session) => session.memberId === memberId)
      .slice(0, 20); // Take the last 20 sessions
    return acc;
  }, {});

  // Calculate current rank and last week's rank
  const memberRanks = members.map((member) => {
    const allSessions = sessionsByMember[member.id] || [];
    const totalPoints = allSessions.reduce(
      (sum: number, session: CashSession) => sum + session.nlpiPoints,
      0
    );

    // Exclude the most recent session to calculate last week's rank
    const lastWeekSessions = allSessions.slice(1); // Exclude the first (most recent) session
    const lastWeekPoints = lastWeekSessions.reduce(
      (sum: number, session: CashSession) => sum + session.nlpiPoints,
      0
    );

    return {
      id: member.id,
      name: member.firstName,
      totalPoints,
      lastWeekPoints,
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
        icon: <ArrowUp className="text-green-500" size={14} />,
      };
    } else {
      return {
        positive: false,
        change: currentRank - lastWeekRank,
        color: "text-red-500",
        icon: <ArrowDown className="text-red-500" size={14} />,
      };
    }
  };

  const filteredMembers = memberRanks.filter(
    (member) => member.totalPoints > 0
  );

  // Rank members by totalPoints
  const rankedMembers = [...filteredMembers]
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((member, index) => ({
      ...member,
      currentRank: index + 1,
    }));

  // Rank members by lastWeekPoints
  const rankedLastWeek = [...filteredMembers]
    .sort((a, b) => b.lastWeekPoints - a.lastWeekPoints)
    .map((member, index) => ({
      ...member,
      lastWeekRank: index + 1,
    }));

  // Merge the ranks into one array
  const finalRanks = rankedMembers.map((member) => {
    const lastWeek = rankedLastWeek.find((m) => m.id === member.id);
    return {
      ...member,
      lastWeekRank: lastWeek ? lastWeek.lastWeekRank : null,
    };
  });

  return (
    <>
      <h1 className="mb-12">NLPI Rankings</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ranking</TableHead>
            <TableHead>Last Week</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Total Points</TableHead>
            <TableHead>Avg Points</TableHead>
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
                  <span className={cn(changeData.color, "flex items-center")}>
                    {changeData.icon}
                  </span>
                  {member.currentRank}
                </TableCell>
                <TableCell>{member.lastWeekRank || "-"}</TableCell>
                <TableCell>{member.name}</TableCell>
                <TableCell>{member.totalPoints.toFixed(3)}</TableCell>
                <TableCell>
                  {(
                    member.totalPoints /
                    (sessionsByMember[member.id]?.length || 1)
                  ).toFixed(3)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}

export default NLPI;
