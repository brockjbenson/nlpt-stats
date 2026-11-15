import { getMembers, getSeasons, getTournaments } from "@/lib/data/league";
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
  const [
    { data: seasons, error: seasonsError },
    { data: members, error: membersError },
  ] = await Promise.all([getSeasons(), getMembers()]);

  if (seasonsError) {
    return { error: seasonsError, title: "Error fetching seasons" };
  }
  if (membersError) {
    return { error: membersError, title: "Error fetching members" };
  }

  const activeSeason = seasons.find(
    (season) => season.year.toString() === year,
  );

  const { data: tournaments, error: tournamentsError } = await getTournaments(
    year && activeSeason ? activeSeason.id : null,
  );

  if (tournamentsError) {
    return {
      error: tournamentsError,
      title: "Error fetching tournaments",
    };
  }

  const sortedTournaments = [...tournaments].sort((a, b) => {
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
