import { addWeeksAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import React from "react";

interface Props {
  seasonId: string;
  year: string;
}
async function AddWeeks({ seasonId, year }: Props) {
  return (
    <form className="w-full px-4 max-w-screen-sm mx-auto">
      <h2 className="text-center font-semibold text-xl">
        Add Weeks for {year} Season
      </h2>
      <div className="grid grid-cols-2 gap-8">
        <fieldset className="mb-4 mt-8 gap-4 flex flex-col">
          <Label htmlFor="year">Season</Label>
          <Input name="year" type="text" readOnly value={year} />
        </fieldset>
        <fieldset className="mb-4 mt-8 gap-4 flex flex-col">
          <Label htmlFor="weeks">Num of weeks</Label>
          <Input name="weeks" type="number" />
        </fieldset>
        <Input
          name="seasonId"
          readOnly
          type="text"
          value={seasonId}
          className="hidden"
        />
      </div>
      <div className="flex items-center mt-4 justify-end gap-4">
        <Link
          className="bg-transparent border border-primary hover:bg-primary/15 rounded h-12 flex items-center justify-center px-6"
          href={`/admin/seasons?year=${year}`}>
          Cancel
        </Link>
        <SubmitButton
          className="h-12 font-semibold"
          pendingText="Adding weeks..."
          formAction={addWeeksAction}>
          Add week(s)
        </SubmitButton>
      </div>
    </form>
  );
}

export default AddWeeks;
