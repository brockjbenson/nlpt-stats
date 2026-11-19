import ErrorHandler from "@/components/error-handler";
import { ADMIN_ACTION_CLASS } from "@/components/admin-nav/admin-action";
import DesktopPageHeader from "@/components/page-header/desktop-page-header";
import PageHeader from "@/components/page-header/page-header";
import { Card } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/server";
import { Season } from "@/utils/types";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

// Admin cash sessions: pick a season to see its weeks and edit them.
async function CashGames() {
  const db = await createClient();
  const { data: seasons, error } = await db
    .from("season")
    .select("*")
    .order("year", { ascending: false });

  if (error) {
    return (
      <ErrorHandler
        title="Error fetching seasons"
        errorMessage={error.message}
        pageTitle="Cash Sessions"
      />
    );
  }

  return (
    <>
      <PageHeader title="Cash Sessions" />
      <DesktopPageHeader title="Cash Sessions" />
      <div className="flex justify-end px-2 mb-4">
        <Link className={ADMIN_ACTION_CLASS} href="/admin/stats/cash/new">
          Add Sessions
        </Link>
      </div>
      <ul className="flex flex-col gap-3 px-2 pb-8">
        {(seasons as Season[]).map((season) => (
          <li key={season.id}>
            <Link href={`/admin/stats/cash/${season.id}/sessions`}>
              <Card className="flex-row items-center justify-between px-4 py-4 hover:border-primary transition-colors">
                <span className="text-lg font-semibold">{season.year}</span>
                <span className="flex items-center gap-1 text-sm text-muted">
                  Weeks
                  <ChevronRight className="size-4" />
                </span>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

export default CashGames;
