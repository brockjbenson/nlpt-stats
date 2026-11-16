import React, { Suspense } from "react";
import PageHeaderWrapper from "./page-header-wrapper";
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "../ui/skeleton";
import { cn } from "@/lib/utils";
import MobileNav from "../header/nav/mobile";
import { BackButton } from "../ui/back-button";
import { MenuIcon } from "lucide-react";

// Stands in for the menu button while the real one, which needs the
// signed-in user, loads.
const menuPlaceholder = <MenuIcon aria-hidden className="ml-auto" size={32} />;

interface props {
  children?: React.ReactNode;
  skeleton?: boolean;
  title?: string;
  className?: string;
  showBackButton?: boolean;
}

function PageHeader({
  className,
  children,
  skeleton = false,
  title,
  showBackButton = false,
}: props) {
  // Loading state (used by loading.tsx files): same layout as the real header
  // with the page title (or the page's own header contents as children), so a
  // tab tap shows the right header immediately. The menu icon is a static
  // stand-in; the real menu needs the signed-in user, which the loading state
  // doesn't wait for.
  if (skeleton) {
    return (
      <PageHeaderWrapper className={cn(className)}>
        <div className="grid grid-cols-[65px_1fr_65px] items-center gap-2 w-full">
          {showBackButton ? (
            <BackButton />
          ) : (
            <Link href="/">
              <Image
                className="ml-1"
                src="/favicon.svg"
                alt="logo"
                width={26}
                height={26}
              />
            </Link>
          )}
          {title ? (
            <h1 className="text-xl text-center md:text-2xl font-bold">
              {title}
            </h1>
          ) : (
            !children && <Skeleton className="w-40 mx-auto h-8 rounded" />
          )}
          {children}
          {menuPlaceholder}
        </div>
      </PageHeaderWrapper>
    );
  }
  return (
    <PageHeaderWrapper className={cn(className)}>
      <div className="grid grid-cols-[65px_1fr_65px] items-center gap-2 w-full">
        {showBackButton ? (
          <BackButton />
        ) : (
          <Link href="/">
            <Image
              className="ml-1"
              src="/favicon.svg"
              alt="logo"
              width={26}
              height={26}
            />
          </Link>
        )}
        {title && (
          <h1 className="text-xl text-center md:text-2xl font-bold">{title}</h1>
        )}
        {children && children}
        {/* The menu reads the signed-in user from the request, so the prebuilt
            page shows the static icon until it streams in. */}
        <Suspense fallback={menuPlaceholder}>
          <MobileNav />
        </Suspense>
      </div>
    </PageHeaderWrapper>
  );
}

export default PageHeader;
