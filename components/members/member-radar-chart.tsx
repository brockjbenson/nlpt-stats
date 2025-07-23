"use client";

import { Circle, TrendingUp } from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

export const description = "A radar chart with a grid and circle fill";

interface Props {
  data: {
    avg_rebuys: {
      nlpt: number;
      member: number;
    };
    session_avg: {
      nlpt: number;
      member: number;
    };
    avg_roi: {
      nlpt: number;
      member: number;
    };
    avg_buy_in: {
      nlpt: number;
      member: number;
    };
    avg_win_percentage: {
      nlpt: number;
      member: number;
    };
  };
}

export function MemberRadarChart({ data }: Props) {
  const { avg_rebuys, session_avg, avg_roi, avg_buy_in, avg_win_percentage } =
    data;
  const BASELINE = 1; // fixed baseline for NLPT (controls circle size)

  const scaleValue = (value: number, baseline: number) =>
    (value / baseline) * BASELINE;

  const chartData = [
    {
      stat: "Avg Rebuys",
      player: scaleValue(avg_rebuys.member, avg_rebuys.nlpt),
      nlpt: BASELINE,
      rawPlayer: avg_rebuys.member.toFixed(2),
      rawNlpt: avg_rebuys.nlpt.toFixed(2),
    },
    {
      stat: "ROI",
      player: scaleValue(avg_roi.member, avg_roi.nlpt),
      nlpt: BASELINE,
      rawPlayer: `${avg_roi.member.toFixed(2)}%`,
      rawNlpt: `${avg_roi.nlpt.toFixed(2)}%`,
    },
    {
      stat: "Avg Buy-in",
      player: scaleValue(avg_buy_in.member, avg_buy_in.nlpt),
      nlpt: BASELINE,
      rawPlayer: avg_buy_in.member.toFixed(2),
      rawNlpt: avg_buy_in.nlpt.toFixed(2),
    },
    {
      stat: "Avg Win",
      player: scaleValue(session_avg.member, session_avg.nlpt),
      nlpt: BASELINE,
      rawPlayer: session_avg.member.toFixed(2),
      rawNlpt: session_avg.nlpt.toFixed(2),
    },
    {
      stat: "Avg Win %",
      player: scaleValue(avg_win_percentage.member, avg_win_percentage.nlpt),
      nlpt: BASELINE,
      rawPlayer: `${avg_win_percentage.member.toFixed(2)}%`,
      rawNlpt: `${avg_win_percentage.nlpt.toFixed(2)}%`,
    },
  ];

  const chartConfig = {
    player: {
      label: "Player Avg",
      color: "var(--chart-1)",
    },
    nlpt: {
      label: "NLPT Avg",
      color: "var(--chart-2)",
    },
  } satisfies ChartConfig;
  return (
    <Card className="w-full bg-background p-0 border-none mx-auto">
      <CardHeader className="items-center">
        <CardTitle className="text-left w-full px-2 pt-4">
          NLPT Skill Profile
        </CardTitle>
        <div className="flex flex-col absolute right-2 top-4 items-end gap-2 text-muted-foreground">
          <div className="flex items-center justify-end gap-2 text-xs">
            NLPT Average
            <span className="w-4 h-4 border border-dashed border-muted-foreground" />
          </div>
          <div className="flex items-center justify-end gap-2 text-xs">
            Player Average
            <span className="w-4 h-4 flex bg-primary/20 border border-primary/50" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full">
          <RadarChart outerRadius="67%" data={chartData}>
            <ChartTooltip
              labelClassName="z-20"
              cursor={false}
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const dataPoint = payload[0].payload; // Access full data object

                  return (
                    <div className="bg-black text-white p-2 rounded">
                      <div className="font-bold">{dataPoint.stat}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">Player Avg:</span>
                        <span>{dataPoint.rawPlayer}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">NLPT Avg:</span>
                        <span>{dataPoint.rawNlpt}</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow
                  dx="0"
                  dy="0"
                  stdDeviation="2" // Blur strength
                  floodColor="white"
                  floodOpacity="0.6" // Glow opacity
                />
              </filter>
            </defs>
            <PolarGrid
              strokeWidth={1}
              stroke="white"
              className="fill-neutral-500 opacity-15 border-white"
              gridType="circle"
            />
            <PolarAngleAxis
              tick={{ fontSize: 10, fontWeight: 500 }}
              dataKey="stat"
            />
            <PolarRadiusAxis
              domain={[0, 2]}
              scale="linear"
              tickCount={3}
              tick={false}
              tickLine={false}
              axisLine={false}
            />

            <Radar
              dataKey="player"
              stroke="hsl(var(--primary))"
              strokeWidth={1}
              strokeOpacity={0.75}
              fill="hsl(var(--primary))"
              fillOpacity={0.2}
              dot={{
                r: 3,
                fillOpacity: 1,
              }}
            />
            <Radar
              dataKey="nlpt"
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              fillOpacity={0}
              radius={100}
              filter="url(#glow)" // Apply the glow filt
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
