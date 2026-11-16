import PageHeader from "@/components/page-header/page-header";
import { Suspense } from "react";
import TournamentSkeleton from "./_components/tournament-skeleton";
import TournamentMain from "./_components/main";
import { tournamentParams } from "@/lib/data/static-params";

interface Props {
  params: Promise<{ year: string; id: string }>;
}

async function Page({ params }: Props) {
  const { id } = await params;

  return (
    <>
      <PageHeader title={"Tournament"} showBackButton />
      <Suspense fallback={<TournamentSkeleton />}>
        <TournamentMain id={id} />
      </Suspense>
    </>
  );
}

// Prebuilt with data at deploy time; see lib/data/static-params.ts.
export const generateStaticParams = tournamentParams;

export default Page;
