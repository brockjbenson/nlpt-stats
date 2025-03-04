"use client";

import { CareerData, Season } from "@/utils/types";
import React from "react";
import MemberCashStats from "./member-cash-stats";
import MemberMajorStats from "./member-major-stats";

interface Props {
  careerStats: CareerData;
  view: string | undefined;
  seasons: Season[];
}

function MemberAllStats({ careerStats, view, seasons }: Props) {
  if (view === "cash") {
    return (
      <MemberCashStats
        careerStats={careerStats}
        view={view}
        seasons={seasons}
      />
    );
  }

  if (view === "majors") {
    return (
      <MemberMajorStats
        careerStats={careerStats}
        view={view}
        seasons={seasons}
      />
    );
  }
}

export default MemberAllStats;
