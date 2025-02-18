import React from "react";

interface Props {
  params: Promise<{ id: string }>;
}

async function Page({ params }: Props) {
  const { id } = await params;
  return <div>Page</div>;
}

export default Page;
