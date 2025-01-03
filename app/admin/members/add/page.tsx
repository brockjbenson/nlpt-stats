import React from "react";
import { FormMessage, Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMemberAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import Link from "next/link";

async function MembersAdminAdd(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  return (
    <div className="max-w-xl w-full mx-auto flex flex-col">
      <h2 className="text-xl font-semibold">Add New Member</h2>
      <form className="w-full max-w-xl flex flex-col mt-8 gap-4 [&>input]:mb-4">
        <Label htmlFor="firstName">First Name</Label>
        <Input type="text" name="firstName" placeholder="First Name" />
        <Label htmlFor="lastName">Last Name</Label>
        <Input type="text" name="lastName" placeholder="Last Name" />
        <Label htmlFor="nickname">Nickname</Label>
        <Input type="text" name="nickname" placeholder="Nickname" />
        <Label htmlFor="portraitUrl">Member Picture</Label>
        <Input type="text" name="portraitUrl" placeholder="Url" />
        <div className="grid grid-cols-2 gap-4">
          <Link
            className="w-full flex items-center justify-center border border-primary/75 rounded hover:bg-primary/15 transition"
            href={`/admin/members`}>
            Cancel
          </Link>
          <SubmitButton className="font-semibold" formAction={addMemberAction}>
            Save
          </SubmitButton>
        </div>
        <FormMessage message={searchParams} />
      </form>
    </div>
  );
}

export default MembersAdminAdd;
