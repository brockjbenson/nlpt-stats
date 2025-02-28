import Header from "@/components/header";
import MobileNav from "@/components/header/mobile-nav";
import MainWrapper from "@/components/main-wrapper";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <MainWrapper>
        <div className="max-w-screen-xl mx-auto w-full">{children}</div>
      </MainWrapper>
      <MobileNav />
    </>
  );
}
