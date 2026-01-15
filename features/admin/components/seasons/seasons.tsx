import { SeasonWithWeeks } from "@/app/admin/seasons/page";
import PageHeader from "@/components/page-header/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import EditSeasonDrawer from "@/features/admin/components/seasons/edit-season-drawer";
import NewSeasonDrawer from "@/features/admin/components/seasons/new-season-drawer";
import { AlertCircle } from "lucide-react";
import RemoveSeason from "./remove-season";

interface Props {
  seasons: SeasonWithWeeks[];
}

async function Seasons({ seasons }: Props) {
  const seasonsWithCounts = seasons?.map((season) => ({
    ...season,
    sessions_count:
      season.cash_session?.filter((s: { buy_in: number }) => s.buy_in > 0)
        .length ?? 0,
  }));

  return (
    <>
      <PageHeader title="Seasons" />
      {seasons.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <AlertCircle />
            </EmptyMedia>
            <EmptyTitle>No Seasons Found</EmptyTitle>
            <EmptyDescription>
              No season data has been added yet. Once season data has been added
              you will see it here.
            </EmptyDescription>
            <EmptyContent>
              <div className="w-full mt-3 flex items-center justify-center">
                <NewSeasonDrawer seasons={seasons} />
              </div>
            </EmptyContent>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="w-full px-2">
          <div className="flex items-center justify-end mb-4">
            <NewSeasonDrawer seasons={seasons} />
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 w-full gap-4">
            {seasons.map((season) => (
              <li className="w-full" key={season.id}>
                <Card className="relative">
                  <CardHeader>
                    <CardTitle>{season.year}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted flex items-center justify-between">
                    <div>
                      <p>Weeks: {season.week.length}</p>
                      <p>
                        Sessions:{" "}
                        {seasonsWithCounts?.find((s) => s.id === season.id)
                          ?.sessions_count ?? 0}
                      </p>
                    </div>
                    <div className="flex absolute top-1/2 -translate-y-1/2 right-2 items-center gap-2">
                      <EditSeasonDrawer seasons={seasons} season={season} />
                      <RemoveSeason id={season.id} />
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default Seasons;
