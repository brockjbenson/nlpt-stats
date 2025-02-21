import MemberOverview from "@/components/members/member-overview";
import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { NLPIData, Season } from "@/utils/types";
import Image from "next/image";
import React from "react";

interface EditMemberProps {
  params: Promise<{
    id: string;
  }>;
}

async function Member({ params }: EditMemberProps) {
  const db = await createClient();
  const { id } = await params;
  const currentYear = new Date().getFullYear();
  const [
    { data: cashData, error: cashError },
    { data: tournamentData, error: tournamentDataError },
    { data: seasons, error: seasonsError },
  ] = await Promise.all([
    db
      .from("cash_session")
      .select(
        `buy_in, cash_out, created_at, id, net_profit, nlpi_points, poy_points, rebuys, week:week_id(id, week_number), member:member_id(*), season:season_id(*)`
      )
      .eq("member_id", id)
      .gt("buy_in", 0)
      .order("created_at", { ascending: false }),
    db
      .from("tournament_sessions")
      .select("*")
      .eq("member_id", id)
      .gt("nlpi_points", 0),
    db.from("season").select("*"),
  ]);

  if (cashError) return <p>Error fetching cash data {cashError.message}</p>;
  if (tournamentDataError)
    return <p>Error fetching tournament data {tournamentDataError.message}</p>;
  if (seasonsError) return <p>Error fetching seasons {seasonsError.message}</p>;

  const activeSeasonId = seasons.find(
    (season: Season) => season.year === currentYear
  )?.id;

  const [{ data: nlpiData, error: nlpiError }] = await Promise.all([
    db.rpc("get_nlpi_data", {
      target_season_id: activeSeasonId,
    }),
  ]);

  if (nlpiError) return <p>Error fetching nlpi data {nlpiError.message}</p>;

  const currentNLPIRank: NLPIData[] = nlpiData.find(
    (data: NLPIData) => data.member_id === id
  )?.current_rank;

  console.log(currentNLPIRank);

  const lastTenCashSessions = cashData.slice(0, 10);
  const cumulativeCashNetProfit = cashData.reduce(
    (acc: number, session: any) => acc + session.net_profit,
    0
  );
  const cumulativeTournamentNetProfit = tournamentData.reduce(
    (acc: number, session: any) => acc + session.net_profit,
    0
  );

  const cumulativeNetProfit =
    cumulativeCashNetProfit + cumulativeTournamentNetProfit;

  console.log(cumulativeNetProfit);

  return (
    <>
      <PageHeader title="Member" />
    </>
  );
}

export default Member;
