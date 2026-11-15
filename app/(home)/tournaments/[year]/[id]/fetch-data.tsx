import { getMajorData } from "@/lib/data/league";
import { MajorData } from "@/utils/types";
import { PostgrestError } from "@supabase/supabase-js";

type TournamentsDataSuccess = {
  tournament: MajorData;
  error?: never;
  title?: never;
};

type TournamentsDataError = {
  error: PostgrestError;
  title: string;
  tournaments?: never;
};

type TournamentsDataResult = TournamentsDataSuccess | TournamentsDataError;

export default async function fetchTournamentData({
  id,
}: {
  id?: string;
}): Promise<TournamentsDataResult> {
  const { data, error } = await getMajorData(id);

  if (error) {
    return { error, title: "Error fetching tournament data" };
  }

  return {
    tournament: data ?? [],
  };
}
