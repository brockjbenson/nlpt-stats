import { createClient } from "@/utils/supabase/server";
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
  const db = await createClient();

  const { data, error } = await db.rpc("get_major_data", {
    target_tournament_id: id,
  });

  if (error) {
    return { error, title: "Error fetching tournament data" };
  }

  return {
    tournament: data ?? [],
  };
}
