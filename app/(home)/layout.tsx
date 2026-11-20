import BottomTabs from "@/components/bottom-tabs";
import Header from "@/components/header";
import MainWrapper from "@/components/main-wrapper";
import LiveClockBanner from "@/features/clock/components/live/live-clock-banner";
import { getCurrentYear } from "@/lib/data/current-year";
import React, { Suspense } from "react";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <MainWrapper>
        <div className="max-w-(--breakpoint-lg) mx-auto w-full">{children}</div>
      </MainWrapper>
      {/* The tab bar reads the URL, which on a page whose URL isn't known
          ahead of time (an admin page for one season) waits for the request. */}
      {/* While a clock is running or paused, links to its display. Loads
          after the page shows; renders nothing while no clock is live. */}
      <LiveClockBanner />
      <Suspense>
        <BottomTabs year={await getCurrentYear()} />
      </Suspense>
    </>
  );
}
