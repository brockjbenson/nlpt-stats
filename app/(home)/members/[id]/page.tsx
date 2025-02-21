import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import Image from "next/image";
import React from "react";

interface EditMemberProps {
  params: Promise<{
    id: string;
  }>;
}

async function Member({ params }: EditMemberProps) {
  const db = await createClient();
  const id = await params;
  return (
    <>
      <PageHeader title="Member" />
      <div className="h-screen w-screen fixed top-0 left-0 flex flex-col gap-4 items-center justify-center">
        <Image
          src="/icons/nlpt-no-bg.png"
          alt="NLPT"
          width={100}
          height={100}
        />
        <h1 className="text-base font-bold md:text-2xl">Coming Soon</h1>
      </div>
    </>
  );
}

export default Member;
