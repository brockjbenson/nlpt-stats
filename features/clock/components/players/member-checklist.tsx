"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { MemberOption } from "@/features/clock/data/entrants";
import { Search } from "lucide-react";
import { useState } from "react";

type Props = {
  // Visible members, by name.
  members: MemberOption[];
  // Members already in the clock: ticked and disabled.
  playingIds: Set<string | null>;
  selectedIds: Set<string>;
  onToggle: (memberId: string, isChecked: boolean) => void;
};

function matches(member: MemberOption, search: string): boolean {
  const query = search.trim().toLocaleLowerCase();
  return `${member.first_name} ${member.last_name}`
    .toLocaleLowerCase()
    .includes(query);
}

// A searchable list of members to tick.
function MemberChecklist({
  members,
  playingIds,
  selectedIds,
  onToggle,
}: Props) {
  const [search, setSearch] = useState("");
  const shown = members.filter((member) => matches(member, search));

  return (
    <>
      <div className="relative">
        <Search
          size={16}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden
        />
        <Input
          aria-label="Search members"
          placeholder="Search members"
          className="pl-8"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>
      <ul className="max-h-[40dvh] overflow-y-auto rounded-md border">
        {shown.map((member) => {
          const isPlaying = playingIds.has(member.id);
          const id = `add-member-${member.id}`;
          return (
            <li key={member.id} className="border-b last:border-b-0">
              <label
                htmlFor={id}
                className="flex min-h-11 cursor-pointer items-center gap-3 px-3"
              >
                <Checkbox
                  id={id}
                  checked={isPlaying || selectedIds.has(member.id)}
                  disabled={isPlaying}
                  onCheckedChange={(checked) =>
                    onToggle(member.id, checked === true)
                  }
                />
                <span className={isPlaying ? "text-muted" : undefined}>
                  {member.first_name} {member.last_name}
                </span>
                {isPlaying && (
                  <span className="ml-auto text-xs text-muted">Playing</span>
                )}
              </label>
            </li>
          );
        })}
        {shown.length === 0 && (
          <li className="px-3 py-4 text-center text-sm text-muted">
            No members match.
          </li>
        )}
      </ul>
    </>
  );
}

export default MemberChecklist;
