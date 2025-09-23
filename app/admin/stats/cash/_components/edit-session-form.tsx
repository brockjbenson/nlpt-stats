"use client";
import _ from "lodash";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CashSession, Member, Season, Week } from "@/utils/types";
import { calculatePOYPoints } from "@/utils/utils";
import { Loader2, XCircle } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { calculateNLPIPoints } from "@/utils/nlpi-utils";
import { useToast } from "@/hooks/use-toast";
import { editSessionAction } from "@/components/admin/stats/actions/edit-session";
import { PostgrestSingleResponse } from "@supabase/supabase-js";
import { createPortal } from "react-dom";
import EditedSession from "./edited-session";
import RemovedSession from "./removed-session";
import OriginalSession from "./orignal-session";
import EmptySession from "./empty-session";
import { useRouter } from "next/navigation";

interface ExtendedCashSession extends CashSession {
  member: Member;
  season: Season;
  week: Week;
}

interface Props {
  sessions: ExtendedCashSession[];
  week: Week;
  season: Season;
}

function EditSessionForm({ sessions, week, season }: Props) {
  const { toast } = useToast();
  const router = useRouter();
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
      if (
        !_.isEqual(editingSessions, currentSessions) ||
        sessionsToRemove.length
      ) {
        setHasEdits(true);
      } else {
        setHasEdits(false);
      }
    }
  }, [editingSessions, currentSessions, isMounted]);

  const saveEdits = async () => {
    const newEditedSessions = [...editingSessions].map((session) => {
      const isRemoved = sessionsToRemove.some((s) => s.id === session.id);
      if (isRemoved) {
        return {
          ...session,
          rebuys: 0,
          buy_in: 0,
          cash_out: 0,
          net_profit: 0,
        }; // Skip removed sessions
      }
      return session;
    });

    const sortedSessions = newEditedSessions.sort((a, b) => {
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
        setLoading(false);
        router.push(`/admin/stats/cash?year=${season.year}`);
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
        <h2 className="">
          Total Sessions ({editingSessions.filter((s) => s.rebuys > 0).length})
        </h2>
        <p className="text-sm text-neutral-400">
          Week {week.week_number}, {season.year}
        </p>
        {hasEdits &&
          createPortal(
            <button
              onClick={saveEdits}
              className="flex mt-auto relative bottom-12 w-full text-sm md:text-base items-center justify-center h-14 text-white bg-primary hover:bg-primary-hover font-medium">
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

            if (!isEdited && !isPlayedSession) {
              return (
                <EmptySession
                  key={session.id}
                  session={session}
                  setEditingSessions={setEditingSessions}
                />
              );
            }

            if (isEdited && !isRemoved) {
              return (
                <EditedSession
                  key={session.id}
                  session={session}
                  originalSession={originalSession}
                  cashOutInputs={cashOutInputs}
                  setCashOutInputs={setCashOutInputs}
                  buyInInputs={buyInInputs}
                  setBuyInInputs={setBuyInInputs}
                  setEditingSessions={setEditingSessions}
                  setSessionsToRemove={setSessionsToRemove}
                  editingSessions={editingSessions}
                  buyInInputRefs={buyInInputRefs}
                  rawBuyIn={rawBuyIn}
                  cashOutInputRefs={cashOutInputRefs}
                  rawCashOut={rawCashOut}
                />
              );
            }

            if (isRemoved) {
              return (
                <RemovedSession
                  key={session.id}
                  session={session}
                  originalSession={originalSession}
                  setCashOutInputs={setCashOutInputs}
                  setBuyInInputs={setBuyInInputs}
                  setEditingSessions={setEditingSessions}
                  setSessionsToRemove={setSessionsToRemove}
                  editingSessions={editingSessions}
                  buyInInputRefs={buyInInputRefs}
                  rawBuyIn={rawBuyIn}
                  cashOutInputRefs={cashOutInputRefs}
                  rawCashOut={rawCashOut}
                />
              );
            }

            return (
              <OriginalSession
                key={session.id}
                session={session}
                originalSession={originalSession}
                cashOutInputs={cashOutInputs}
                setCashOutInputs={setCashOutInputs}
                buyInInputs={buyInInputs}
                setBuyInInputs={setBuyInInputs}
                setEditingSessions={setEditingSessions}
                setSessionsToRemove={setSessionsToRemove}
                editingSessions={editingSessions}
                buyInInputRefs={buyInInputRefs}
                rawBuyIn={rawBuyIn}
                cashOutInputRefs={cashOutInputRefs}
                rawCashOut={rawCashOut}
              />
            );
          })}
        </ul>
      </div>
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
