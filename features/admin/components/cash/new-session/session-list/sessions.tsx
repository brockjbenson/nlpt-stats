"use client";

import { CashSessionNoId, Member } from "@/utils/types";
import React from "react";
import SessionItem from "./session-item";

interface Props {
  members: Member[];
  sessionsToAdd: CashSessionNoId[];
  addNewSession: (member: Member) => void;
  removeSession: (memberId: string) => void;
  setSessionsToAdd: React.Dispatch<React.SetStateAction<CashSessionNoId[]>>;
}

function Sessions({
  members,
  sessionsToAdd,
  setSessionsToAdd,
  addNewSession,
  removeSession,
}: Props) {
  return (
    <>
      <ul className="flex flex-col gap-3 mb-4">
        {members.map((member) => (
          <SessionItem
            key={member.id}
            member={member}
            sessionsToAdd={sessionsToAdd}
            setSessionsToAdd={setSessionsToAdd}
            addNewSession={addNewSession}
            removeSession={removeSession}
          />
        ))}
      </ul>
    </>
  );
}

export default Sessions;
