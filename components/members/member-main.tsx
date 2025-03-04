"use client";

import { CareerData, Member, NLPIData, POYData, Season } from "@/utils/types";
import React from "react";
import MemberAllStats from "./member-all-stats";
import MemberOverview from "./member-career-overview";
import MemberHeader from "./member-header";
import MemberViewCarousel from "./member-view-carousel";

interface Props {
  id: string;
  member: Member;
  currentYear: number;
  nlpiData: NLPIData[];
  poyData: POYData[];
  careerStats: CareerData;
  seasons: Season[];
}

function MemberMain({
  id,
  member,
  currentYear,
  nlpiData,
  poyData,
  careerStats,
  seasons,
}: Props) {
  const [view, setView] = React.useState<string>("overview");
  return (
    <>
      <MemberHeader member={member} />
      <MemberViewCarousel setView={setView} view={view} />
      <MemberOverview
        view={view}
        currentYear={currentYear}
        nlpiData={nlpiData}
        poyData={poyData}
        careerStats={careerStats}
      />
      <MemberAllStats seasons={seasons} view={view} careerStats={careerStats} />
    </>
  );
}

export default MemberMain;
