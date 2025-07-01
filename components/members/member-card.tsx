import { Member } from "@/utils/types";
import { Loader2, User2 } from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { cn } from "@/lib/utils";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import MemberImage from "./member-image";

type MemberWithDebut = Member & {
  debutDate: string | null;
};

interface Props {
  member: MemberWithDebut;
  onEdit?: (id: string) => Promise<void>;
  onSave?: () => void;
  editId?: string | null;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  portraitUrl?: string;
  setFirstName?: (value: string) => void;
  setLastName?: (value: string) => void;
  setNickname?: (value: string) => void;
  setPortraitUrl?: (value: string) => void;
  allowEdit?: boolean;
  loading?: boolean;
}
function MemberCard({
  member,
  onEdit,
  onSave,
  editId,
  firstName,
  lastName,
  nickname,
  portraitUrl,
  setFirstName,
  setLastName,
  setNickname,
  setPortraitUrl,
  allowEdit = false,
  loading,
}: Props) {
  const debutDate = member.debutDate;

  return (
    <span
      className={cn(
        "flex flex-col justify-start gap-2 w-full",
        allowEdit ? "grid-cols-[80px_1fr_min-content]" : "grid-cols-[80px_1fr]"
      )}>
      <MemberImage
        className="w-full relative aspect-[6/7] rounded-[8px] overflow-hidden"
        imageClassName="object-cover absolute w-full h-full"
        src={member.portrait_url}
        alt={member.first_name + member.last_name}
      />

      <ul className="flex flex-col w-full justify-center gap-1">
        <li className="font-semibold">
          {member.first_name} {member.last_name}
        </li>
        <li className="text-muted text-sm">
          Joined:{" "}
          {new Date(debutDate ? debutDate : "").toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
          })}
        </li>
        <li className="text-muted text-sm">Nickname: {member.nickname}</li>
      </ul>
      {allowEdit && (
        <Dialog>
          <DialogTrigger asChild>
            <button
              onClick={() => {
                onEdit && onEdit(member.id);
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
                      onChange={(e) =>
                        setFirstName && setFirstName(e.target.value)
                      }
                      type="text"
                      name="firstName"
                      placeholder="First Name"
                    />
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) =>
                        setLastName && setLastName(e.target.value)
                      }
                      type="text"
                      name="lastName"
                      placeholder="Last Name"
                    />
                    <Label htmlFor="nickname">Nickname</Label>
                    <Input
                      onChange={(e) =>
                        setNickname && setNickname(e.target.value)
                      }
                      value={nickname}
                      type="text"
                      name="nickname"
                      placeholder="Nickname"
                    />
                    <Label htmlFor="portraitUrl">Member Picture</Label>
                    <Input
                      onChange={(e) =>
                        setPortraitUrl && setPortraitUrl(e.target.value)
                      }
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
                        onClick={onSave}>
                        Save
                      </DialogClose>
                    </div>
                  </form>
                )
              )}
            </DialogContent>
          </DialogPortal>
        </Dialog>
      )}
    </span>
  );
}

export default MemberCard;
