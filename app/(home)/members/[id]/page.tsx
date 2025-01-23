import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import React from "react";

interface EditMemberProps {
  params: Promise<{
    id: string;
  }>;
}

async function Member({ params }: EditMemberProps) {
  const db = await createClient();
  const id = await params;
  const { data, error } = await db.from("members").select("*").eq("id", id.id);
  if (error) {
    return <p>Error fetching member: {error.message}</p>;
  }
  const member = data[0];
  return (
    <>
      <Card>
        <h1>
          {member.firstName} {member.lastName}
        </h1>
      </Card>
    </>
  );
}

export default Member;
