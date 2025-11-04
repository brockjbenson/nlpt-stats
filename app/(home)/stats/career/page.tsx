import ErrorHandler from "@/components/error-handler";
import PageHeader from "@/components/page-header/page-header";
import CareerOverview from "@/components/stats/career/career-leaders";
import CareerStatSelector from "@/components/stats/career/stat-selector";
import StatsTable from "@/components/stats/career/stats-table";
import { createClient } from "@/utils/supabase/server";
import React from "react";

async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view: string }>;
}) {
  const view = (await searchParams).view || "all";
  const db = await createClient();
  const [careerStatsResponse] = await Promise.all([
    db.rpc("get_career_stats", { target_view: view }),
  ]);

  if (careerStatsResponse.error) {
    return (
      <ErrorHandler
        pageTitle="Career Stats"
        title={"Error Loading Career Stats"}
        errorMessage={careerStatsResponse.error.message || "Unknown error"}
      />
    );
  }
  const careerStats = careerStatsResponse.data;

  const triggerTitle =
    view === "all"
      ? "Career"
      : `${view.charAt(0).toUpperCase() + view.slice(1)}`;

  return (
    <>
      <PageHeader>
        <CareerStatSelector triggerTitle={triggerTitle} />
      </PageHeader>
      <CareerOverview careerStats={careerStats} />
      <StatsTable careerStats={careerStats} view={view} />
    </>
  );
}

export default Page;
