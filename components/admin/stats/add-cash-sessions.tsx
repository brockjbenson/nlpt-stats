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
import { calculatePOYPoints } from "@/utils/utils";

interface Props {
  members: Member[];
  seasons: Season[];
  weeks: Week[];
}

function AddCashSessions({ members, seasons, weeks }: Props) {
  const { toast } = useToast();
  const [sessionsToAdd, setSessionsToAdd] = React.useState<CashSessionNoId[]>(
    []
  );
  const [buyIn, setBuyIn] = React.useState<number>(25);
  const [cashOut, setCashOut] = React.useState<number>(0);
  const [netProfit, setNetProfit] = React.useState<number>(0);
  const [rebuys, setRebuys] = React.useState<number>(1);
  const [weekId, setWeekId] = React.useState<string>("");
  const [memberId, setMemberId] = React.useState<string>("");
  const [seasonId, setSeasonId] = React.useState<string>("");
  const [selectWeeks, setSelectWeeks] = React.useState<Week[]>([]);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | undefined>(undefined);
  const [confirmAdd, setConfirmAdd] = React.useState<boolean>(false);

  React.useEffect(() => {
    const savedSessions = localStorage.getItem("sessionsToAdd");
    if (savedSessions) {
      setSessionsToAdd(JSON.parse(savedSessions));
    }
  }, []);

  useEffect(() => {
    if (buyIn !== 0) {
      calculateNetProfit();
    }
  }, [buyIn, cashOut]);

  React.useEffect(() => {
    localStorage.setItem("sessionsToAdd", JSON.stringify(sessionsToAdd));
  }, [sessionsToAdd]);

  const calculateNetProfit = () => {
    const calculatedNetProfit = parseFloat((cashOut - buyIn).toFixed(2));

    setNetProfit(calculatedNetProfit);
  };

  const addSessionToList = () => {
    if (!memberId || !seasonId || !buyIn || !rebuys) {
      return;
    }
    const newSession: CashSessionNoId = {
      buyIn,
      cashOut,
      netProfit,
      rebuys,
      weekId,
      memberId,
      seasonId,
      nlpiPoints: 0,
      poyPoints: 0,
    };

    setSessionsToAdd([...sessionsToAdd, newSession]);
    setMemberId("");
    setBuyIn(25);
    setCashOut(0);
    setNetProfit(0);
    setRebuys(1);

    document.getElementById("buyIn")?.focus();
  };

  const removeSessionFromList = (index: number) => {
    const updatedSessions = sessionsToAdd.filter((_, i) => i !== index);
    setSessionsToAdd(updatedSessions);
  };

  const addSessions = async () => {
    const sortedSessions = [...sessionsToAdd].sort(
      (a, b) => b.netProfit - a.netProfit
    );

    // Add NLPI and POY points to each session based off of ranked net profit
    const sessionsWithPoints = sortedSessions.map((session, index) => ({
      ...session,
      nlpiPoints: calculateNLPIPoints(index, session.netProfit),
      poyPoints: calculatePOYPoints(index, session.netProfit),
    }));

    const memberIdsWithSessions = new Set(
      sortedSessions.map((session) => session.memberId)
    );

    // Find members without sessions
    const missingSessions = members
      .filter((member) => !memberIdsWithSessions.has(member.id))
      .map((member) => ({
        buyIn: 0,
        cashOut: 0,
        netProfit: 0,
        rebuys: 0,
        weekId: sessionsToAdd[0]?.weekId || "",
        seasonId: sessionsToAdd[0]?.seasonId || "",
        memberId: member.id,
        nlpiPoints: 0,
        poyPoints: 0,
      }));

    // Combine sessions with points and missing sessions
    const finalSessions = [...sessionsWithPoints, ...missingSessions];

    try {
      setLoading(true);
      const result = await addSessionAction(finalSessions);

      if (!result.success) {
        setError(result.message);
      } else {
        toast({
          title: "Sessions Added Successfully",
        });
        setSessionsToAdd([]);
        setMemberId("");
        setBuyIn(0);
        setCashOut(0);
        setNetProfit(0);
        setRebuys(0);
        setSeasonId("");
        setWeekId("");
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
      <div className="flex items-center justify-between">
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
            members={members}
            weeks={weeks}
            seasons={seasons}
          />
        )}

        <AddSessionForm
          members={members}
          seasons={seasons}
          weeks={weeks}
          selectWeeks={selectWeeks}
          setSelectWeeks={setSelectWeeks}
          addSessionToList={addSessionToList}
          buyIn={buyIn}
          cashOut={cashOut}
          netProfit={netProfit}
          rebuys={rebuys}
          setBuyIn={setBuyIn}
          setCashOut={setCashOut}
          setNetProfit={setNetProfit}
          setRebuys={setRebuys}
          setMemberId={setMemberId}
          setWeekId={setWeekId}
          setSeasonId={setSeasonId}
          weekId={weekId}
          seasonId={seasonId}
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
