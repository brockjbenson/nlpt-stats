import { Card, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/server";
import { CashSessionWithFullMember } from "@/utils/types";
import {
  formatMoney,
  getBiggestLoser,
  getProfitTextColor,
  getTopPerformer,
  getTopThree,
} from "@/utils/utils";
import React from "react";
import RecentSession from "./_components/recent-session";

interface Params {
  params: Promise<{ year: number }>;
}

async function Page({ params }: Params) {
  const db = await createClient();
  const { year } = await params;

  const { data: seasons, error: seasonError } = await db
    .from("season")
    .select("*")
    .eq("year", year);

  if (seasonError) {
    return <p>Error fetching seasons: {seasonError.message}</p>;
  }

  const { data: members, error: memberError } = await db
    .from("members")
    .select("*")
    .order("first_name", { ascending: true });

  if (memberError) {
    return <p>Error fetching members: {memberError.message}</p>;
  }

  const memberIds = members.map((member) => member.id);

  const { data: sessions, error: sessionsError } = await db.rpc(
    "get_cash_sessions_by_season",
    {
      target_season_id: seasons[0].id,
    }
  );

  if (sessionsError) {
    return <p>Error fetching sessions: {sessionsError.message}</p>;
  }

  const sessionsGroupedByMember = sessions.reduce(
    (acc: any, session: CashSessionWithFullMember) => {
      if (!acc[session.member_id]) {
        acc[session.member_id] = [];
      }
      acc[session.member_id].push(session);
      return acc;
    },
    {}
  );

  const getMember = (id: string) => members.find((member) => member.id === id);

  const mostRecentSession = [...sessions].filter(
    (session: CashSessionWithFullMember & { week_number: number }) =>
      session.week_number ===
      sessions.reduce(
        (
          acc: number,
          session: CashSessionWithFullMember & { week_number: number }
        ) => {
          return session.week_number > acc ? session.week_number : acc;
        },
        0
      )
  );

  return (
    <>
      <h1>{year} Cash Stats</h1>
      <h2 className="text-base mt-12 mb-4 text-left mr-auto md:text-xl">
        Week {mostRecentSession[0].week_number} Summary
      </h2>
      {/* <RecentSession recentSession={mostRecentSession} /> */}
    </>
  );
}

export default Page;
