import PageHeader from "@/components/page-header/page-header";
import { Suspense } from "react";
import TournamentSkeleton from "./_components/tournament-skeleton";
import TournamentMain from "./_components/main";

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

export default Page;
