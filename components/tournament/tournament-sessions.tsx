import { Member, TournamentSession } from "@/utils/types";
import Link from "next/link";
import React from "react";

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
  return <div>TournamentSessions</div>;
}

export default TournamentSessions;
