import { createClient } from "@/utils/supabase/server";
import { MajorsData, Member, Season } from "@/utils/types";
import { PostgrestError } from "@supabase/supabase-js";

type TournamentsDataSuccess = {
  tournaments: MajorsData[];
  members: Member[];
  seasons: Season[];
  error?: never;
  title?: never;
};

type TournamentsDataError = {
  error: PostgrestError;
  title: string;
  tournaments?: never;
  members?: never;
  seasons?: never;
};

type TournamentsDataResult = TournamentsDataSuccess | TournamentsDataError;

export default async function fetchTournamentsData({
  year,
}: {
  year?: string;
}): Promise<TournamentsDataResult> {
  const db = await createClient();

  const [
    { data: seasons, error: seasonsError },
    { data: members, error: membersError },
  ] = await Promise.all([
    db.from("season").select("*"),
    db.from("members").select("*"),
  ]);

  if (seasonsError) {
    return { error: seasonsError, title: "Error fetching seasons" };
  }
  if (membersError) {
    return { error: membersError, title: "Error fetching members" };
  }

  const activeSeason = seasons.find(
    (season) => season.year.toString() === year,
  );

  let tournamentQuery = db
    .from("tournaments")
    .select("*, tournament_sessions(*), season(year)");

  if (year && activeSeason) {
    tournamentQuery = tournamentQuery.eq("season_id", activeSeason.id);
  }

  const { data: tournaments, error: tournamentsError } = await tournamentQuery;

  if (tournamentsError) {
    return {
      error: tournamentsError,
      title: "Error fetching tournaments",
    };
  }

  const sortedTournaments = tournaments.sort((a, b) => {
    const dateA = a.date;
    const dateB = b.date;
    return new Date(dateB).getTime() - new Date(dateA).getTime();
  });

  return {
    tournaments: sortedTournaments ?? [],
    members: members ?? [],
    seasons: seasons ?? [],
  };
}
