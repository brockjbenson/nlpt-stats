import React from "react";
import NavigateBack from "../back-button/back-button";
import HeaderAuth from "@/components/header-auth";
import PageHeaderWrapper from "./page-header-wrapper";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import MobileNav from "../header/nav/mobile";

interface props {
  children?: React.ReactNode;
  skeleton?: boolean;
  title?: string;
  className?: string;
}

function PageHeader({ className, children, skeleton = false, title }: props) {
  if (skeleton) {
    return (
      <PageHeaderWrapper className={cn(className)}>
        <div className="grid grid-cols-[65px_1fr_65px] items-center gap-2 w-full">
          <Skeleton className="w-10 h-10 mr-auto rounded" />
          <Skeleton className="w-40 mx-auto h-8 rounded" />
          <Skeleton className="w-10 h-10 ml-auto rounded" />
        </div>
      </PageHeaderWrapper>
    );
  }
  return (
    <PageHeaderWrapper className={cn(className)}>
      <div className="grid grid-cols-[65px_1fr_65px] items-center gap-2 w-full">
        <Link href="/">
          <Image
            src="/icons/nlpt-no-bg.png"
            alt="logo"
            width={40}
            height={40}
          />
        </Link>
        {title && (
          <h1 className="text-xl text-center md:text-2xl font-bold">{title}</h1>
        )}
        {children && children}
        <MobileNav />
      </div>
    </PageHeaderWrapper>
  );
}

export default PageHeader;
