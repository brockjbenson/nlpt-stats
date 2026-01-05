import PageHeader from "@/components/page-header/page-header";
import { createClient } from "@/utils/supabase/server";
import ErrorHandler from "@/components/error-handler";
import TournamentsMain from "@/components/stats/tournament/tournaments-main";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

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

  const { data: tournamentsData, error: tournamentsDataError } = await db
    .from("tournaments")
    .select("*, tournament_sessions(*)")
    .eq("season_id", activeSeason.id);

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
                    className="w-full">
                    {season.year}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>
      <TournamentsMain
        members={members}
        year={yearNumber}
        tournamentsData={tournamentsData}
      />
    </>
  );
}

export default Page;
