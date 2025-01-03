import { editMemberAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/utils/supabase/client";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import React, { useEffect } from "react";

interface Props {
  id: string | null;
  setEditActive: React.Dispatch<React.SetStateAction<boolean>>;
}

function EditMember({ id, setEditActive }: Props) {
  const db = createClient();
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [nickname, setNickname] = React.useState<string>("");
  const [portraitUrl, setPortraitUrl] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);

  useEffect(() => {
    const getMember = async () => {
      setLoading(true);
      const { data, error } = await db.from("members").select("*").eq("id", id);

      if (error) {
        console.error(error.message);
        setError(error.message);
      }

      if (data) {
        setFirstName(data[0].firstName);
        setLastName(data[0].lastName);
        setNickname(data[0].nickname);
        setPortraitUrl(data[0].portraitUrl);
      }
      setLoading(false);
    };

    getMember();
  }, [id]);

  if (loading) {
    return <Loader2 className="w-8 mx-auto h-8 text-primary animate-spin" />;
  }

  return (
    <form className="w-full flex flex-col mt-8 gap-4 [&>input]:mb-4">
      <Input type="hidden" name="id" value={id ? id : ""} />
      <Label htmlFor="firstName">First Name</Label>
      <Input
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        type="text"
        name="firstName"
        placeholder="First Name"
      />
      <Label htmlFor="lastName">Last Name</Label>
      <Input
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        type="text"
        name="lastName"
        placeholder="Last Name"
      />
      <Label htmlFor="nickname">Nickname</Label>
      <Input
        onChange={(e) => setNickname(e.target.value)}
        value={nickname}
        type="text"
        name="nickname"
        placeholder="Nickname"
      />
      <Label htmlFor="portraitUrl">Member Picture</Label>
      <Input
        onChange={(e) => setPortraitUrl(e.target.value)}
        value={portraitUrl}
        type="text"
        name="portraitUrl"
        placeholder="Url"
      />
      <div className="grid grid-cols-2 gap-4">
        <Button
          className="w-full flex items-center justify-center border border-primary/75 rounded hover:bg-primary/15 transition"
          onClick={() => setEditActive(false)}>
          Cancel
        </Button>
        <SubmitButton className="font-semibold" formAction={editMemberAction}>
          Save
        </SubmitButton>
      </div>
    </form>
  );
}

export default EditMember;
