import React from "react";
import PageHeader from "./page-header/page-header";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children?: React.ReactNode;
  className?: string;
  errorMessage: string;
  title: string;
  pageTitle: string;
}

function ErrorHandler({
  children,
  className,
  errorMessage,
  title,
  pageTitle,
}: Props) {
  return (
    <>
      <PageHeader title={pageTitle} />
      <div
        className={cn(
          "w-full max-w-screen-xl flex flex-col gap-8 items-center mx-auto px-2",
          className
        )}>
        <h1 className="text-base font-bold md:text-xl">{title}</h1>
        <div className="flex items-center flex-col gap-4 justify-center">
          <AlertCircle className="w-16 h-16 text-theme-red" />
          <p className="text-sm max-w-[350px] md:text-base">{errorMessage}</p>
        </div>
        {children}
      </div>
    </>
  );
}

export default ErrorHandler;
