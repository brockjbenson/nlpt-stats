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
  joinDate: string;
}

function MemberMain({
  id,
  member,
  currentYear,
  nlpiData,
  poyData,
  careerStats,
  seasons,
  joinDate,
}: Props) {
  const [view, setView] = React.useState<string>("overview");
  return (
    <>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
        <MemberHeader member={member} joinDate={joinDate} />
        <div>
          <MemberViewCarousel setView={setView} view={view} />
          <MemberOverview
            view={view}
            currentYear={currentYear}
            nlpiData={nlpiData}
            poyData={poyData}
            careerStats={careerStats}
          />
        </div>
        <MemberAllStats
          seasons={seasons}
          view={view}
          careerStats={careerStats}
        />
      </div>
    </>
  );
}

export default MemberMain;
