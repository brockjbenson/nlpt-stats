"use client";

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
    (session) => session.member_id === member.id,
  );

  const correspondingSession = sessionsToAdd.find(
    (session) => session.member_id === member.id,
  );

  const emptySessionHeight = 66;
  const filledSessionHeight = 114;
  return (
    <li className="w-full">
      <Card
        className="overflow-hidden"
        style={{
          height: hasSession
            ? filledSessionHeight + "px"
            : emptySessionHeight + "px",
          transition: "height 0.15s",
        }}>
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
