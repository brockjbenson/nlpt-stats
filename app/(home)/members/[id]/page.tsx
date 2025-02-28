import ErrorHandler from "@/components/error-handler";
import MemberCareerOverview from "@/components/members/member-career-overview";
import MemberHeader from "@/components/members/member-header";
import MemberOverview from "@/components/members/member-header";
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
    { data: seasons, error: seasonsError },
    { data: member, error: memberError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*").eq("id", id).single(),
  ]);
  if (seasonsError) {
    return (
      <ErrorHandler
        errorMessage={seasonsError.message}
        title="Error fetching seasons"
        pageTitle="Member"
      />
    );
  }
  if (memberError) {
    return (
      <ErrorHandler
        errorMessage={memberError.message}
        title="Error fetching member info"
        pageTitle="Member"
      />
    );
  }

  const currentSeasonId = seasons.find(
    (season: Season) => season.year === currentYear
  ).id;
  const [
    { data: nlpiData, error: nlpiError },
    { data: poyData, error: poyError },
    { data: careerStats, error: careerStatsError },
  ] = await Promise.all([
    db.rpc("get_nlpi_info", {
      current_season_id: currentSeasonId,
      target_filter_date: null, // Use null if no date filtering is needed
      target_member_id: id,
    }),
    db.rpc("get_poy_info", {
      target_member_id: id,
      current_season_id: currentSeasonId,
    }),
    db.rpc("get_career_data", {
      target_member_id: member.id,
    }),
  ]);

  if (nlpiError) {
    return (
      <ErrorHandler
        errorMessage={nlpiError.message}
        title="Error fetching NLPI data"
        pageTitle="Member"
      />
    );
  }

  if (poyError) {
    return (
      <ErrorHandler
        errorMessage={poyError.message}
        title="Error fetching POY data"
        pageTitle="Member"
      />
    );
  }

  if (careerStatsError) {
    return (
      <ErrorHandler
        errorMessage={careerStatsError.message}
        title="Error fetching career stats"
        pageTitle="Member"
      />
    );
  }

  return (
    <>
      <PageHeader className="mb-0" title="Member" />
      <MemberHeader member={member} />
      <MemberCareerOverview
        nlpiData={nlpiData}
        poyData={poyData}
        careerData={careerStats}
      />
    </>
  );
}

export default Member;
