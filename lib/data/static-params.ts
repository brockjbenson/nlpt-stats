import { getMembers, getSeasons, getTournaments } from "./league";

// Which pages to prebuild with their data at deploy time, for the pages'
// generateStaticParams. A season, member or tournament added later gets its
// page built on its first visit, and cached from then on.
//
// If a lookup fails the deploy fails, rather than going out with pages
// missing; the previous deployment stays live.

// Every season's year: /poy/2025, /stats/cash/2025, /tournaments/2025 ...
export async function seasonYearParams() {
  const { data: seasons, error } = await getSeasons();
  if (error) throw new Error(`Listing seasons to prebuild: ${error.message}`);
  return seasons.map((season) => ({ year: String(season.year) }));
}

// Members shown on the members page: /members/{id}
export async function memberParams() {
  const { data: members, error } = await getMembers();
  if (error) throw new Error(`Listing members to prebuild: ${error.message}`);
  return members
    .filter((member) => member.visible)
    .map((member) => ({ id: member.id }));
}

// Every tournament, under its season's year: /tournaments/{year}/{id}
export async function tournamentParams() {
  const { data: tournaments, error } = await getTournaments(null);
  if (error) {
    throw new Error(`Listing tournaments to prebuild: ${error.message}`);
  }
  return (tournaments as { id: string; season: { year: number } }[]).map(
    (tournament) => ({
      year: String(tournament.season.year),
      id: tournament.id,
    }),
  );
}
