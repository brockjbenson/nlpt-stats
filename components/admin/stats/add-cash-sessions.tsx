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
    buy_in: 25,
    cash_out: 0,
    net_profit: 0,
    rebuys: 1,
    week_id: "",
    member_id: "",
    season_id: "",
  });
  const [selectWeeks, setSelectWeeks] = React.useState<Week[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [confirmAdd, setConfirmAdd] = React.useState<boolean>(false);
  const [finalSessions, setFinalSessions] = React.useState<CashSessionNoId[]>(
    []
  );

  useEffect(() => {
    if (formState.buy_in !== 0) {
      calculateNetProfit();
    }
  }, [formState.cash_out, formState.buy_in]);

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
      (formState.cash_out - formState.buy_in).toFixed(2)
    );

    handleFormChange("net_profit", calculatedNetProfit);
  };

  const addSessionToList = () => {
    if (
      !formState.member_id ||
      !formState.season_id ||
      !formState.buy_in ||
      !formState.rebuys
    ) {
      return;
    }

    const newSession: CashSessionNoId = {
      ...formState,
      nlpi_points: 0,
      poy_points: 0,
    };

    setSessionsToAdd([...sessionsToAdd, newSession]);
    setFormState({
      ...formState,
      member_id: "",
      buy_in: 25,
      cash_out: 0,
      net_profit: 0,
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
          session.week_id !== sessionToRemove.week_id ||
          session.member_id !== sessionToRemove.member_id ||
          session.season_id !== sessionToRemove.season_id
      )
    );
  };

  const addSessions = async () => {
    // Group sessions by weekId and seasonId
    const groupedSessions = sessionsToAdd.reduce<
      Record<string, CashSessionNoId[]>
    >((acc, session) => {
      const key = `${session.week_id}_${session.season_id}`; // Combine full UUIDs as-is
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});

    let allNewSessions: CashSessionNoId[] = [];

    // Iterate over each group of sessions
    Object.entries(groupedSessions).forEach(([key, currentSessions]) => {
      // Extract full UUIDs for weekId and seasonId from the key
      const [week_id, season_id] = key.split("_"); // This keeps the UUIDs intact

      // Get member IDs that already have sessions for this week and season
      const memberIdsWithSessions = new Set(
        currentSessions.map((session) => session.member_id)
      );

      // Add missing sessions for members without entries in the current week and season
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

      // Rank and calculate points for existing sessions
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
          member_id: "",
          season_id: "",
          week_id: "",
          buy_in: 25,
          cash_out: 0,
          net_profit: 0,
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
      <div className="flex sticky px-2 max-w-screen-lg mx-auto top-0 py-4 bg-background z-10 items-center justify-between">
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
      <div className="w-full px-2 mt-8 max-w-screen-lg mx-auto">
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

export default AddCashSessions;
