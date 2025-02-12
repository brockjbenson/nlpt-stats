import React from "react";
import NavigateBack from "../back-button/back-button";
import HeaderAuth from "@/components/header-auth";
import PageHeaderWrapper from "./page-header-wrapper";

interface props {
  children?: React.ReactNode;
  skeleton?: boolean;
  title?: string;
}

function PageHeader({ children, skeleton = false, title }: props) {
  if (skeleton) {
    return (
      <PageHeaderWrapper>
        <div className="grid grid-cols-[min-content_1fr_min-content] gap-2 w-full">
          <div className="h-[32px] bg-neutral-700 rounded w-16"></div>
          <div className="bg-neutral-700 mx-auto rounded w-32 h-[36px] "></div>
          <div className="bg-neutral-700 h-[32px] rounded-full w-16 aspect-square "></div>
        </div>
      </PageHeaderWrapper>
    );
  }
  return (
    <PageHeaderWrapper>
      <div className="grid grid-cols-[65px_1fr_65px] gap-2 w-full">
        <NavigateBack />
        {title && (
          <h1 className="text-xl text-center md:text-2xl font-bold">{title}</h1>
        )}
        {children && children}
        <HeaderAuth />
      </div>
    </PageHeaderWrapper>
  );
}

export default PageHeader;
