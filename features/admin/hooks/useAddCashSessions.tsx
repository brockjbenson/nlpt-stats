import useLocalStorageState from "@/hooks/use-local-storage";
import { CashSessionNoId, Member, Season, Week } from "@/utils/types";
import React, { useCallback, useMemo, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { calculateNLPIPoints } from "@/utils/nlpi-utils";
import { calculatePOYPoints, rankSessions } from "@/utils/utils";
import { useToast } from "@/hooks/use-toast";
import { addSessionAction } from "@/features/admin/actions/add-session";

interface UseAddCashSessionsProps {
  seasons: Season[];
  weeks: Week[];
  members: Member[];
}

interface UseAddCashSessionsReturn {
  // State
  selectedSeason: Season | null;
  selectedWeek: Week | null;
  selectedSeasonId: string | null;
  selectedWeekId: string | null;
  sessionsToAdd: CashSessionNoId[];
  selectWeeks: Week[];
  usedWeekIds: string[];
  loading: boolean;
  error: string | undefined;
  confirmAdd: boolean;
  canAddSessions: boolean;
  isFormValid: boolean;

  // Setters
  setSessionsToAdd: React.Dispatch<React.SetStateAction<CashSessionNoId[]>>;
  setSelectedSeasonId: (seasonId: string) => void;
  setSelectedWeekId: (weekId: string | null) => void;
  setConfirmAdd: (value: boolean) => void;
  setError: (value: string | undefined) => void;

  // Actions
  addNewSession: (member: Member) => void;
  removeSession: (memberId: string) => void;
  removeSessionByIndex: (index: number) => void;
  addSessions: () => Promise<void>;
  resetLocalSessionData: () => void;
}

const JOSH_BUY_IN = 50;
const DEFAULT_BUY_IN = 25;

function useAddCashSessions({
  seasons,
  weeks,
  members,
}: UseAddCashSessionsProps): UseAddCashSessionsReturn {
  const db = useMemo(() => createClient(), []);
  const { toast } = useToast();

  // Local storage state
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

  // Component state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [usedWeekIds, setUsedWeekIds] = useState<string[]>([]);

  // Derived state with memoization
  const selectedSeason = useMemo(
    () => seasons.find((season) => season.id === selectedSeasonId) ?? null,
    [selectedSeasonId, seasons]
  );

  const selectedWeek = useMemo(
    () => weeks.find((week) => week.id === selectedWeekId) ?? null,
    [selectedWeekId, weeks]
  );

  const canAddSessions = useMemo(
    () => sessionsToAdd.length > 0,
    [sessionsToAdd.length]
  );

  const isFormValid = useMemo(
    () => Boolean(selectedSeason && selectedWeek),
    [selectedSeason, selectedWeek]
  );

  // Fetch used weeks for a season
  const getSeasonWeeks = useCallback(
    async (seasonId: string) => {
      try {
        const seasonWeeks = weeks.filter((w) => w.season_id === seasonId);

        const { data: sessions, error: queryError } = await db
          .from("cash_session")
          .select("week_id")
          .eq("season_id", seasonId);

        if (queryError) {
          console.error("Error fetching used weeks:", queryError);
          setError("Failed to load available weeks");
          return;
        }

        const usedIds = sessions?.map((s) => s.week_id) || [];
        const availableWeeks = seasonWeeks.filter(
          (w) => !usedIds.includes(w.id)
        );

        setUsedWeekIds(usedIds);
        setSelectWeeks(availableWeeks);
      } catch (err) {
        console.error("Error in getSeasonWeeks:", err);
        setError("Failed to load available weeks");
      }
    },
    [weeks, db, setSelectWeeks]
  );

  // Handle season selection
  const handleSeasonChange = useCallback(
    (seasonId: string) => {
      setSelectedSeasonId(seasonId);
      setSelectedWeekId(null);
      getSeasonWeeks(seasonId);
    },
    [setSelectedSeasonId, setSelectedWeekId, getSeasonWeeks]
  );

  // Get buy-in amount for a member
  const getBuyInAmount = useCallback((member: Member) => {
    return member.first_name === "Josh" ? JOSH_BUY_IN : DEFAULT_BUY_IN;
  }, []);

  // Add a new session
  const addNewSession = useCallback(
    (member: Member) => {
      if (!selectedSeason || !selectedWeek) {
        console.warn("Cannot add session: season or week not selected");
        return;
      }

      const newSession: CashSessionNoId = {
        buy_in: getBuyInAmount(member),
        cash_out: 0,
        net_profit: 0,
        rebuys: 1,
        week_id: selectedWeek.id,
        season_id: selectedSeason.id,
        member_id: member.id,
        nlpi_points: 0,
        poy_points: 0,
      };

      setSessionsToAdd((prev) => [...prev, newSession]);
    },
    [selectedSeason, selectedWeek, getBuyInAmount, setSessionsToAdd]
  );

  // Remove session by member ID
  const removeSession = useCallback(
    (memberId: string) => {
      setSessionsToAdd((prev) =>
        prev.filter((session) => session.member_id !== memberId)
      );
    },
    [setSessionsToAdd]
  );

  // Remove session by index (kept for backwards compatibility)
  const removeSessionByIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= sessionsToAdd.length) {
        console.warn("Invalid session index:", index);
        return;
      }

      setSessionsToAdd((prev) => prev.filter((_, i) => i !== index));
    },
    [sessionsToAdd, setSessionsToAdd]
  );

  // Reset all form data
  const resetLocalSessionData = useCallback(() => {
    setSessionsToAdd([]);
    setSelectedSeasonId(null);
    setSelectedWeekId(null);
    setSelectWeeks([]);
  }, [
    setSessionsToAdd,
    setSelectedSeasonId,
    setSelectedWeekId,
    setSelectWeeks,
  ]);

  // Process sessions and calculate points
  const processSessionsWithPoints = useCallback(
    (sessions: CashSessionNoId[]) => {
      const sortedSessions = rankSessions(sessions);

      return sortedSessions.map((session) => ({
        ...session,
        nlpi_points: calculateNLPIPoints(session.rank!, session.net_profit),
        poy_points: calculatePOYPoints(session.net_profit),
      }));
    },
    []
  );

  // Create placeholder sessions for members who didn't play
  const createPlaceholderSessions = useCallback(
    (
      existingMemberIds: Set<string>,
      weekId: string,
      seasonId: string
    ): CashSessionNoId[] => {
      return members
        .filter((member) => !existingMemberIds.has(member.id))
        .map((member) => ({
          buy_in: 0,
          cash_out: 0,
          net_profit: 0,
          rebuys: 0,
          week_id: weekId,
          season_id: seasonId,
          member_id: member.id,
          nlpi_points: 0,
          poy_points: 0,
        }));
    },
    [members]
  );

  // Main function to add all sessions
  const addSessions = useCallback(async () => {
    if (sessionsToAdd.length === 0) {
      setError("No sessions to add");
      return;
    }

    // Group sessions by week and season
    const groupedSessions = sessionsToAdd.reduce<
      Record<string, CashSessionNoId[]>
    >((acc, session) => {
      const key = `${session.week_id}_${session.season_id}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});

    // Process each group
    const allSessionsToAdd: CashSessionNoId[] = [];

    Object.entries(groupedSessions).forEach(([key, currentSessions]) => {
      const [week_id, season_id] = key.split("_");

      // Get member IDs with sessions
      const memberIdsWithSessions = new Set(
        currentSessions.map((session) => session.member_id)
      );

      // Create placeholder sessions for missing members
      const placeholderSessions = createPlaceholderSessions(
        memberIdsWithSessions,
        week_id,
        season_id
      );

      // Process sessions with points
      const sessionsWithPoints = processSessionsWithPoints(currentSessions);

      allSessionsToAdd.push(...sessionsWithPoints, ...placeholderSessions);
    });

    // Submit to server
    try {
      setLoading(true);
      setError(undefined);

      const result = await addSessionAction(allSessionsToAdd);

      if (!result.success) {
        setError(result.message || "Failed to add sessions");
      } else {
        toast({
          title: "Success",
          description: `Added ${allSessionsToAdd.length} sessions successfully`,
        });
        resetLocalSessionData();
      }
    } catch (err) {
      console.error("Error adding sessions:", err);
      setError("An unexpected error occurred while adding sessions");
    } finally {
      setLoading(false);
      setConfirmAdd(false);
    }
  }, [
    sessionsToAdd,
    createPlaceholderSessions,
    processSessionsWithPoints,
    toast,
    resetLocalSessionData,
  ]);

  return {
    // State
    selectedSeason,
    selectedWeek,
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

    // Setters
    setSessionsToAdd,
    setSelectedSeasonId: handleSeasonChange,
    setSelectedWeekId,
    setConfirmAdd,
    setError,

    // Actions
    addNewSession,
    removeSession,
    removeSessionByIndex,
    addSessions,
    resetLocalSessionData,
  };
}

export default useAddCashSessions;
