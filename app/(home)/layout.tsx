import BottomTabs from "@/components/bottom-tabs";
import Header from "@/components/header";
import MainWrapper from "@/components/main-wrapper";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <MainWrapper>
        <div className="max-w-screen-lg mx-auto w-full">{children}</div>
      </MainWrapper>
      <BottomTabs />
    </>
  );
}
