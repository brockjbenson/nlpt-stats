import ErrorHandler from "@/components/error-handler";
import NLPIInfo from "@/features/nlpi/components/nlpi-info";
import PageHeader from "@/components/page-header/page-header";
import MemberImage from "@/components/members/member-image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

import NLPIRankings from "@/features/nlpi/components/nlpi-rankings";
import { NLPIData } from "@/features/nlpi/lib/types";
import { createClient } from "@/utils/supabase/server";

async function NLPI() {
  // Use service role client for static generation
  const db = await createClient();

  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const { data: seasons, error: seasonError } = await db
    .from("season")
    .select("*");

  if (seasonError) {
    return (
      <ErrorHandler
        errorMessage={seasonError.message}
        title="Error fetching seasons"
        pageTitle="NLPI Rankings"
      />
    );
  }

  const activeSeason = seasons.find((season) => season.year === currentYear);

  if (!activeSeason) {
    return (
      <ErrorHandler
        errorMessage="Current season not found"
        title="Error fetching season"
        pageTitle="NLPI Rankings"
      />
    );
  }

  const [{ data: nlpiData, error: nlpiError }, { data: members }] =
    await Promise.all([
      db.rpc("get_nlpi_info", {
        current_season_id: activeSeason.id,
        target_filter_date: null,
      }),
      db.from("members").select("id, portrait_url"),
    ]);

  // Portraits are optional; cards fall back to a placeholder if missing
  const portraits: Record<string, string | null> = Object.fromEntries(
    (members ?? []).map((m: { id: string; portrait_url: string | null }) => [
      m.id,
      m.portrait_url,
    ]),
  );

  if (nlpiError) {
    return (
      <ErrorHandler
        errorMessage={nlpiError.message}
        title="Error fetching NLPI data"
        pageTitle="NLPI Rankings"
      />
    );
  }

  const ineligibleMembers = nlpiData.filter(
    (data: NLPIData) => data.total_points === 0,
  );

  return (
    <>
      <PageHeader>
        <NLPIInfo />
      </PageHeader>
      <div className="w-full px-2 max-w-(--breakpoint-xl) mx-auto">
        <Card className="w-full mb-8">
          {/* Mobile already shows "NLPI Rankings" in the page header */}
          <CardHeader className="max-md:hidden">
            <CardTitle>NLPI Rankings - {currentYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <NLPIRankings
              portraits={portraits}
              data={nlpiData
                .map((row: NLPIData) => ({ ...row, previousYear }))
                .filter(
                  (row: NLPIData & { previousYear: number | null }) =>
                    row.total_points > 0,
                )}
            />
          </CardContent>
        </Card>
        {/* Same card and row layout as the rankings, with no rank or points */}
        <Card className="w-full mb-8">
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>Ineligible Members</CardTitle>
            <CardDescription className="text-xs text-muted">
              No data for their most recent 20 cash sessions or last 4
              tournaments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {ineligibleMembers.length === 0 ? (
              <p className="py-3 text-sm text-muted">
                No members are ineligible for NLPI points.
              </p>
            ) : (
              <ul className="flex flex-col">
                {ineligibleMembers.map((data: NLPIData) => (
                  <li
                    key={data.member_id}
                    className="border-b border-border last:border-b-0"
                  >
                    <Link
                      href={`/members/${data.member_id}`}
                      className="grid grid-cols-[2rem_2.5rem_1fr] items-center gap-x-3 py-3"
                    >
                      <span
                        aria-hidden
                        className="text-center text-base font-bold text-muted"
                      >
                        –
                      </span>
                      <MemberImage
                        loading="lazy"
                        src={portraits[data.member_id] ?? ""}
                        alt={data.first_name}
                        className="w-10 h-10"
                      />
                      <span className="font-semibold truncate">
                        {data.first_name} {data.last_name.slice(0, 1)}.
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export default NLPI;
