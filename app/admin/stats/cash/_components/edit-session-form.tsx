"use client";
import _ from "lodash";
import MemberImage from "@/components/members/member-image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { CashSession, Member, Season, Week } from "@/utils/types";
import {
  calculatePOYPoints,
  formatMoney,
  getProfitTextColor,
} from "@/utils/utils";
import { DialogTrigger } from "@radix-ui/react-dialog";
import {
  AlertCircleIcon,
  Check,
  Loader2,
  Pencil,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { calculateNLPIPoints } from "@/utils/nlpi-utils";
import { useToast } from "@/hooks/use-toast";
import { editSessionAction } from "@/components/admin/stats/actions/edit-session";
import { PostgrestSingleResponse } from "@supabase/supabase-js";

interface ExtendedCashSession extends CashSession {
  member: Member;
  season: Season;
  week: Week;
}

interface Props {
  sessions: ExtendedCashSession[];
}

function EditSessionForm({ sessions }: Props) {
  const { toast } = useToast();
  const [currentSessions, setCurrentSessions] = useState<ExtendedCashSession[]>(
    []
  );
  const [sessionsToRemove, setSessionsToRemove] = useState<
    ExtendedCashSession[]
  >([]);
  const [editedSessionIds, setEditedSessionIds] = useState<string[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [removeSessionId, setRemoveSessionId] = useState<string>("");
  const [hasEdits, setHasEdits] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = React.useState<
    string | PostgrestSingleResponse<null>[]
  >("");
  const [formState, setFormState] = useState<CashSession>({
    buy_in: 0,
    cash_out: 0,
    id: "",
    member_id: "",
    net_profit: 0,
    rebuys: 0,
    week_id: "",
    nlpi_points: 0,
    poy_points: 0,
    season_id: "",
  });

  useEffect(() => {
    const sortedSessions = [...sessions].sort((a, b) => {
      if (a.rebuys > 0 && b.rebuys === 0) return -1;
      if (a.rebuys === 0 && b.rebuys > 0) return 1;

      if (a.rebuys > 0 && b.rebuys > 0) {
        return b.net_profit - a.net_profit;
      }

      return 0;
    });
    setCurrentSessions(sortedSessions);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !_.isEqual(sessions, currentSessions)) {
      setHasEdits(true);
    }
  }, [sessions, currentSessions, isMounted]);

  const removeSession = () => {
    setSessionsToRemove((prev) => {
      const sessionToRemove = currentSessions.find(
        (session) => session.id === removeSessionId
      );
      return sessionToRemove ? [...prev, sessionToRemove] : prev; // Only add if found
    });

    setCurrentSessions((prev) =>
      prev.filter((session) => session.id !== removeSessionId)
    );
  };

  const saveSessionEdit = (member: Member, week: Week, season: Season) => {
    const updatedSessions = currentSessions.map((session) => {
      if (session.id === formState.id) {
        return {
          ...formState,
          member,
          week,
          season,
        };
      }
      return session;
    });
    setCurrentSessions(updatedSessions);
    setFormState({
      buy_in: 0,
      cash_out: 0,
      id: "",
      member_id: "",
      net_profit: 0,
      rebuys: 0,
      week_id: "",
      nlpi_points: 0,
      poy_points: 0,
      season_id: "",
    });
  };

  const saveEdits = async () => {
    const sortedSessions = [...currentSessions].sort((a, b) => {
      if (a.rebuys > 0 && b.rebuys === 0) return -1;
      if (a.rebuys === 0 && b.rebuys > 0) return 1;

      if (a.rebuys > 0 && b.rebuys > 0) {
        return b.net_profit - a.net_profit;
      }

      return 0;
    });

    const sessionsWithPoints = sortedSessions.map((session, index) => ({
      id: session.id,
      buy_in: session.buy_in,
      cash_out: session.cash_out,
      net_profit: session.net_profit,
      rebuys: session.rebuys,
      week_id: session.week_id,
      season_id: session.season_id,
      member_id: session.member_id,
      nlpi_points:
        session.rebuys === 0
          ? 0
          : calculateNLPIPoints(index + 1, session.net_profit),
      poy_points:
        session.rebuys === 0 ? 0 : calculatePOYPoints(session.net_profit),
    }));

    try {
      setLoading(true);
      const result = await editSessionAction(
        sessionsWithPoints,
        sessionsToRemove
      );

      if (!result.success) {
        setError(result.message);
      } else {
        toast({
          title: "Sessions Edited Successfully",
        });
        setHasEdits(false);
        setEditedSessionIds([]);
        setLoading(false);
        setFormState({
          buy_in: 0,
          cash_out: 0,
          id: "",
          member_id: "",
          net_profit: 0,
          rebuys: 0,
          week_id: "",
          nlpi_points: 0,
          poy_points: 0,
          season_id: "",
        });
      }
    } catch (error) {
      setError("Failed to add sessions");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <div className="flex mb-4 px-2 items-center justify-between">
        <h2 className="">Edit Sessions ({currentSessions.length})</h2>
        {hasEdits && (
          <Button
            onClick={saveEdits}
            className="w-fit px-3 py-2 font-semibold"
            variant={"default"}>
            Save Edits
          </Button>
        )}
      </div>
      <div className="relative px-2">
        <ul className="flex flex-col m-0 pb-12 w-full">
          {currentSessions.map((session, index) => {
            const isEdited = editedSessionIds.includes(session.id);
            console.log("isEdited", isEdited);

            return (
              <li
                className={cn(
                  "w-full py-4 border-b border-muted first:border-t grid grid-cols-[1fr_min-content] gap-2",
                  isEdited ? "bg-primary/25" : ""
                )}
                key={session.member_id + index}>
                <div className="flex items-center gap-2">
                  <MemberImage
                    className="w-12 h-auto aspect-square"
                    src={session.member.portrait_url}
                    alt={`${session.member.first_name}_${session.member.last_name}`}
                  />
                  <h2 className="text-base md:text-2xl font-semibold flex md:flex-col gap-1">
                    <span>{session.member.first_name}</span>
                    <span>{session.member.last_name}</span>
                  </h2>
                </div>
                <div className="w-full col-span-2 grid grid-cols-6 gap-2">
                  <span className="flex flex-col gap-1 items-start">
                    <span className="text-xs md:text-sm">Net Profit</span>
                    <p
                      className={cn(
                        "text-base md:text-lg font-semibold",
                        getProfitTextColor(session.net_profit)
                      )}>
                      {formatMoney(session.net_profit)}
                    </p>
                  </span>
                  <span className="flex flex-col gap-1 items-center">
                    <span className="text-xs md:text-sm">Buy In</span>
                    <p className={cn("text-base md:text-lg font-semibold")}>
                      {formatMoney(session.buy_in)}
                    </p>
                  </span>
                  <span className="flex flex-col gap-1 items-center">
                    <span className="text-xs md:text-sm">Cash Out</span>
                    <p className={cn("text-base md:text-lg font-semibold")}>
                      {formatMoney(session.cash_out)}
                    </p>
                  </span>
                  <span className="flex flex-col gap-1 items-center">
                    <span className="text-xs md:text-sm">Rebuys</span>
                    <p className={cn("text-base md:text-lg font-semibold")}>
                      {session.rebuys}
                    </p>
                  </span>

                  <span className="flex flex-col gap-1 items-center">
                    <span className="text-xs md:text-sm">Season</span>
                    <p className={cn("text-base md:text-lg font-semibold")}>
                      {session.season.year}
                    </p>
                  </span>
                  <span className="flex flex-col gap-1 items-end">
                    <span className="text-xs md:text-sm">Week</span>
                    <p className={cn("text-base md:text-lg font-semibold")}>
                      {session.week.week_number}
                    </p>
                  </span>
                </div>
                <div className="flex col-span-1 col-start-2 row-start-1 items-center gap-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <button
                        onClick={() => {
                          setFormState(session);
                        }}
                        title="Edit Session"
                        className={cn(
                          "w-6 group h-auto aspect-square my-auto flex items-center justify-center border border-transparent rounded-full"
                        )}>
                        <Pencil className={cn("w-4 h-4 text-white")} />
                      </button>
                    </DialogTrigger>
                    <DialogContent className="w-full">
                      <DialogTitle>Edit Session</DialogTitle>

                      <div className="flex mt-4 flex-col gap-4">
                        <fieldset className="flex flex-col gap-2 items-start">
                          <Label
                            htmlFor="buy_in"
                            className="text-xs md:text-sm">
                            Buy In
                          </Label>
                          <Input
                            id="buy_in"
                            type="number"
                            value={formState.buy_in}
                            onChange={(e) => {
                              setFormState({
                                ...formState,
                                buy_in: Number(e.target.value),
                                net_profit:
                                  formState.cash_out - Number(e.target.value),
                              });
                            }}
                            className={cn("text-base md:text-lg font-semibold")}
                          />
                        </fieldset>
                        <fieldset className="flex flex-col gap-2 items-start">
                          <Label className="text-xs md:text-sm">Cash Out</Label>
                          <Input
                            id="buy_in"
                            type="number"
                            value={formState.cash_out}
                            onChange={(e) => {
                              setFormState({
                                ...formState,
                                cash_out: Number(e.target.value),
                                net_profit:
                                  Number(e.target.value) - formState.buy_in,
                              });
                            }}
                            className={cn("text-base md:text-lg font-semibold")}
                          />
                        </fieldset>
                        <fieldset className="flex flex-col gap-2 items-start">
                          <Label className="text-xs md:text-sm">
                            Net Profit
                          </Label>
                          <Input
                            id="buy_in"
                            type="number"
                            value={formState.net_profit}
                            readOnly
                            className={cn("text-base md:text-lg font-semibold")}
                          />
                        </fieldset>
                        <fieldset className="flex flex-col gap-2 items-start">
                          <Label className="text-xs md:text-sm">Rebuys</Label>
                          <Input
                            id="buy_in"
                            type="number"
                            value={formState.rebuys}
                            onChange={(e) => {
                              setFormState({
                                ...formState,
                                rebuys: Number(e.target.value),
                              });
                            }}
                            className={cn("text-base md:text-lg font-semibold")}
                          />
                        </fieldset>
                        <div className="grid grid-cols-2 gap-4">
                          <DialogClose
                            className="bg-muted h-12 text-white rounded"
                            onClick={() => {
                              setFormState({
                                buy_in: 0,
                                cash_out: 0,
                                id: "",
                                member_id: "",
                                net_profit: 0,
                                rebuys: 0,
                                week_id: "",
                                nlpi_points: 0,
                                poy_points: 0,
                                season_id: "",
                              });
                            }}>
                            Cancel
                          </DialogClose>
                          <DialogClose
                            className="bg-primary h-12 text-white rounded"
                            onClick={() => {
                              saveSessionEdit(
                                session.member,
                                session.week,
                                session.season
                              );
                              setEditedSessionIds((prev) => [
                                ...prev,
                                session.id,
                              ]);
                            }}>
                            Save
                          </DialogClose>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <button
                    onClick={() => {
                      setConfirmDeleteOpen(true);
                      setRemoveSessionId(session.id);
                    }}
                    title="Remove Session"
                    className="w-6 group h-auto aspect-square my-auto flex items-center justify-center border border-transparent hover:border-primary rounded-full">
                    <X className="w-5 h-5 group-hover:text-primary" />
                  </button>{" "}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <AlertDialog
        open={confirmDeleteOpen}
        onOpenChange={() => setConfirmDeleteOpen(!confirmDeleteOpen)}>
        <AlertDialogContent>
          <AlertCircleIcon className="w-16 h-16  mx-auto text-primary" />
          <AlertDialogTitle>
            Are you sure you want to remove this session?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This session will be permanently removed and not able to be
            recovered once deleted. This will also change the NLPI and POY
            points for the rest of the sessions.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary px-8 text-white"
              onClick={() => {
                setConfirmDeleteOpen(false);
                removeSession();
              }}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={
          !!error &&
          (typeof error === "string" ? error.trim() !== "" : error.length > 0)
        }>
        <AlertDialogContent className="border-red-500">
          <XCircle className="w-16 h-16  mx-auto text-theme-red" />
          <AlertDialogTitle>Error Saving Session Edits</AlertDialogTitle>
          <AlertDialogDescription>
            {typeof error === "string" ? error : JSON.stringify(error)}
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-muted px-12 mx-auto text-white"
              onClick={() => setError("")}>
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {loading && (
        <div className="fixed w-screen h-screen top-0 left-0 flex items-center justify-center inset-0 bg-black bg-opacity-50">
          <Loader2 className="animate-spin w-16 h-16 text-primary" />
        </div>
      )}
    </>
  );
}

export default EditSessionForm;
