import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import { selectTournamentsWithSessions } from "@/utils/tournament/queries";
import ErrorHandler from "@/components/error-handler";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import TournamentsMain from "@/features/tournaments/components/tournaments-main";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import SeasonTabs, {
  SeasonTabsSkeleton,
} from "@/components/page-header/season-tabs";
import { ADMIN_ACTION_CLASS } from "@/components/admin-nav/admin-action";
import { Suspense } from "react";

async function Page({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const db = await createClient();
  const { year } = await searchParams;
  const currentYear = year ? year : new Date().getFullYear();
  const yearNumber = Number(currentYear);
  const [
    { data: seasons, error: seasonsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*"),
  ]);

  if (seasonsError) {
    return (
      <ErrorHandler
        title="Error fetching seasons"
        errorMessage={seasonsError.message}
        pageTitle="Tournaments"
      />
    );
  }

  if (membersError) {
    return (
      <ErrorHandler
        title="Error fetching members"
        errorMessage={membersError.message}
        pageTitle="Tournaments"
      />
    );
  }

  const activeSeason =
    seasons.find((season) => season.year === yearNumber) || seasons[0];

  const { data: tournamentsData, error: tournamentsDataError } =
    await selectTournamentsWithSessions(db, activeSeason.id);

  if (tournamentsDataError) {
    return (
      <ErrorHandler
        title="Error fetching tournaments"
        errorMessage={tournamentsDataError.message}
        pageTitle="Tournaments"
      />
    );
  }

  return (
    <>
      <PageHeader>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-xl font-bold">
            {currentYear} Tournaments
            <ChevronDown className="ml-1 inline-block size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              {seasons.map((season) => (
                <DropdownMenuItem asChild key={season.id}>
                  <Link
                    href={`/admin/stats/tournaments?year=${season.year}`}
                    className="w-full"
                  >
                    {season.year}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>
      <DesktopPageHeader title="Tournaments">
        <Suspense fallback={<SeasonTabsSkeleton />}>
          <SeasonTabs
            activeYear={String(activeSeason.year)}
            hrefFor={(seasonYear) =>
              `/admin/stats/tournaments?year=${seasonYear}`
            }
          />
        </Suspense>
      </DesktopPageHeader>
      <div className="flex justify-end px-2 mb-4">
        <Link
          className={ADMIN_ACTION_CLASS}
          href="/admin/stats/tournaments/new"
        >
          Add Tournament
        </Link>
      </div>
      <TournamentsMain
        isAdmin
        members={members}
        tournamentsData={tournamentsData}
      />
    </>
  );
}

export default Page;
