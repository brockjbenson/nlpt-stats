"use client";

import React from "react";
import { Input } from "../ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import MemberCard from "../members/member-card";

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
  const [membersList, setMembersList] =
    React.useState<Props["members"]>(members);
  const [firstName, setFirstName] = React.useState<string>("");
  const [lastName, setLastName] = React.useState<string>("");
  const [nickname, setNickname] = React.useState<string>("");
  const [portraitUrl, setPortraitUrl] = React.useState<string>("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [searchValue, setSearchValue] = React.useState<string>("");

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

  const doSearch = (value: string) => {
    setSearchValue(value);
    if (value === "") {
      setMembersList(members);
    } else {
      const filteredMembers = members.filter(
        (member) =>
          member.firstName.toLowerCase().includes(value.toLowerCase()) ||
          member.lastName.toLowerCase().includes(value.toLowerCase()) ||
          member.nickname.toLowerCase().includes(value.toLowerCase())
      );
      setMembersList(filteredMembers);
    }
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
    <div className="mb-12 flex flex-col mt-4 gap-4">
      <fieldset>
        <Input
          onChange={(e) => doSearch(e.target.value)}
          value={searchValue}
          className="w-full max-w-md"
          type="search"
          name="search"
          placeholder="Search"
          autoComplete="off"
        />
      </fieldset>
      <ul className="grid grid-cols-3 gap-x-12">
        {membersList.map((member) => (
          <li key={member.id}>
            <MemberCard
              member={member}
              onEdit={getMember}
              onSave={updateMember}
              loading={loading}
              firstName={firstName}
              setFirstName={setFirstName}
              lastName={lastName}
              setLastName={setLastName}
              nickname={nickname}
              setNickname={setNickname}
              portraitUrl={portraitUrl}
              setPortraitUrl={setPortraitUrl}
              editId={editId}
              allowEdit={true}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MembersList;
