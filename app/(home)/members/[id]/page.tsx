import ErrorHandler from "@/components/error-handler";
import MemberMain from "@/components/members/member-main";
import PageHeader from "@/components/page-header/page-header";
import { Season } from "@/utils/types";
import {
  getCareerData,
  getMember,
  getMemberAdvancedSkills,
  getMemberDebutDate,
  getMemberNlpiInfo,
  getNlpiRankRecords,
  getPoyInfo,
  getSeasons,
  getStatAvgs,
} from "@/lib/data/league";
import { getCurrentYear } from "@/lib/data/current-year";
import { memberParams } from "@/lib/data/static-params";

interface EditMemberProps {
  params: Promise<{
    id: string;
  }>;
}

async function Member({ params }: EditMemberProps) {
  const { id } = await params;

  const currentYear = await getCurrentYear();
  const [
    { data: seasons, error: seasonsError },
    { data: member, error: memberError },
  ] = await Promise.all([getSeasons(), getMember(id)]);

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
    (season: Season) => season.year === currentYear,
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
    getMemberNlpiInfo(currentSeasonId, id),
    getPoyInfo(currentSeasonId, id),
    getCareerData(member.id, currentSeasonId),
    getMemberDebutDate(id),
    getNlpiRankRecords(id),
    getStatAvgs(),
    getMemberAdvancedSkills(id),
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

// Prebuilt with data at deploy time; see lib/data/static-params.ts.
export const generateStaticParams = memberParams;

export default Member;
