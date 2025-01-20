import AddWeeks from "@/components/admin/seasons/add-weeks";
import Season from "@/components/admin/seasons/season";
import Seasons from "@/components/admin/seasons/seasons";
import React from "react";

interface Params {
  year?: string;
  newweek?: string;
}

async function Page(props: { searchParams: Promise<Params | null> }) {
  const searchParams = await props.searchParams;

  if (searchParams?.year && !searchParams?.newweek) {
    return <Season year={searchParams.year} />;
  } else if (searchParams?.newweek && searchParams?.year) {
    return (
      <AddWeeks year={searchParams.year} seasonId={searchParams.newweek} />
    );
  } else {
    return <Seasons />;
  }
}

export default Page;
