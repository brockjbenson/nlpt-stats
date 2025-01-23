"use client";

import { CashSessionNoId, Member, Season, Week } from "@/utils/types";
import React, { useEffect } from "react";
import AddSessionForm from "./add-session-form";
import SessionsList from "./sessions-list";
import { addSessionAction } from "./actions/add-session";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertCircleIcon, Loader2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { calculateNLPIPoints } from "@/utils/nlpi-utils";
import { calculatePOYPoints, rankSessions } from "@/utils/utils";

interface Props {
  members: Member[];
  seasons: Season[];
  weeks: Week[];
}

function AddCashSessions({ members, seasons, weeks }: Props) {
  const { toast } = useToast();
  const buyInRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLDivElement>(null);
  const [sessionsToAdd, setSessionsToAdd] = React.useState<CashSessionNoId[]>(
    []
  );
  const databaseState = {
    members,
    seasons,
    weeks,
  };
  const [formState, setFormState] = React.useState({
    buyIn: 25,
    cashOut: 0,
    netProfit: 0,
    rebuys: 1,
    weekId: "",
    memberId: "",
    seasonId: "",
  });
  const [selectWeeks, setSelectWeeks] = React.useState<Week[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [confirmAdd, setConfirmAdd] = React.useState<boolean>(false);
  const [finalSessions, setFinalSessions] = React.useState<CashSessionNoId[]>(
    []
  );

  useEffect(() => {
    if (formState.buyIn !== 0) {
      calculateNetProfit();
    }
  }, [formState.cashOut, formState.buyIn]);

  useEffect(() => {
    window.onbeforeunload = () => true;
    return () => {
      window.onbeforeunload = null;
    };
  }, []);

  const handleFormChange = (field: string, value: string | number) => {
    setFormState((prevState) => {
      const updatedState = { ...prevState, [field]: value };

      return updatedState;
    });
  };

  const calculateNetProfit = () => {
    const calculatedNetProfit = parseFloat(
      (formState.cashOut - formState.buyIn).toFixed(2)
    );

    handleFormChange("netProfit", calculatedNetProfit);
  };

  const addSessionToList = () => {
    if (
      !formState.memberId ||
      !formState.seasonId ||
      !formState.buyIn ||
      !formState.rebuys
    ) {
      return;
    }

    const newSession: CashSessionNoId = {
      ...formState,
      nlpiPoints: 0,
      poyPoints: 0,
    };

    setSessionsToAdd([...sessionsToAdd, newSession]);
    setFormState({
      ...formState,
      memberId: "",
      buyIn: 25,
      cashOut: 0,
      netProfit: 0,
      rebuys: 1,
    });

    buyInRef.current?.focus();
    formRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const removeSessionFromList = (index: number) => {
    // Get the session being removed
    const sessionToRemove = sessionsToAdd[index];

    // Update sessionsToAdd
    const updatedSessionsToAdd = sessionsToAdd.filter((_, i) => i !== index);
    setSessionsToAdd(updatedSessionsToAdd);

    // Remove the session from finalSessions
    setFinalSessions((prev) =>
      prev.filter(
        (session) =>
          session.weekId !== sessionToRemove.weekId ||
          session.memberId !== sessionToRemove.memberId ||
          session.seasonId !== sessionToRemove.seasonId
      )
    );
  };

  const addSessions = async () => {
    // Group sessions by weekId and seasonId
    const groupedSessions = sessionsToAdd.reduce<
      Record<string, CashSessionNoId[]>
    >((acc, session) => {
      const key = `${session.weekId}_${session.seasonId}`; // Combine full UUIDs as-is
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});

    let allNewSessions: CashSessionNoId[] = [];

    // Iterate over each group of sessions
    Object.entries(groupedSessions).forEach(([key, currentSessions]) => {
      // Extract full UUIDs for weekId and seasonId from the key
      const [weekId, seasonId] = key.split("_"); // This keeps the UUIDs intact

      // Get member IDs that already have sessions for this week and season
      const memberIdsWithSessions = new Set(
        currentSessions.map((session) => session.memberId)
      );

      // Add missing sessions for members without entries in the current week and season
      const missingSessions = members
        .filter((member) => !memberIdsWithSessions.has(member.id))
        .map((member) => ({
          buyIn: 0,
          cashOut: 0,
          netProfit: 0,
          rebuys: 0,
          weekId, // Current weekId
          seasonId, // Current seasonId
          memberId: member.id,
          nlpiPoints: 0,
          poyPoints: 0,
        }));

      // Rank and calculate points for existing sessions
      const sortedSessions = rankSessions(currentSessions);

      const sessionsWithPoints = sortedSessions.map((session) => ({
        buyIn: session.buyIn,
        cashOut: session.cashOut,
        netProfit: session.netProfit,
        rebuys: session.rebuys,
        weekId: session.weekId,
        seasonId: session.seasonId,
        memberId: session.memberId,
        nlpiPoints: calculateNLPIPoints(session.rank!, session.netProfit),
        poyPoints: calculatePOYPoints(session.rank!, session.netProfit),
      }));

      // Combine the sessions with points and missing sessions
      allNewSessions = [
        ...allNewSessions,
        ...sessionsWithPoints,
        ...missingSessions,
      ];
    });

    // Update final sessions
    setFinalSessions((prev) => [...prev, ...allNewSessions]);

    const allSessions = [...finalSessions, ...allNewSessions];

    console.log(allSessions);

    try {
      setLoading(true);
      const result = await addSessionAction(allSessions);

      if (!result.success) {
        setError(result.message);
      } else {
        toast({
          title: "Sessions Added Successfully",
        });
        setSessionsToAdd([]);
        setFormState({
          ...formState,
          memberId: "",
          seasonId: "",
          weekId: "",
          buyIn: 25,
          cashOut: 0,
          netProfit: 0,
          rebuys: 1,
        });
        setFinalSessions([]);
        setSelectWeeks([]);
      }
    } catch (error) {
      setError("Failed to add sessions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex sticky max-w-screen-lg mx-auto top-[103px] py-4 bg-background z-10 items-center justify-between">
        <h2 className="text-base md:text-xl font-semibold">
          Add new cash sessions
        </h2>
        {sessionsToAdd.length > 0 && (
          <button
            onClick={() => setConfirmAdd(true)}
            className="flex items-center justify-center px-6 h-12 text-white bg-primary hover:bg-primary-hover rounded font-medium">
            Add Sessions
          </button>
        )}
      </div>
      <div className="w-full mt-8 max-w-screen-lg mx-auto">
        {sessionsToAdd.length > 0 && (
          <SessionsList
            sessionsToAdd={sessionsToAdd}
            removeSessionFromList={removeSessionFromList}
            databaseState={databaseState}
          />
        )}

        <AddSessionForm
          formRef={formRef}
          databaseState={databaseState}
          selectWeeks={selectWeeks}
          setSelectWeeks={setSelectWeeks}
          addSessionToList={addSessionToList}
          formState={formState}
          handleFormChange={handleFormChange}
          buyInRef={buyInRef}
        />
      </div>
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
                addSessions();
              }}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={error !== undefined}>
        <AlertDialogContent className="border-red-500">
          <XCircle className="w-16 h-16  mx-auto text-red-500" />
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

export default AddCashSessions;
