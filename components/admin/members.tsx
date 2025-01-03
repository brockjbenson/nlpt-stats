"use client";

import { Link, Loader2, User2 } from "lucide-react";
import Image from "next/image";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
  DialogOverlay,
  DialogClose,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface Props {
  members: {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string;
    portraitUrl: string;
  }[];
}

function MembersList({ members }: Props) {
  const db = createClient();
  const router = useRouter();
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [nickname, setNickname] = React.useState<string>("");
  const [portraitUrl, setPortraitUrl] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [editId, setEditId] = React.useState<string | null>(null);

  const getMember = async (id: string) => {
    setFirstName("");
    setLastName("");
    setNickname("");
    setPortraitUrl("");
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
      setEditId(id);
    }
    setLoading(false);
  };

  const updateMember = async () => {
    const { error } = await db
      .from("members")
      .update({ firstName, lastName, nickname, portraitUrl })
      .eq("id", editId);

    if (error) {
      setError(error.message);
    }

    router.refresh();
  };
  return (
    <ul className="grid grid-cols-3 gap-x-12  mb-12">
      {members.map((member) => (
        <li
          className="border-b border-neutral-400 grid grid-cols-[80px_1fr_min-content] gap-8 py-8"
          key={member.id}>
          {member.portraitUrl ? (
            <div className="rounded-full overflow-hidden w-20 h-20 flex items-center justify-center">
              <Image
                src={member.portraitUrl}
                alt={`${member.firstName}_${member.lastName}`}
                width={100}
                height={100}
              />
            </div>
          ) : (
            <div className="rounded-full bg-muted overflow-hidden w-20 h-20 flex items-center justify-center">
              <User2
                className="fill-muted-foreground relative top-3 w-28 h-28"
                stroke="neutral-500"
              />
            </div>
          )}
          <ul className="flex flex-col justify-center gap-2">
            <li className="flex gap-2">
              <span className="text-muted">Name:</span>
              <span>
                {member.firstName} {member.lastName}
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-muted">Nickname:</span>
              <span>{member.nickname}</span>
            </li>
          </ul>
          <Dialog>
            <DialogTrigger asChild>
              <button
                onClick={() => {
                  getMember(member.id);
                }}
                className="hover:text-primary hover:underline h-fit m-0 p-0 transition">
                Edit
              </button>
            </DialogTrigger>
            <DialogPortal>
              <DialogOverlay />
              <DialogContent className="w-full max-w-xl h-[582px]">
                <DialogTitle
                  className={cn(
                    loading ? "hidden" : "block",
                    "text-xl text-center"
                  )}>
                  Edit Member
                </DialogTitle>
                {loading ? (
                  <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                  </div>
                ) : (
                  editId && (
                    <form className="w-full flex flex-col mt-8 gap-4 [&>input]:mb-4">
                      <Input type="hidden" name="id" value={editId} />
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
                        <DialogClose asChild>
                          <button className="w-full flex items-center justify-center border border-primary/75 rounded hover:bg-primary/15 transition">
                            Cancel
                          </button>
                        </DialogClose>
                        <DialogClose
                          className="bg-primary hover:bg-primary-hover h-12 rounded text-background font-semibold"
                          type="submit"
                          onClick={updateMember}>
                          Save
                        </DialogClose>
                      </div>
                    </form>
                  )
                )}
              </DialogContent>
            </DialogPortal>
          </Dialog>
        </li>
      ))}
    </ul>
  );
}

export default MembersList;
