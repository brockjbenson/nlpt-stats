"use client";

import { NLPIHistoricalRecord, RecordsData } from "@/utils/types";
import React from "react";
import RecordsCarousel from "./carousel";
import useLocalStorageState from "@/hooks/use-local-storage";
import CareerRecords from "./career";
import SeasonRecords from "./season";

function RecordsComponent({
  data,
  nlpiRecords,
}: {
  data: RecordsData;
  nlpiRecords: NLPIHistoricalRecord[];
}) {
  const [mounted, setMounted] = React.useState(false);
  const [view, setView] = useLocalStorageState("records-view", "career");
  React.useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return null;
  return (
    <div className="flex px-2 flex-col gap-4 items-center justify-center">
      <RecordsCarousel view={view} setView={setView} />
      <CareerRecords
        className={view === "career" ? "" : "!hidden"}
        data={data.career}
        nlpiRecords={nlpiRecords}
      />
      <SeasonRecords
        className={view === "season" ? "" : "!hidden"}
        data={data.season}
      />
    </div>
  );
}

export default RecordsComponent;
