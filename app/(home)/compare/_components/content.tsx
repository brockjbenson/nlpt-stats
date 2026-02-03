"use client";

import { CareerData, Member, Season } from "@/utils/types";
import React, { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import CompareMemberSelect from "./member-selector";
import { Card, CardContent } from "@/components/ui/card";
import MemberInfo from "./member-info";
import StatLabel from "./stat-label";
import StatRow from "./stat-row";
import StatColumn from "./stat-column";
import { formatMoney, getProfitTextColor } from "@/utils/utils";
import { Minus } from "lucide-react";

interface StatConfig {
  label: string;
  getValue: (stats: CareerData | null) => number;
  formatter?: (value: number) => string;
  colorFormatter?: (value: number) => string;
  lowerIsBetter?: boolean;
}

const STAT_CONFIGS: StatConfig[] = [
  {
    label: "Sessions",
    getValue: (stats) => stats?.career_stats.total_sessions || 0,
  },
  {
    label: "Cash Played",
    getValue: (stats) => stats?.cash_stats.sessions || 0,
  },
  {
    label: "Majors Played",
    getValue: (stats) => stats?.tournament_stats.sessions || 0,
  },
  {
    label: "Net Profit",
    getValue: (stats) => stats?.career_stats.total_net_profit || 0,
    formatter: formatMoney,
    colorFormatter: getProfitTextColor,
  },
  {
    label: "Gross Profit",
    getValue: (stats) => stats?.career_stats.total_gross_profit || 0,
    formatter: formatMoney,
    colorFormatter: getProfitTextColor,
  },
  {
    label: "Gross Losses",
    getValue: (stats) => stats?.career_stats.total_gross_losses || 0,
    formatter: formatMoney,
    colorFormatter: getProfitTextColor,
  },
  {
    label: "Session Avg",
    getValue: (stats) =>
      (stats?.career_stats.total_net_profit || 0) /
        (stats?.career_stats.total_sessions || 1) || 0,
    formatter: formatMoney,
    colorFormatter: getProfitTextColor,
  },
  {
    label: "Wins",
    getValue: (stats) => stats?.career_stats.total_wins || 0,
    formatter: undefined,
    colorFormatter: undefined,
  },
  {
    label: "Losses",
    getValue: (stats) =>
      (stats?.career_stats.total_sessions || 0) -
      (stats?.career_stats.total_wins || 0),
    formatter: undefined,
    colorFormatter: undefined,
    lowerIsBetter: true,
  },
  {
    label: "Cash Wins",
    getValue: (stats) => stats?.cash_stats.wins || 0,
    formatter: undefined,
    colorFormatter: undefined,
  },
  {
    label: "Cash Losses",
    getValue: (stats) => stats?.cash_stats.losses || 0,
    formatter: undefined,
    colorFormatter: undefined,
    lowerIsBetter: true,
  },
  {
    label: "Major Wins",
    getValue: (stats) => stats?.tournament_stats.wins || 0,
    formatter: undefined,
    colorFormatter: undefined,
  },
  {
    label: "Major Losses",
    getValue: (stats) =>
      (stats?.tournament_stats.sessions || 0) -
        (stats?.tournament_stats.wins || 0) || 0,
    formatter: undefined,
    colorFormatter: undefined,
    lowerIsBetter: true,
  },
  {
    label: "Win Rate",
    getValue: (stats) => {
      const wins = stats?.career_stats.total_wins || 0;
      const sessions = stats?.career_stats.total_sessions || 1;
      return sessions > 0 ? (wins / sessions) * 100 : 0;
    },
    formatter: (value) => `${value.toFixed(2)}%`,
    colorFormatter: undefined,
  },
];

function CompareContent({ members }: { members: Member[] }) {
  const currentYear = new Date().getFullYear();
  const db = createClient();
  const [currentSeason, setCurrentSeason] = React.useState<Season | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = React.useState<string[]>(
    [],
  );
  const [loading, setLoading] = React.useState<boolean>(false);
  const [memberOne, setMemberOne] = React.useState<Member | null>(null);
  const [memberTwo, setMemberTwo] = React.useState<Member | null>(null);
  const [memberOneStats, setMemberOneStats] = React.useState<CareerData | null>(
    null,
  );
  const [memberTwoStats, setMemberTwoStats] = React.useState<CareerData | null>(
    null,
  );

  useEffect(() => {
    async function fetchCurrentSeason() {
      const { data, error } = await db
        .from("season")
        .select("*")
        .eq("year", currentYear)
        .single();
      if (error) {
        console.error("Error fetching current season:", error);
        return;
      }
      setCurrentSeason(data);
    }
    fetchCurrentSeason();
  }, [db, currentYear]);

  useEffect(() => {
    async function fetchMemberStats(memberId: string) {
      const { data, error } = await db.rpc("get_career_data", {
        target_member_id: memberId,
        current_season_id: currentSeason?.id,
      });
      if (error) {
        console.error("Error fetching member stats:", error);
        return null;
      }
      return data;
    }

    async function fetchAllStats() {
      if (!memberOne && !memberTwo) return;

      setLoading(true);
      const [statsOne, statsTwo] = await Promise.all([
        memberOne ? fetchMemberStats(memberOne.id) : null,
        memberTwo ? fetchMemberStats(memberTwo.id) : null,
      ]);

      setMemberOneStats(statsOne);
      setMemberTwoStats(statsTwo);
      setLoading(false);
    }

    fetchAllStats();
  }, [memberOne, memberTwo, db, currentSeason?.id]);

  const calculateLeader = (
    value1: number,
    value2: number,
    lowerIsBetter = false,
  ) => {
    if (lowerIsBetter) {
      if (value1 < value2) return 1;
      if (value2 < value1) return -1;
    } else {
      if (value1 > value2) return 1;
      if (value2 > value1) return -1;
    }
    return 0;
  };

  console.log(selectedMemberIds);

  return (
    <div>
      {loading && (
        <div className="fixed top-0 right-0 w-screen bg-black/50 backdrop-blur-[2px] h-screen flex items-center justify-center z-50">
          <Spinner className="text-primary size-10" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center">
          {<MemberInfo member={memberOne} />}
          <CompareMemberSelect
            members={members}
            selectedMemberIds={selectedMemberIds}
            value={memberOne}
            setSelectedMember={setMemberOne}
            setSelectedMemberIds={setSelectedMemberIds}
          />
        </div>
        <div className="flex flex-col items-center justify-center">
          {<MemberInfo member={memberTwo} />}
          <CompareMemberSelect
            members={members}
            selectedMemberIds={selectedMemberIds}
            value={memberTwo}
            setSelectedMember={setMemberTwo}
            setSelectedMemberIds={setSelectedMemberIds}
          />
        </div>
      </div>

      <Card className="w-full py-1 mt-4">
        <CardContent className="flex py-0 flex-col">
          <div className="w-full flex flex-col items-center justify-center">
            {STAT_CONFIGS.map((config) => {
              const value1 = config.getValue(memberOneStats);
              const value2 = config.getValue(memberTwoStats);
              const leader = calculateLeader(
                value1,
                value2,
                config.lowerIsBetter,
              );
              const side =
                leader === 1 ? "left" : leader === -1 ? "right" : "none";

              return (
                <StatRow key={config.label}>
                  <StatColumn
                    formatter={memberOneStats ? config.formatter : undefined}
                    colorFormatter={config.colorFormatter}>
                    {memberOneStats ? (
                      value1
                    ) : (
                      <Minus className="text-muted size-4" />
                    )}
                  </StatColumn>
                  <StatLabel leaderSide={side}>{config.label}</StatLabel>
                  <StatColumn
                    formatter={memberTwoStats ? config.formatter : undefined}
                    colorFormatter={config.colorFormatter}>
                    {memberTwoStats ? (
                      value2
                    ) : (
                      <Minus className="text-muted size-4" />
                    )}
                  </StatColumn>
                </StatRow>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default CompareContent;
