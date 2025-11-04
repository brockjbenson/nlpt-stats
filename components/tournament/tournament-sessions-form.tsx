"use client";

import { Member, Tournament } from "@/utils/types";
import React, { useRef } from "react";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { assignTournamentSessionPoints } from "@/utils/tournament/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  AlertCircleIcon,
  ChevronDown,
  Loader2,
  PlusCircle,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { addTournamentSessionAction } from "../admin/stats/actions/add-session";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import useLocalStorageState from "@/hooks/use-local-storage";

interface Props {
  tournament: Tournament;
  members: Member[];
}

interface SessionNoId {
  buy_in: number;
  cash_out: number;
  net_profit: number;
  rebuys: number;
  tournament_id: string;
  member_id: string;
  place: number;
  nlpi_points: number;
  poy_points: number;
}

function TournamentSessionsForm({ tournament, members }: Props) {
  const [isHydrated, setIsHydrated] = React.useState(false);
  const cashOutInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const buyInInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const placeInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [sessionsToAdd, setSessionsToAdd] = useLocalStorageState<SessionNoId[]>(
    "tournamentSessionsToAdd",
    []
  );
  const [cashOutInputs, setCashOutInputs] = React.useState<
    Record<string, string>
  >({});
  const [buyInInputs, setBuyInInputs] = React.useState<Record<string, string>>(
    {}
  );
  const [placeInputs, setPlaceInputs] = React.useState<Record<string, string>>(
    {}
  );

  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [confirmAdd, setConfirmAdd] = React.useState<boolean>(false);

  const handleAddAllSessions = async () => {
    const sessionsWithPOints = assignTournamentSessionPoints(sessionsToAdd);

    const membersWithMissingSessions = members.filter((member) => {
      return !sessionsWithPOints.some(
        (session) => session.member_id === member.id
      );
    });

    const emptySessions = membersWithMissingSessions.map((member) => ({
      buy_in: 0,
      cash_out: 0,
      net_profit: 0,
      rebuys: 0,
      tournament_id: tournament.id,
      member_id: member.id,
      place: 0,
      nlpi_points: 0,
      poy_points: 0,
    }));

    const allSessions = [...sessionsWithPOints, ...emptySessions];

    try {
      setLoading(true);
      const result = await addTournamentSessionAction(allSessions);

      if (!result.success) {
        setError(result.message);
      } else {
        toast({
          title: "Sessions Added Successfully",
        });
        setSessionsToAdd([]);
      }
    } catch (error) {
      setError("Failed to add sessions");
    } finally {
      setLoading(false);
    }
  };

  const addNewSession = (member: Member) => {
    setSessionsToAdd((prev) => [
      ...prev,
      {
        buy_in: 40,
        cash_out: 0,
        net_profit: 0,
        rebuys: 0,
        tournament_id: tournament.id,
        member_id: member.id,
        place: 0,
        nlpi_points: 0,
        poy_points: 0,
      },
    ]);
  };

  const removeSession = (memberId: string) => {
    setSessionsToAdd((prev) =>
      prev.filter((session) => session.member_id !== memberId)
    );
    setCashOutInputs({});
    setBuyInInputs({});
    setPlaceInputs({});
  };

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null; // or a loading skeleton

  return (
    <>
      {sessionsToAdd?.length > 0 &&
        createPortal(
          <div
            className="flex items-center justify-center border-t-muted backdrop-blur-md fixed bottom-0 w-full"
            style={{
              paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 70px)",
            }}>
            <button
              onClick={() => setConfirmAdd(true)}
              className="flex w-full text-sm md:text-base items-center justify-center px-3 h-12 text-white bg-primary hover:bg-primary-hover font-medium">
              Add Sessions
            </button>
          </div>,
          document.body
        )}
      <ul className="flex flex-col mb-8">
        {members.map((member) => {
          const correspondingSession = sessionsToAdd.find(
            (session) => session.member_id === member.id
          );
          const rawCashOut =
            cashOutInputs[member.id] ??
            correspondingSession?.cash_out.toFixed(2).toString();

          const rawBuyIn =
            buyInInputs[member.id] ??
            correspondingSession?.buy_in.toFixed(2).toString();
          const rawPlace =
            placeInputs[member.id] ?? correspondingSession?.place.toString();
          return (
            <li
              className="grid py-4 border-b border-neutral-600 first:border-t grid-cols-[min-content_1fr] gap-6"
              key={member.id}>
              {correspondingSession ? (
                <>
                  <div className="col-span-2 relative flex flex-col items-center gap-2">
                    <button
                      onClick={() => removeSession(member.id)}
                      className="h-4 w-4 absolute top-0 right-3">
                      <X />
                    </button>
                    <h2 className="mb-2">
                      {member.first_name} {member.last_name.slice(0, 1)}.
                    </h2>
                    <div className="grid grid-cols-5 w-full gap-2">
                      <span className="flex flex-col gap-1 justify-center w-full items-center">
                        <fieldset className="flex flex-col gap-2 w-full">
                          <Label
                            className="text-sm text-center text-neutral-400"
                            htmlFor={`buyIn-${member.id}`}>
                            Buy In
                          </Label>
                          <input
                            id={`buyIn-${member.id}`}
                            value={`$${rawBuyIn}`}
                            ref={(el) => {
                              buyInInputRefs.current[member.id] = el;
                            }}
                            type="text"
                            inputMode="decimal"
                            onFocus={(e) => {
                              if (rawBuyIn === "0" || rawBuyIn === "0.00") {
                                setBuyInInputs((prev) => ({
                                  ...prev,
                                  [member.id]: "",
                                }));
                              }
                              requestAnimationFrame(() => {
                                const input = buyInInputRefs.current[member.id];
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
                                [member.id]: raw,
                              }));

                              if (/^\d*\.?\d*$/.test(raw)) {
                                const parsedBuyIn = parseFloat(raw);
                                if (!isNaN(parsedBuyIn)) {
                                  const parsedCashOut = parseFloat(
                                    cashOutInputs[member.id] ??
                                      correspondingSession?.cash_out
                                        .toFixed(2)
                                        .toString()
                                  );

                                  const newNetProfit =
                                    !isNaN(parsedCashOut) && !isNaN(parsedBuyIn)
                                      ? parsedCashOut - parsedBuyIn
                                      : 0;

                                  setSessionsToAdd((prevSessions) =>
                                    prevSessions.map((session) =>
                                      session.member_id === member.id
                                        ? {
                                            ...session,
                                            buy_in: parsedBuyIn,
                                            net_profit: newNetProfit,
                                          }
                                        : session
                                    )
                                  );
                                }
                              }
                            }}
                            onBlur={() => {
                              setBuyInInputs((prev) => ({
                                ...prev,
                                [member.id]:
                                  correspondingSession.buy_in.toFixed(2),
                              }));
                            }}
                            className="h-fit p-0 text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
                          />
                        </fieldset>
                      </span>
                      <span className="flex flex-col gap-1 items-center">
                        <fieldset className="flex flex-col gap-2 w-full">
                          <Label
                            className="text-sm text-center text-neutral-400"
                            htmlFor={`cashOut-${member.id}`}>
                            Cash Out
                          </Label>
                          <input
                            id={`cashOut-${member.id}`}
                            value={`$${rawCashOut}`}
                            type="text"
                            ref={(el) => {
                              cashOutInputRefs.current[member.id] = el;
                            }}
                            inputMode="decimal"
                            onFocus={(e) => {
                              if (rawCashOut === "0" || rawCashOut === "0.00") {
                                setCashOutInputs((prev) => ({
                                  ...prev,
                                  [member.id]: "",
                                }));
                              }
                              requestAnimationFrame(() => {
                                const input =
                                  cashOutInputRefs.current[member.id];
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
                                [member.id]: raw,
                              }));

                              if (/^\d*\.?\d*$/.test(raw)) {
                                const parsedCashOut = parseFloat(raw);
                                if (!isNaN(parsedCashOut)) {
                                  const parsedBuyIn = parseFloat(
                                    buyInInputs[member.id] ??
                                      correspondingSession?.buy_in
                                        .toFixed(2)
                                        .toString()
                                  );

                                  const newNetProfit =
                                    !isNaN(parsedCashOut) && !isNaN(parsedBuyIn)
                                      ? parsedCashOut - parsedBuyIn
                                      : 0;

                                  setSessionsToAdd((prevSessions) =>
                                    prevSessions.map((session) =>
                                      session.member_id === member.id
                                        ? {
                                            ...session,
                                            cash_out: parsedCashOut,
                                            net_profit: newNetProfit,
                                          }
                                        : session
                                    )
                                  );
                                }
                              }
                            }}
                            onBlur={() => {
                              setCashOutInputs((prev) => ({
                                ...prev,
                                [member.id]:
                                  correspondingSession.cash_out.toFixed(2),
                              }));
                            }}
                            className="h-fit p-0 text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
                          />
                        </fieldset>
                      </span>
                      <span className="flex flex-col gap-1 justify-center w-full items-center">
                        <fieldset className="flex flex-col gap-2 w-full">
                          <Label
                            className="text-sm text-center text-neutral-400"
                            htmlFor={`rebuys-${member.id}`}>
                            Rebuys
                          </Label>
                          <Select
                            value={correspondingSession.rebuys.toString()}
                            onValueChange={(value) => {
                              setSessionsToAdd((prevSessions) =>
                                prevSessions.map((session) =>
                                  session.member_id === member.id
                                    ? { ...session, rebuys: parseFloat(value) }
                                    : session
                                )
                              );
                            }}>
                            <SelectTrigger
                              id={`rebuys-${member.id}`}
                              className="text-base gap-1 relative -top-[2px] text-white font-semibold py-0 h-fit border-none flex items-center justify-center">
                              <SelectValue className="text-base font-semibold text-white" />
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
                      <span className="flex flex-col gap-1 justify-center w-full items-center">
                        <fieldset className="flex flex-col gap-2 w-full">
                          <Label
                            className="text-sm text-center text-neutral-400"
                            htmlFor={`place-${member.id}`}>
                            Place
                          </Label>
                          <input
                            id={`place-${member.id}`}
                            value={rawPlace}
                            type="text"
                            step="1"
                            ref={(el) => {
                              placeInputRefs.current[member.id] = el;
                            }}
                            inputMode="numeric"
                            onFocus={(e) => {
                              if (
                                placeInputs[member.id] === "0" ||
                                !placeInputs[member.id]
                              ) {
                                setPlaceInputs((prev) => ({
                                  ...prev,
                                  [member.id]: "",
                                }));
                              }
                              requestAnimationFrame(() => {
                                const input = placeInputRefs.current[member.id];
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
                              const value = e.target.value;

                              // Update the rawPlace so the input re-renders with new value
                              setPlaceInputs((prev) => ({
                                ...prev,
                                [member.id]: value,
                              }));

                              const intValue = parseInt(value);
                              if (!isNaN(intValue)) {
                                setSessionsToAdd((prevSessions) =>
                                  prevSessions.map((session) =>
                                    session.member_id === member.id
                                      ? { ...session, place: intValue }
                                      : session
                                  )
                                );
                              }
                            }}
                            onBlur={() => {
                              // reset to "0" if the input is empty or not a number
                              if (
                                !placeInputs[member.id] ||
                                isNaN(parseInt(placeInputs[member.id]))
                              ) {
                                setPlaceInputs((prev) => ({
                                  ...prev,
                                  [member.id]: "0",
                                }));
                              }
                            }}
                            className="h-fit p-0 text-center w-full outline-none ring-none bg-transparent border-b rounded-none text-base border-transparent focus:border-primary font-semibold text-white"
                          />
                        </fieldset>
                      </span>
                      <span className="flex flex-col gap-2 items-center">
                        <div className="flex flex-col gap-2 w-full">
                          <p className="text-sm text-neutral-400">Net Profit</p>
                          <p
                            className={cn(
                              "text-base font-semibold",
                              getProfitTextColor(
                                correspondingSession.net_profit
                              )
                            )}>
                            ${formatMoney(correspondingSession.net_profit)}
                          </p>
                        </div>
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      addNewSession(member);
                    }}
                    className="w-full h-10 col-span-2 aspect-square flex items-center justify-between">
                    <h2 className="text-sm md:text-base whitespace-nowrap">
                      {member.first_name} {member.last_name.slice(0, 1)}.
                    </h2>

                    <PlusCircle className="text-primary pointer-events-none w-6 h-6 hover:text-primary-hover" />
                  </button>
                </>
              )}
            </li>
          );
        })}
      </ul>
      <AlertDialog
        open={confirmAdd}
        onOpenChange={() => setConfirmAdd(!confirmAdd)}>
        <AlertDialogContent>
          <AlertCircleIcon className="w-16 h-16  mx-auto text-primary" />
          <AlertDialogTitle>Have you added every session?</AlertDialogTitle>
          <AlertDialogDescription>
            Make sure you have added every session before clicking yes.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>No Go Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary px-12 mx-auto text-white"
              onClick={() => {
                setConfirmAdd(false);
                handleAddAllSessions();
              }}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={error !== undefined}>
        <AlertDialogContent className="border-red-500">
          <XCircle className="w-16 h-16  mx-auto text-theme-red" />
          <AlertDialogTitle>Error Adding Sessions</AlertDialogTitle>
          <AlertDialogDescription>{error}</AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogAction
              className="bg-muted px-12 mx-auto text-white"
              onClick={() => setError(undefined)}>
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

export default TournamentSessionsForm;
