"use client";
import _, { set } from "lodash";
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
  ChevronDown,
  Loader2,
  Pencil,
  PlusCircle,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { calculateNLPIPoints } from "@/utils/nlpi-utils";
import { useToast } from "@/hooks/use-toast";
import { editSessionAction } from "@/components/admin/stats/actions/edit-session";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
  SelectItem,
} from "@/components/ui/select";
import { createPortal } from "react-dom";
import { Card } from "@/components/ui/card";

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
  const cashOutInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const buyInInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [currentSessions, setCurrentSessions] = useState<ExtendedCashSession[]>(
    []
  );
  const [editingSessions, setEditingSessions] = useState<ExtendedCashSession[]>(
    []
  );
  const [cashOutInputs, setCashOutInputs] = React.useState<
    Record<string, string>
  >({});
  const [buyInInputs, setBuyInInputs] = React.useState<Record<string, string>>(
    {}
  );
  const [sessionsToRemove, setSessionsToRemove] = useState<
    ExtendedCashSession[]
  >([]);

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState<boolean>(false);
  const [removeSessionId, setRemoveSessionId] = useState<string>("");
  const [hasEdits, setHasEdits] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = React.useState<
    string | PostgrestSingleResponse<null>[]
  >("");

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
    setEditingSessions(sortedSessions);
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      if (!_.isEqual(editingSessions, currentSessions)) {
        setHasEdits(true);
      } else {
        setHasEdits(false);
      }
    }
  }, [editingSessions, currentSessions, isMounted]);

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

  const saveEdits = async () => {
    const sortedSessions = [...editingSessions].sort((a, b) => {
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

    console.log("Sessions with points:", sessionsWithPoints);

    // try {
    //   setLoading(true);
    //   const result = await editSessionAction(
    //     sessionsWithPoints,
    //     sessionsToRemove
    //   );

    //   if (!result.success) {
    //     setError(result.message);
    //   } else {
    //     toast({
    //       title: "Sessions Edited Successfully",
    //     });
    //     setHasEdits(false);
    //     setLoading(false);
    //     setFormState({
    //       buy_in: 0,
    //       cash_out: 0,
    //       id: "",
    //       member_id: "",
    //       net_profit: 0,
    //       rebuys: 0,
    //       week_id: "",
    //       nlpi_points: 0,
    //       poy_points: 0,
    //       season_id: "",
    //     });
    //   }
    // } catch (error) {
    //   setError("Failed to add sessions");
    // } finally {
    //   setLoading(false);
    // }
  };
  return (
    <>
      <div className="flex mb-4 px-2 items-center justify-between">
        <h2 className="">
          Edit Sessions ({editingSessions.filter((s) => s.rebuys > 0).length})
        </h2>
        {hasEdits &&
          createPortal(
            <button
              style={{
                paddingBottom:
                  "calc(env(safe-area-inset-bottom, 0px) + 0.5rem + 79px)",
              }}
              onClick={saveEdits}
              className="flex fixed bottom-0 w-full text-sm pt-4 md:text-base items-center justify-center px-3 h-fit text-white bg-primary hover:bg-primary-hover font-bold">
              Save Edits
            </button>,
            document.body
          )}
      </div>
      <div className="relative px-2">
        <ul className="flex flex-col mb-8">
          {editingSessions.map((session, index) => {
            const originalSession = currentSessions.find(
              (s) => s.id === session.id
            );

            const isPlayedSession =
              originalSession && originalSession.rebuys > 0;

            const isEdited =
              session.buy_in !== originalSession?.buy_in ||
              session.cash_out !== originalSession?.cash_out ||
              session.rebuys !== originalSession?.rebuys ||
              session.net_profit !== originalSession?.net_profit;

            const isRemoved = sessionsToRemove.some((s) => s.id === session.id);

            const rawCashOut =
              cashOutInputs[session.member_id] ??
              session?.cash_out.toFixed(2).toString();

            const rawBuyIn =
              buyInInputs[session.member_id] ??
              session?.buy_in.toFixed(2).toString();

            return (
              <li
                className={cn("grid grid-cols-[min-content_1fr] pb-4 gap-6")}
                key={session.member_id + index}>
                {session.rebuys > 0 ? (
                  <Card
                    className={cn(
                      "col-span-2 relative flex flex-col items-center gap-2",
                      isEdited && !isRemoved && "bg-primary/15 border-primary",
                      isRemoved && "bg-red-500/15 border-red-600"
                    )}>
                    {isRemoved ? (
                      <button
                        onClick={() => {
                          setSessionsToRemove((prev) =>
                            prev.filter((s) => s.id !== session.id)
                          );

                          if (!originalSession) return;

                          setEditingSessions((prevSessions) =>
                            prevSessions.map((s) =>
                              s.id === session.id
                                ? {
                                    ...s,
                                    buy_in: originalSession.buy_in,
                                    cash_out: originalSession.cash_out,
                                    rebuys: originalSession.rebuys,
                                    net_profit: originalSession.net_profit,
                                    poy_points: originalSession.poy_points,
                                    nlpi_points: originalSession.nlpi_points,
                                  }
                                : s
                            )
                          );
                          setCashOutInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[session.member_id];
                            return updated;
                          });

                          setBuyInInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[session.member_id];
                            return updated;
                          });
                        }}
                        className="p-1 whitespace-nowrap absolute top-2 underline right-3">
                        Keep
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSessionsToRemove((prev) => [...prev, session]);
                          setEditingSessions((prevSessions) => {
                            const updatedSessions = prevSessions.map((s) =>
                              s.id === session.id
                                ? {
                                    ...s,
                                    buy_in: 0,
                                    cash_out: 0,
                                    rebuys: 0,
                                    net_profit: 0,
                                    nlpi_points: 0,
                                    poy_points: 0,
                                  }
                                : s
                            );
                            return updatedSessions;
                          });
                        }}
                        className="h-4 w-4 absolute top-3 right-4">
                        <X />
                      </button>
                    )}
                    {isEdited && !isRemoved && (
                      <button
                        onClick={() => {
                          if (!originalSession) return; // Safeguard

                          setEditingSessions((prevSessions) =>
                            prevSessions.map((s) =>
                              s.id === originalSession.id
                                ? {
                                    ...s,
                                    buy_in: originalSession.buy_in,
                                    cash_out: originalSession.cash_out,
                                    rebuys: originalSession.rebuys,
                                    net_profit: originalSession.net_profit,
                                  }
                                : s
                            )
                          );

                          setBuyInInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[session.member_id];
                            return updated;
                          });

                          setCashOutInputs((prev) => {
                            const updated = { ...prev };
                            delete updated[session.member_id];
                            return updated;
                          });
                        }}
                        className="p-2 absolute top-2 underline left-3">
                        Revert
                      </button>
                    )}
                    <h2 className="mb-2">
                      {session.member.first_name}{" "}
                      {session.member.last_name.slice(0, 1)}.
                    </h2>
                    <div className="grid grid-cols-4 w-full gap-2">
                      <span className="flex flex-col gap-1 justify-center w-full items-center">
                        <fieldset className="flex flex-col gap-2 w-full">
                          <Label
                            className="text-sm text-center text-neutral-400"
                            htmlFor={`buyIn-${session.member_id}`}>
                            Buy In
                          </Label>
                          <input
                            id={`buyIn-${session.member_id}`}
                            value={`$${rawBuyIn}`}
                            ref={(el) => {
                              buyInInputRefs.current[session.member_id] = el;
                            }}
                            disabled={isRemoved}
                            type="text"
                            inputMode="decimal"
                            onFocus={(e) => {
                              if (rawBuyIn === "0" || rawBuyIn === "0.00") {
                                setBuyInInputs((prev) => ({
                                  ...prev,
                                  [session.member_id]: "",
                                }));
                              }
                              requestAnimationFrame(() => {
                                const input =
                                  buyInInputRefs.current[session.member_id];
                                if (input) {
                                  const valueLength = input.value.length;
                                  input.setSelectionRange(
                                    valueLength,
                                    valueLength
                                  );
                                }
                              });
                            }}
                            onChange={(e) => {
                              let raw = e.target.value.replace(/^\$/, ""); // remove leading $
                              setBuyInInputs((prev) => ({
                                ...prev,
                                [session.member_id]: raw,
                              }));

                              if (/^\d*\.?\d*$/.test(raw)) {
                                const parsedBuyIn = parseFloat(raw);
                                if (!isNaN(parsedBuyIn)) {
                                  const parsedCashOut = parseFloat(
                                    cashOutInputs[session.member_id] ??
                                      session?.cash_out.toFixed(2).toString()
                                  );

                                  const newNetProfit =
                                    !isNaN(parsedCashOut) && !isNaN(parsedBuyIn)
                                      ? parsedCashOut - parsedBuyIn
                                      : 0;

                                  setEditingSessions((prevSessions) =>
                                    prevSessions.map((s) =>
                                      s.member_id === session.member_id
                                        ? {
                                            ...s,
                                            buy_in: parsedBuyIn,
                                            net_profit: newNetProfit,
                                          }
                                        : s
                                    )
                                  );
                                }
                              }
                            }}
                            onBlur={() => {
                              setBuyInInputs((prev) => ({
                                ...prev,
                                [session.member_id]: session.buy_in.toFixed(2),
                              }));
                            }}
                            className="h-fit p-0 disabled:line-through text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
                          />
                        </fieldset>
                      </span>
                      <span className="flex flex-col gap-1 items-center">
                        <fieldset className="flex flex-col gap-2 w-full">
                          <Label
                            className="text-sm text-center text-neutral-400"
                            htmlFor={`cashOut-${session.member_id}`}>
                            Cash Out
                          </Label>
                          <input
                            id={`cashOut-${session.member_id}`}
                            value={`$${rawCashOut}`}
                            type="text"
                            disabled={isRemoved}
                            ref={(el) => {
                              cashOutInputRefs.current[session.member_id] = el;
                            }}
                            inputMode="decimal"
                            onFocus={(e) => {
                              if (rawCashOut === "0" || rawCashOut === "0.00") {
                                setCashOutInputs((prev) => ({
                                  ...prev,
                                  [session.member_id]: "",
                                }));
                              }
                              requestAnimationFrame(() => {
                                const input =
                                  cashOutInputRefs.current[session.member_id];
                                if (input) {
                                  const valueLength = input.value.length;
                                  input.setSelectionRange(
                                    valueLength,
                                    valueLength
                                  );
                                }
                              });
                            }}
                            onChange={(e) => {
                              let raw = e.target.value.replace(/^\$/, ""); // remove leading $
                              setCashOutInputs((prev) => ({
                                ...prev,
                                [session.member_id]: raw,
                              }));

                              if (/^\d*\.?\d*$/.test(raw)) {
                                const parsedCashOut = parseFloat(raw);
                                if (!isNaN(parsedCashOut)) {
                                  const parsedBuyIn = parseFloat(
                                    buyInInputs[session.member_id] ??
                                      session?.buy_in.toFixed(2).toString()
                                  );

                                  const newNetProfit =
                                    !isNaN(parsedCashOut) && !isNaN(parsedBuyIn)
                                      ? parsedCashOut - parsedBuyIn
                                      : 0;

                                  setEditingSessions((prevSessions) =>
                                    prevSessions.map((s) =>
                                      s.member_id === session.member_id
                                        ? {
                                            ...s,
                                            cash_out: parsedCashOut,
                                            net_profit: newNetProfit,
                                          }
                                        : s
                                    )
                                  );
                                }
                              }
                            }}
                            onBlur={() => {
                              setCashOutInputs((prev) => ({
                                ...prev,
                                [session.member_id]:
                                  session.cash_out.toFixed(2),
                              }));
                            }}
                            className="h-fit disabled:line-through p-0 text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
                          />
                        </fieldset>
                      </span>

                      <span className="flex flex-col gap-1 justify-center w-full items-center">
                        <fieldset className="flex flex-col gap-2 w-full">
                          <Label
                            className="text-sm text-center text-neutral-400"
                            htmlFor={`rebuys-${session.member_id}`}>
                            Rebuys
                          </Label>
                          <Select
                            disabled={isRemoved}
                            value={session.rebuys.toString()}
                            onValueChange={(value) => {
                              setEditingSessions((prevSessions) =>
                                prevSessions.map((s) =>
                                  s.member_id === session.member_id
                                    ? { ...s, rebuys: parseFloat(value) }
                                    : s
                                )
                              );
                            }}>
                            <SelectTrigger
                              id={`rebuys-${session.member_id}`}
                              className="text-base gap-1 bg-transparent relative -top-[2px] text-white font-semibold py-0 h-fit border-none flex items-center justify-center">
                              <SelectValue className="text-base font-semibold text-white" />
                              <ChevronDown className="text-white pointer-events-none w-auto aspect-auto h-3/4 hover:text-primary-hover" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                {Array.from({ length: 11 }, (_, i) => (
                                  <SelectItem key={i} value={i.toString()}>
                                    {i}
                                  </SelectItem>
                                ))}
                              </SelectGroup>
                            </SelectContent>
                          </Select>
                        </fieldset>
                      </span>
                      <span className="flex flex-col gap-2 items-center">
                        <div className="flex flex-col gap-2 w-full">
                          <p className="text-sm text-neutral-400">Net Profit</p>
                          <p
                            className={cn(
                              "text-base font-semibold",
                              getProfitTextColor(session.net_profit),
                              isRemoved && "line-through opacity-25"
                            )}>
                            ${formatMoney(session.net_profit)}
                          </p>
                        </div>
                      </span>
                    </div>
                  </Card>
                ) : (
                  <Card className="p-0 w-full h-16 col-span-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        setEditingSessions((prev) =>
                          prev.map((s) =>
                            s.id === session.id
                              ? {
                                  ...s,
                                  buy_in: 25,
                                  cash_out: 0,
                                  rebuys: 1,
                                  net_profit: 0,
                                }
                              : s
                          )
                        );
                      }}
                      className="w-full h-full px-4 aspect-square flex items-center justify-between">
                      <h2 className="text-sm md:text-base whitespace-nowrap">
                        {session.member.first_name}{" "}
                        {session.member.last_name.slice(0, 1)}.
                      </h2>

                      <PlusCircle className="text-primary pointer-events-none w-6 h-6 hover:text-primary-hover" />
                    </button>
                  </Card>
                )}
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
