"use client";

import { Member, Season, Week } from "@/utils/types";
import React, { Suspense } from "react";
import { cn } from "@/lib/utils";
import useAddCashSessions from "../../../hooks/useAddCashSessions";
import Sessions from "./session-list/sessions";
import SeasonWeekSelector from "./season-week-selector";
import FloatingAddButton from "./floating-add-button";
import LoadingOverlay from "./loading-overlay";
import ConfirmDialog from "./confirm-dialog";
import ErrorDialog from "./error-dialog";

interface Props {
  members: Member[];
  seasons: Season[];
  weeks: Week[];
}

function AddCashSessions({ members, seasons, weeks }: Props) {
  const {
    selectedSeason,
    selectedSeasonId,
    selectedWeekId,
    sessionsToAdd,
    selectWeeks,
    usedWeekIds,
    loading,
    error,
    confirmAdd,
    canAddSessions,
    isFormValid,
    setSessionsToAdd,
    setSelectedSeasonId,
    setSelectedWeekId,
    setConfirmAdd,
    setError,
    addNewSession,
    removeSession,
    addSessions,
  } = useAddCashSessions({ seasons, weeks, members });

  const [isHydrated, setIsHydrated] = React.useState(false);

  React.useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Show loading skeleton instead of null
  if (!isHydrated) {
    return (
      <div className="w-full px-2 max-w-(--breakpoint-lg) mx-auto">
        <div className="h-12.5 mb-4 bg-muted/50 animate-pulse rounded" />
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="h-10 bg-muted/50 animate-pulse rounded" />
          <div className="h-10 bg-muted/50 animate-pulse rounded" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "w-full px-2 mt-4 max-w-(--breakpoint-lg) mx-auto transition-all",
          canAddSessions && "pb-13 md:pb-20"
        )}>
        {/* Season & Week Selector */}
        <SeasonWeekSelector
          seasons={seasons}
          selectWeeks={selectWeeks}
          usedWeekIds={usedWeekIds}
          selectedSeasonId={selectedSeasonId}
          selectedWeekId={selectedWeekId}
          selectedSeason={selectedSeason}
          onSeasonChange={setSelectedSeasonId}
          onWeekChange={setSelectedWeekId}
        />

        {/* Sessions List */}
        <div className="w-full relative mt-8">
          {!isFormValid && (
            <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-[1px] rounded-lg flex items-center justify-center">
              <p className="text-sm text-muted-foreground text-center px-4">
                Please select a season and week to add sessions
              </p>
            </div>
          )}
          <Suspense
            fallback={
              <div className="h-96 bg-muted/50 animate-pulse rounded" />
            }>
            <Sessions
              removeSession={removeSession}
              setSessionsToAdd={setSessionsToAdd}
              addNewSession={addNewSession}
              sessionsToAdd={sessionsToAdd}
              members={members}
            />
          </Suspense>
        </div>
      </div>

      {/* Dialogs */}
      <ConfirmDialog
        open={confirmAdd}
        onOpenChange={setConfirmAdd}
        onConfirm={addSessions}
      />

      <ErrorDialog error={error} onClose={() => setError(undefined)} />

      {/* Loading Overlay */}
      {loading && <LoadingOverlay />}

      {/* Floating Action Button */}
      {canAddSessions && (
        <FloatingAddButton
          sessions={sessionsToAdd}
          onClick={() => setConfirmAdd(true)}
        />
      )}
    </>
  );
}

export default AddCashSessions;
