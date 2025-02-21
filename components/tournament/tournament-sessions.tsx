import { Member, TournamentSession } from "@/utils/types";
import Link from "next/link";
import React from "react";
import { Card, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { PiMedalFill } from "react-icons/pi";

interface SessionsWithMember extends TournamentSession {
  member: Member;
  session: TournamentSession;
}

interface Props {
  sessions: SessionsWithMember[] | null;
  isAdmin?: boolean;
  tournamentId: string;
}

function TournamentSessions({ sessions, isAdmin, tournamentId }: Props) {
  if (!sessions || sessions.length === 0) {
    if (isAdmin) {
      return (
        <div className="flex flex-col gap-4 items-center justify-center">
          <p className="mt-8 text-muted text-center text-base mx-auto">
            No Tournament Sessions Found
          </p>
          <Link
            href={`/admin/stats/tournaments/${tournamentId}/sessions/add`}
            className="px-4 py-2 text-white bg-primary rounded mx-auto">
            Add Sessions
          </Link>
        </div>
      );
    } else {
      return (
        <p className="mt-8 text-muted text-center text-base mx-auto">
          No Tournament Sessions Found
        </p>
      );
    }
  }

  const renderPlacementMedal = (place: number) => {
    switch (place) {
      case 1:
        return (
          <div className="w-10 h-10 relative flex items-center justify-center">
            <PiMedalFill className="text-yellow-600 w-10 h-10" />
            <span className="text-black text-xs absolute z-10 top-[7px] font-bold">
              1
            </span>
          </div>
        );
      case 2:
        return (
          <div className="w-10 h-10 relative flex items-center justify-center">
            <PiMedalFill className="text-neutral-400 w-10 h-10" />
            <span className="text-black text-xs absolute z-10 top-[7px] font-bold">
              2
            </span>
          </div>
        );
      case 3:
        return (
          <div className="w-10 h-10 relative flex items-center justify-center">
            <PiMedalFill className="text-orange-600 w-10 h-10" />
            <span className="text-black text-xs absolute z-10 top-[7px] font-bold">
              3
            </span>
          </div>
        );
      default:
        return (
          <div className="w-10 h-10 relative flex items-center justify-center">
            {place}
          </div>
        );
    }
  };
  return (
    <div className="mt-4">
      <Card>
        <CardTitle>Tournament Sessions</CardTitle>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="!relative">Place</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Buy in</TableHead>
              <TableHead>Cash out</TableHead>
              <TableHead>Net Profit</TableHead>
              <TableHead>Rebuys</TableHead>
              <TableHead>POY Points</TableHead>
              <TableHead>NLPI points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions
              .filter((s) => s.place > 0)
              .sort((a, b) => a.place - b.place)
              .map((session) => {
                return (
                  <TableRow key={session.id}>
                    <TableCell className="!relative">
                      {renderPlacementMedal(session.place)}
                    </TableCell>
                    <TableCell>{session.member.first_name}</TableCell>
                    <TableCell>{formatMoney(session.buy_in)}</TableCell>
                    <TableCell>{formatMoney(session.cash_out)}</TableCell>
                    <TableCell>
                      <span className={getProfitTextColor(session.net_profit)}>
                        {formatMoney(session.net_profit)}
                      </span>
                    </TableCell>
                    <TableCell>{session.rebuys}</TableCell>
                    <TableCell>{session.poy_points.toFixed(2)}</TableCell>
                    <TableCell>{session.nlpi_points.toFixed(3)}</TableCell>
                  </TableRow>
                );
              })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default TournamentSessions;
