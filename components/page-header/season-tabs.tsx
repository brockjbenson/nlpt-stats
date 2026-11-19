import { getSeasons } from "@/lib/data/league";
import { Skeleton } from "../ui/skeleton";
import LinkTabs, { LinkTab } from "./link-tabs";

interface SeasonTabsProps {
  // A chip before the seasons, e.g. "All" or "Career".
  leading?: LinkTab;
  // The selected season's year, or "" when the leading chip is selected.
  activeYear: string;
  hrefFor: (year: number) => string;
}

// A desktop row of chips, one per season, newest first.
async function SeasonTabs({ leading, activeYear, hrefFor }: SeasonTabsProps) {
  const { data: seasons, error } = await getSeasons();
  if (error) throw new Error(`Error fetching seasons: ${error.message}`);

  const seasonTabs: LinkTab[] = [...seasons]
    .sort((a, b) => b.year - a.year)
    .map((season) => ({
      href: hrefFor(season.year),
      label: String(season.year),
      active: String(season.year) === activeYear,
    }));

  return (
    <LinkTabs
      variant="chips"
      tabs={leading ? [leading, ...seasonTabs] : seasonTabs}
    />
  );
}

const SKELETON_CHIPS = 6;

// Same height as the chip row, for while the seasons load.
export function SeasonTabsSkeleton() {
  return (
    <div className="flex gap-2">
      {Array.from({ length: SKELETON_CHIPS }, (_, i) => (
        <Skeleton key={i} className="h-8 w-16 rounded-full" />
      ))}
    </div>
  );
}

export default SeasonTabs;
