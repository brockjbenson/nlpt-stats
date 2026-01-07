import ErrorHandler from "@/components/error-handler";
import MemberMain from "@/components/members/member-main";
import PageHeader from "@/components/page-header/page-header";
import { Season } from "@/utils/types";
import { createStaticClient } from "@/utils/supabase/static";

interface EditMemberProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate static params for all members
export async function generateStaticParams() {
  const db = createStaticClient();

  const { data: members } = await db.from("members").select("id");

  return (
    members?.map((member) => ({
      id: member.id,
    })) ?? []
  );
}

// Enable static generation
export const dynamic = "force-static";
export const revalidate = 3600; // Revalidate every hour (optional)

async function Member({ params }: EditMemberProps) {
  const db = createStaticClient();

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

  const currentSeason = seasons.find(
    (season: Season) => season.year === currentYear
  );

  if (!currentSeason) {
    return (
      <ErrorHandler
        errorMessage="Current season not found"
        title="Error fetching season"
        pageTitle="Member"
      />
    );
  }

  const currentSeasonId = currentSeason.id;

  const [
    { data: nlpiData, error: nlpiError },
    { data: poyData, error: poyError },
    { data: careerStats, error: careerStatsError },
    { data: joinDate, error: joinDateError },
    { data: historicalNLPIRecords, error: historicalNLPIRecordsError },
    { data: statsAvg, error: statsAvgError },
    { data: memberAdvancedSkills, error: memberAdvancedSkillsError },
  ] = await Promise.all([
    db.rpc("get_nlpi_info", {
      current_season_id: currentSeasonId,
      target_filter_date: null,
      target_member_id: id,
    }),
    db.rpc("get_poy_info", {
      target_member_id: id,
      current_season_id: currentSeasonId,
    }),
    db.rpc("get_career_data", {
      target_member_id: member.id,
      current_season_id: currentSeasonId,
    }),
    db.rpc("get_member_debut_date", {
      target_member_id: id,
    }),
    db.rpc("get_nlpi_rank_records", {
      target_member_id: id,
    }),
    db.rpc("get_stat_avgs"),
    db.rpc("get_member_advanced_skills", {
      target_member_id: id,
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

  if (joinDateError) {
    return (
      <ErrorHandler
        errorMessage={joinDateError.message}
        title="Error fetching member info"
        pageTitle="Member"
      />
    );
  }

  if (historicalNLPIRecordsError) {
    return (
      <ErrorHandler
        errorMessage={historicalNLPIRecordsError.message}
        title="Error fetching historical NLPI records"
        pageTitle="Member"
      />
    );
  }

  if (statsAvgError) {
    return (
      <ErrorHandler
        errorMessage={statsAvgError.message}
        title="Error fetching stats averages"
        pageTitle="Member"
      />
    );
  }

  if (memberAdvancedSkillsError) {
    return (
      <ErrorHandler
        errorMessage={memberAdvancedSkillsError.message}
        title="Error fetching member advanced skills"
        pageTitle="Member"
      />
    );
  }

  return (
    <>
      <PageHeader showBackButton className="mb-0" title="Member" />
      <MemberMain
        advancedSkills={memberAdvancedSkills[0]}
        avgData={statsAvg[0]}
        nlpiHistoricalRecords={historicalNLPIRecords}
        id={id}
        member={member}
        currentYear={currentYear}
        nlpiData={nlpiData}
        poyData={poyData}
        careerStats={careerStats}
        seasons={seasons}
        joinDate={joinDate[0].created_at}
      />
    </>
  );
}

export default Member;
