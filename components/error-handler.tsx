import React from "react";
import PageHeader from "./page-header/page-header";
import { AlertCircleIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";

interface Props {
  children?: React.ReactNode;
  errorMessage?: string;
  title: string;
  pageTitle: string;
  headerClassName?: string;
}

function ErrorHandler({
  children,
  errorMessage,
  title,
  pageTitle,
  headerClassName,
}: Props) {
  return (
    <>
      <PageHeader className={headerClassName} title={pageTitle} />

      <div className="px-2 w-full">
        <Alert variant="destructive">
          <AlertCircleIcon className="w-5! h-5!" />
          <AlertTitle>{title}.</AlertTitle>
          <AlertDescription>
            <p>{errorMessage}.</p>
            {children}
          </AlertDescription>
        </Alert>
      </div>
    </>
  );
}

export default ErrorHandler;
