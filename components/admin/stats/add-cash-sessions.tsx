"use client";

import { CashSessionNoId, Member, Season, Week } from "@/utils/types";
import React from "react";
import { addSessionAction } from "./actions/add-session";
import Sessions from "./cash/sessions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircleIcon, ChevronDown, Loader2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateNLPIPoints } from "@/utils/nlpi-utils";
import { calculatePOYPoints, rankSessions } from "@/utils/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import useLocalStorageState from "@/hooks/use-local-storage";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";

interface Props {
  members: Member[];
  seasons: Season[];
  weeks: Week[];
}

function AddCashSessions({ members, seasons, weeks }: Props) {
  const db = createClient();
  const { toast } = useToast();
  const [selectedSeasonId, setSelectedSeasonId] = useLocalStorageState<
    string | null
  >("selectedSeasonId", null);
  const [selectedWeekId, setSelectedWeekId] = useLocalStorageState<
    string | null
  >("selectedWeekId", null);
  const [sessionsToAdd, setSessionsToAdd] = useLocalStorageState<
    CashSessionNoId[]
  >("sessionsToAdd", []);
  const [selectWeeks, setSelectWeeks] = useLocalStorageState<Week[]>(
    "selectWeeks",
    []
  );
  const selectedSeason = seasons.find((s) => s.id === selectedSeasonId) || null;
  const selectedWeek = weeks.find((w) => w.id === selectedWeekId) || null;
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [confirmAdd, setConfirmAdd] = React.useState<boolean>(false);
  const [finalSessions, setFinalSessions] = React.useState<CashSessionNoId[]>(
    []
  );
  const [usedWeekIds, setUsedWeekIds] = React.useState<string[]>([]);

  const removeSessionFromList = (index: number) => {
    const sessionToRemove = sessionsToAdd[index];

    const updatedSessionsToAdd = sessionsToAdd.filter((_, i) => i !== index);
    setSessionsToAdd(updatedSessionsToAdd);

    setFinalSessions((prev) =>
      prev.filter(
        (session) =>
          session.week_id !== sessionToRemove.week_id ||
          session.member_id !== sessionToRemove.member_id ||
          session.season_id !== sessionToRemove.season_id
      )
    );
  };

  const addSessions = async () => {
    const groupedSessions = sessionsToAdd.reduce<
      Record<string, CashSessionNoId[]>
    >((acc, session) => {
      const key = `${session.week_id}_${session.season_id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});

    let allNewSessions: CashSessionNoId[] = [];

    Object.entries(groupedSessions).forEach(([key, currentSessions]) => {
      const [week_id, season_id] = key.split("_");

      const memberIdsWithSessions = new Set(
        currentSessions.map((session) => session.member_id)
      );

      const missingSessions = members
        .filter((member) => !memberIdsWithSessions.has(member.id))
        .map((member) => ({
          buy_in: 0,
          cash_out: 0,
          net_profit: 0,
          rebuys: 0,
          week_id, // Current weekId
          season_id, // Current seasonId
          member_id: member.id,
          nlpi_points: 0,
          poy_points: 0,
        }));

      const sortedSessions = rankSessions(currentSessions);

      const sessionsWithPoints = sortedSessions.map((session) => ({
        buy_in: session.buy_in,
        cash_out: session.cash_out,
        net_profit: session.net_profit,
        rebuys: session.rebuys,
        week_id: session.week_id,
        season_id: session.season_id,
        member_id: session.member_id,
        nlpi_points: calculateNLPIPoints(session.rank!, session.net_profit),
        poy_points: calculatePOYPoints(session.net_profit),
      }));

      allNewSessions = [
        ...allNewSessions,
        ...sessionsWithPoints,
        ...missingSessions,
      ];
    });

    setFinalSessions((prev) => [...prev, ...allNewSessions]);

    const allSessions = [...finalSessions, ...allNewSessions];

    try {
      setLoading(true);
      const result = await addSessionAction(allSessions);

      if (!result.success) {
        setError(result.message);
      } else {
        toast({
          title: "Sessions Added Successfully",
        });
        resetLocalSessionData();
        setFinalSessions([]);
      }
    } catch (error) {
      setError("Failed to add sessions");
    } finally {
      setLoading(false);
    }
  };

  function resetLocalSessionData() {
    setSessionsToAdd([]);
    setSelectedSeasonId(null);
    setSelectedWeekId(null);
    setSelectWeeks([]);
  }

  const getSeasonWeeks = async (seasonId: string) => {
    const seasonWeeks = weeks.filter((w) => w.season_id === seasonId);
    const { data: sessions, error } = await db
      .from("cash_session")
      .select("week_id")
      .eq("season_id", seasonId);

    const usedIds = sessions?.map((s) => s.week_id) || [];
    const availableWeeks = seasonWeeks.filter((w) => !usedIds.includes(w.id));

    setUsedWeekIds(usedIds);
    setSelectWeeks(availableWeeks);
  };

  const addNewSession = (member: Member) => {
    const buyInAmount = member.first_name === "Josh" ? 50 : 25;

    setSessionsToAdd((prev) => [
      ...prev,
      {
        buy_in: buyInAmount,
        cash_out: 0,
        net_profit: 0,
        rebuys: 1,
        week_id: selectedWeek?.id || "",
        season_id: selectedSeason?.id || "",
        member_id: member.id,
        nlpi_points: 0,
        poy_points: 0,
      },
    ]);
  };

  const removeSession = (memberId: string) => {
    const sessionIndex = sessionsToAdd.findIndex(
      (session) => session.member_id === memberId
    );
    if (sessionIndex !== -1) {
      removeSessionFromList(sessionIndex);
    }
  };

  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) return null; // or a loading skeleton

  return (
    <>
      <h2 className="px-2 text-xl pb-4">
        Total Sessions ({sessionsToAdd.length})
      </h2>
      <div
        className={cn(
          "w-full px-2 mt-4 max-w-screen-lg mx-auto",
          sessionsToAdd?.length > 0 ? "pb-20" : ""
        )}>
        <form className="grid grid-cols-2 gap-4 mb-8">
          <fieldset className="flex flex-col  gap-2 grow">
            <Label className="text-xs md:text-base" htmlFor="season">
              Season
            </Label>
            <Select
              value={selectedSeasonId || ""}
              onValueChange={(value) => {
                setSelectedSeasonId(value);
                getSeasonWeeks(value);
              }}>
              <SelectTrigger id="season">
                <SelectValue placeholder="Select a season" />
                <ChevronDown className="text-white pointer-events-none w-auto aspect-auto h-3/4 hover:text-primary-hover" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {seasons?.map((season) => (
                    <SelectItem key={season.id} value={season.id}>
                      {season.year}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </fieldset>
          <fieldset className="flex flex-col  gap-2 grow">
            <Label className="text-xs md:text-base" htmlFor="week">
              Week
            </Label>
            <Select
              value={selectedWeekId || ""}
              onValueChange={(value) => setSelectedWeekId(value)}>
              <SelectTrigger disabled={!selectedSeason} id="week">
                <SelectValue placeholder="Select a week" />
                <ChevronDown className="text-white pointer-events-none w-auto aspect-auto h-3/4 hover:text-primary-hover" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {selectWeeks.map((week) => {
                    const isUsed = usedWeekIds.some((id) => id === week.id);
                    return (
                      <SelectItem
                        className={cn(isUsed && "text-muted")} // Add this line
                        disabled={isUsed}
                        key={week.id}
                        value={week.id}>
                        {week.week_number}
                      </SelectItem>
                    );
                  })}
                </SelectGroup>
              </SelectContent>
            </Select>
          </fieldset>
        </form>
        <div className="w-full relative">
          {(!selectedSeason || !selectedWeek) && (
            <span className="w-full h-full z-10 bg-black/50 absolute top-0 left-0 " />
          )}
          <Sessions
            removeSession={removeSession}
            setSessionsToAdd={setSessionsToAdd}
            addNewSession={addNewSession}
            sessionsToAdd={sessionsToAdd}
            members={members}
          />
        </div>
      </div>
      <AlertDialog
        open={confirmAdd}
        onOpenChange={() => setConfirmAdd(!confirmAdd)}>
        <AlertDialogContent className="w-[calc(100%-2rem)] max-w-md">
          <AlertCircleIcon className="w-16 h-16  mx-auto text-primary" />
          <AlertDialogTitle>Have you added every session?</AlertDialogTitle>
          <AlertDialogDescription>
            Make sure you have added every session before clicking yes.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>No Go Back</AlertDialogCancel>
            <AlertDialogAction
              className="bg-primary w-full mx-auto text-white"
              onClick={() => {
                setConfirmAdd(false);
                addSessions();
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
      {sessionsToAdd?.length > 0 &&
        createPortal(
          <button
            onClick={() => setConfirmAdd(true)}
            className="flex mt-auto relative bottom-12 w-full text-sm md:text-base items-center justify-center h-14 text-white bg-primary hover:bg-primary-hover font-medium">
            Add Sessions
          </button>,
          document.body
        )}
    </>
  );
}

export default AddCashSessions;
