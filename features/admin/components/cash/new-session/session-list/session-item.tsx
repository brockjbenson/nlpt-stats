import { Card } from "@/components/ui/card";
import { CashSession, Member } from "@/utils/types";
import React from "react";
import FilledSession from "./filled-session";
import EmptySession from "./empty-session";

interface SessionItemProps {
  member: Member;
  sessionsToAdd: Omit<CashSession, "id">[];
  addNewSession: (member: Member) => void;
  removeSession: (memberId: string) => void;
  setSessionsToAdd: React.Dispatch<
    React.SetStateAction<Omit<CashSession, "id">[]>
  >;
}

function SessionItem({
  member,
  sessionsToAdd,
  setSessionsToAdd,
  addNewSession,
  removeSession,
}: SessionItemProps) {
  const hasSession = sessionsToAdd.some(
    (session) => session.member_id === member.id
  );

  const correspondingSession = sessionsToAdd.find(
    (session) => session.member_id === member.id
  );
  return (
    <li className="w-full">
      <Card>
        {hasSession ? (
          <FilledSession
            member={member}
            correspondingSession={correspondingSession!}
            setSessionsToAdd={setSessionsToAdd}
            removeSession={removeSession}
          />
        ) : (
          <EmptySession
            onClick={(e) => {
              e.preventDefault();
              addNewSession(member);
            }}
            member={member}
          />
        )}
      </Card>
    </li>
  );
}

export default SessionItem;
