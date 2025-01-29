"use client";

import { createClient } from "@/utils/supabase/client";
import { CashSession, Week } from "@/utils/types";
import React, { useEffect } from "react";

interface Sessions extends CashSession {
  week: {
    week_number: number;
  };
}

function Admin() {
  const db = createClient();

  const [sessions, setSessions] = React.useState<Sessions[]>([]);
  const [weeks, setWeeks] = React.useState<Week[]>([]);
  const memberId = "11c181af-6f37-4e6b-9b92-393a24ee00b9";

  const getSessions = async () => {
    const { data: sessions, error: sessionsError } = await db
      .from("cashSession")
      .select(`*, week:weekId(weekNumber)`)
      .eq("memberId", memberId)
      .eq("seasonId", "14277a07-c1ef-493c-a060-548396b7eb45");

    if (sessionsError) {
      console.error(sessionsError);
    } else {
      setSessions(sessions);
    }
  };
  const getWeeks = async () => {
    const { data: weeks, error: weeksError } = await db
      .from("week")
      .select(`*`)
      .eq("seasonId", "14277a07-c1ef-493c-a060-548396b7eb45")
      .order("weekNumber", { ascending: true });

    if (weeksError) {
      console.error(weeks);
    } else {
      setWeeks(weeks);
    }
  };

  useEffect(() => {
    getSessions();
    getWeeks();
  }, []);

  const sessionsOrderedByWeek = sessions.sort((a, b) => {
    return a.week.week_number - b.week.week_number;
  });

  const missingWeeks = weeks.filter((week) => {
    return !sessionsOrderedByWeek.find(
      (session) => session.week.week_number === week.week_number
    );
  });

  const insertDataForMissingWeeks = async () => {
    console.log("Inserting data for missing weeks", missingWeeks);

    const missingWeeksData = missingWeeks.map((week) => {
      return {
        memberId: memberId,
        seasonId: "14277a07-c1ef-493c-a060-548396b7eb45",
        weekId: week.id,
        buyIn: 0,
        cashOut: 0,
        netProfit: 0,
        rebuys: 0,
        nlpiPoints: 0,
        poyPoints: 0,
      };
    });

    const { error } = await db.from("cashSession").insert(missingWeeksData);
    if (error) {
      console.error(error);
    }
    console.log("Inserted data for missing weeks");
  };

  return <button onClick={insertDataForMissingWeeks}>Update</button>;
}

export default Admin;
