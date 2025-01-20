import React from "react";

interface Params {
  season?: string;
  member?: string;
}

async function Page(props: { searchParams: Promise<Params | null> }) {
  const searchParams = await props.searchParams;

  return (
    <>
      <h1>{searchParams?.season} Cash Stats</h1>
    </>
  );
}

export default Page;
